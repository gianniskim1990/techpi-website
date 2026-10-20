// GitHub App key handling and JWT signing (worker/github.js), checked with a locally generated test key.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { importPrivateKey, appJwt, apiBase, githubConfig, GitHubError } from '../worker/github.js';

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const pkcs1 = privateKey.export({ type: 'pkcs1', format: 'pem' });
const pkcs8 = privateKey.export({ type: 'pkcs8', format: 'pem' });
const decode = (part) => JSON.parse(Buffer.from(part, 'base64url').toString());

test('PKCS#1 (GitHub’s format), PKCS#8 and one-line escaped keys all sign valid RS256 JWTs', async () => {
  for (const pem of [pkcs1, pkcs8, pkcs1.replace(/\n/g, '\\n')]) {
    const key = await importPrivateKey(pem);
    const now = Math.floor(Date.now() / 1000);
    const jwt = await appJwt('123456', key, now);
    const [h, p, s] = jwt.split('.');
    assert.equal(decode(h).alg, 'RS256');
    const claims = decode(p);
    assert.equal(claims.iss, '123456');
    assert.equal(claims.iat, now - 60);
    assert.equal(claims.exp, now + 540, 'valid for at most 10 minutes, as GitHub requires');
    assert.ok(crypto.verify('RSA-SHA256', Buffer.from(`${h}.${p}`), publicKey, Buffer.from(s, 'base64url')), 'signature verifies');
  }
});

test('a malformed key is refused with a safe message', async () => {
  for (const pem of ['not a key', '-----BEGIN PRIVATE KEY-----\nAAAA\n-----END PRIVATE KEY-----']) {
    await assert.rejects(importPrivateKey(pem), (e) => e instanceof GitHubError && e.status === 503 && !/AAAA/.test(e.message));
  }
});

test('the API base can only be overridden to a local test server', () => {
  assert.equal(apiBase({}), 'https://api.github.com');
  assert.equal(apiBase({ GITHUB_API_BASE: 'https://evil.example' }), 'https://api.github.com');
  assert.equal(apiBase({ GITHUB_API_BASE: 'http://localhost:9000' }), 'https://api.github.com');
  assert.equal(apiBase({ GITHUB_API_BASE: 'http://127.0.0.1:9000' }), 'http://127.0.0.1:9000');
});

test('configuration check names what is missing and never returns the key', () => {
  const c = githubConfig({ GITHUB_APP_ID: 'abc', GITHUB_APP_INSTALLATION_ID: '1', GITHUB_APP_PRIVATE_KEY: '' });
  assert.equal(c.configured, false);
  assert.deepEqual(c.missing, ['GITHUB_APP_ID', 'GITHUB_APP_PRIVATE_KEY']);
  assert.ok(githubConfig({ GITHUB_APP_ID: '1', GITHUB_APP_INSTALLATION_ID: '2', GITHUB_APP_PRIVATE_KEY: pkcs1 }).configured);
});
