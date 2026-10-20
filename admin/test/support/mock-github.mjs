// In-memory mock of the GitHub REST endpoints the admin Worker uses, for automated tests. No network, no real GitHub.
// It verifies the App JWT signature, issues installation tokens, enforces blob-SHA conflicts like the Contents API,
// refuses writes to `main` (as the repository's ruleset does), and records every request for assertions.
import crypto from 'node:crypto';
import http from 'node:http';

const OWNER = 'gianniskim1990';
const REPO = 'techpi-website';
const gitSha = (text) => crypto.createHash('sha1').update(`blob ${Buffer.byteLength(text)}\0${text}`).digest('hex');
const commitSha = () => crypto.randomBytes(20).toString('hex');

export function createMockGitHub({ publicKey, appId = '123456', installationId = '7890', branches = {} }) {
  const state = {
    branches: {}, // name -> { head, files: Map(path -> text) }
    prs: [],
    tokens: new Map(), // token -> { expiresAt }
    log: [],
    writes: [], // { method, path, branch }
    failures: [], // queued { match: RegExp, status } or { match, network: true }
    tokenRequests: 0,
  };
  for (const [name, files] of Object.entries(branches)) state.branches[name] = { head: commitSha(), files: new Map(Object.entries(files)) };

  const json = (status, data) => new Response(data === undefined ? null : JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
  const verifyJwt = (auth) => {
    const jwt = (auth || '').replace(/^Bearer /, '');
    const [h, p, s] = jwt.split('.');
    if (!s) return false;
    const ok = crypto.verify('RSA-SHA256', Buffer.from(`${h}.${p}`), publicKey, Buffer.from(s, 'base64url'));
    const claims = JSON.parse(Buffer.from(p, 'base64url').toString());
    const now = Math.floor(Date.now() / 1000);
    return ok && claims.iss === appId && claims.exp > now && claims.iat <= now && claims.exp - claims.iat <= 600;
  };

  async function handle(method, url, headers, bodyText) {
    const u = new URL(url);
    const path = u.pathname;
    state.log.push(`${method} ${path}${u.search}`);
    const fail = state.failures.findIndex((f) => f.match.test(`${method} ${path}`));
    if (fail >= 0) {
      const f = state.failures.splice(fail, 1)[0];
      if (f.network) throw new TypeError('fetch failed');
      return json(f.status, { message: 'injected failure' });
    }
    const body = bodyText ? JSON.parse(bodyText) : null;

    let m = path.match(/^\/app\/installations\/(\d+)\/access_tokens$/);
    if (m && method === 'POST') {
      state.tokenRequests++;
      if (!verifyJwt(headers.authorization)) return json(401, { message: 'A JSON web token could not be decoded' });
      if (m[1] !== installationId) return json(404, { message: 'Not Found' });
      if (JSON.stringify(body?.repositories) !== JSON.stringify([REPO])) return json(422, { message: 'repositories must be this repository' });
      const token = `ghs_mock_${crypto.randomBytes(8).toString('hex')}`;
      const expiresAt = Date.now() + 60 * 60 * 1000;
      state.tokens.set(token, { expiresAt });
      return json(201, { token, expires_at: new Date(expiresAt).toISOString(), permissions: body.permissions, repository_selection: 'selected' });
    }

    const prefix = `/repos/${OWNER}/${REPO}`;
    if (!path.startsWith(prefix)) return json(404, { message: 'Not Found' });
    const token = (headers.authorization || '').replace(/^Bearer /, '');
    const t = state.tokens.get(token);
    if (!t || t.expiresAt < Date.now()) return json(401, { message: 'Bad credentials' });
    const rest = path.slice(prefix.length);

    if ((m = rest.match(/^\/git\/ref\/heads\/(.+)$/)) && method === 'GET') {
      const b = state.branches[m[1]];
      return b ? json(200, { ref: `refs/heads/${m[1]}`, object: { sha: b.head, type: 'commit' } }) : json(404, { message: 'Not Found' });
    }
    if (rest === '/git/refs' && method === 'POST') {
      const name = body.ref.replace(/^refs\/heads\//, '');
      if (state.branches[name]) return json(422, { message: 'Reference already exists' });
      const from = Object.values(state.branches).find((b) => b.head === body.sha);
      if (!from) return json(422, { message: 'Object does not exist' });
      state.branches[name] = { head: body.sha, files: new Map(from.files) };
      state.writes.push({ method, path: rest, branch: name });
      return json(201, { ref: body.ref, object: { sha: body.sha } });
    }
    if ((m = rest.match(/^\/git\/refs\/heads\/(.+)$/)) && method === 'PATCH') {
      if (m[1] === 'main') return json(422, { message: 'Protected branch' });
      const from = Object.values(state.branches).find((b) => b.head === body.sha);
      if (!state.branches[m[1]] || !from) return json(422, { message: 'Reference does not exist' });
      state.branches[m[1]] = { head: body.sha, files: new Map(from.files) };
      state.writes.push({ method, path: rest, branch: m[1] });
      return json(200, { ref: `refs/heads/${m[1]}`, object: { sha: body.sha } });
    }
    if ((m = rest.match(/^\/contents\/(.+)$/))) {
      const file = decodeURIComponent(m[1]);
      if (method === 'GET') {
        const b = state.branches[u.searchParams.get('ref')];
        if (!b) return json(404, { message: 'No commit found for the ref' });
        if (b.files.has(file)) { const text = b.files.get(file); return json(200, { type: 'file', path: file, sha: gitSha(text), content: Buffer.from(text).toString('base64').replace(/(.{60})/g, '$1\n') }); }
        const children = new Set([...b.files.keys()].filter((p) => p.startsWith(file + '/')).map((p) => p.slice(file.length + 1).split('/')[0]));
        if (!children.size) return json(404, { message: 'Not Found' });
        return json(200, [...children].map((name) => ({ type: [...b.files.keys()].includes(`${file}/${name}`) ? 'file' : 'dir', name, path: `${file}/${name}` })));
      }
      if (method === 'PUT') {
        if (body.branch === 'main') return json(409, { message: 'Repository rule violations found: Changes must be made through a pull request.' });
        const b = state.branches[body.branch];
        if (!b) return json(404, { message: 'Branch not found' });
        const currentText = b.files.get(file);
        if (currentText !== undefined && body.sha !== gitSha(currentText)) return json(409, { message: `${file} does not match ${body.sha}` });
        const text = Buffer.from(body.content, 'base64').toString();
        b.files.set(file, text);
        b.head = commitSha();
        state.writes.push({ method, path: rest, branch: body.branch, message: body.message });
        return json(200, { content: { path: file, sha: gitSha(text) }, commit: { sha: b.head, html_url: `https://github.com/${OWNER}/${REPO}/commit/${b.head}`, message: body.message } });
      }
    }
    if (rest === '/pulls' && method === 'GET') {
      const head = u.searchParams.get('head');
      const base = u.searchParams.get('base');
      const list = state.prs.filter((p) => p.state === 'open' && (!base || p.base.ref === base) && (!head || `${OWNER}:${p.head.ref}` === head));
      return json(200, list);
    }
    if (rest === '/pulls' && method === 'POST') {
      if (state.prs.some((p) => p.state === 'open' && p.head.ref === body.head && p.base.ref === body.base)) return json(422, { message: 'A pull request already exists' });
      const number = 100 + state.prs.length;
      const pr = { number, state: 'open', draft: body.draft === true, title: body.title, body: body.body, html_url: `https://github.com/${OWNER}/${REPO}/pull/${number}`, head: { ref: body.head, repo: { full_name: `${OWNER}/${REPO}` } }, base: { ref: body.base } };
      state.prs.push(pr);
      state.writes.push({ method, path: rest, branch: body.head, base: body.base });
      return json(201, pr);
    }
    return json(404, { message: `mock: not implemented ${method} ${rest}` });
  }

  return {
    state,
    appId,
    installationId,
    /** A fetch implementation backed by the mock. */
    fetch: async (input, init = {}) => {
      const url = typeof input === 'string' ? input : input.url;
      const headers = Object.fromEntries(Object.entries(init.headers || {}).map(([k, v]) => [k.toLowerCase(), v]));
      return handle(init.method || 'GET', url, headers, init.body ?? null);
    },
    expireAllTokens: () => { for (const t of state.tokens.values()) t.expiresAt = 0; },
    failNext: (match, status) => state.failures.push({ match, status }),
    failNetworkNext: (match) => state.failures.push({ match, network: true }),
    /** Writes a file on a branch directly (simulates someone else changing it). */
    externalEdit: (branch, file, text) => { const b = state.branches[branch]; b.files.set(file, text); b.head = commitSha(); },
    fileOn: (branch, file) => state.branches[branch]?.files.get(file),
    /** Serves the mock over HTTP on 127.0.0.1 (for wrangler dev end-to-end tests). */
    listen: (port) => new Promise((resolve) => {
      const server = http.createServer(async (req, res) => {
        let data = '';
        req.on('data', (c) => (data += c));
        req.on('end', async () => {
          try {
            const r = await handle(req.method, `http://127.0.0.1:${port}${req.url}`, req.headers, data || null);
            res.writeHead(r.status, { 'Content-Type': 'application/json' });
            res.end(await r.text());
          } catch { res.destroy(); }
        });
      });
      server.listen(port, '127.0.0.1', () => resolve(server));
    }),
  };
}

export { gitSha };
