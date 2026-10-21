/**
 * Client for the admin Worker's API (worker/api.js). The admin only ever talks to its own origin: no GitHub URL, token
 * or repository name is sent from here; the Worker decides all of that from Cloudflare Access and its own settings.
 * The custom header marks the request as the admin's own; the Worker refuses API calls without it.
 */
export class ApiError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    this.conflict = Boolean(extra.conflict);
    this.fields = extra.fields ?? null;
  }
}

async function request(method, path, body) {
  let res;
  try {
    res = await fetch(`/api/${path}`, {
      method,
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { 'X-TechPi-Admin': '1', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'The admin could not be reached. Check your connection and try again.');
  }
  let data = null;
  try { data = await res.json(); } catch {}
  if (!res.ok) {
    // Cloudflare Access may answer an expired session with a sign-in page instead of JSON.
    const message = data?.error?.message ?? (res.status === 401 || res.status === 403 ? 'Your session has ended. Reload the page to sign in again.' : `Unexpected response (${res.status}).`);
    throw new ApiError(res.status, message, data?.error ?? {});
  }
  if (data === null) throw new ApiError(res.status, 'Your session may have ended. Reload the page to sign in again.');
  return data;
}

export const api = {
  session: () => request('GET', 'session'),
  listDemo: () => request('GET', 'm0-demo'),
  getDemo: (slug) => request('GET', `m0-demo/${encodeURIComponent(slug)}`),
  listCaseStudies: () => request('GET', 'case-studies'),
  getCaseStudy: (slug) => request('GET', `case-studies/${encodeURIComponent(slug)}`),
  saveCaseStudyDraft: (slug, content, expectedSha) => request('POST', `case-studies/${encodeURIComponent(slug)}/draft`, { content, expectedSha }),
  listInsights: () => request('GET', 'insights'),
  getInsight: (slug) => request('GET', `insights/${encodeURIComponent(slug)}`),
  saveInsightDraft: (slug, content, expectedSha) => request('POST', `insights/${encodeURIComponent(slug)}/draft`, { content, expectedSha }),
  listPages: () => request('GET', 'pages'),
  getPage: (key) => request('GET', `pages/${encodeURIComponent(key)}`),
  savePageDraft: (key, content, expectedSha) => request('POST', `pages/${encodeURIComponent(key)}/draft`, { content, expectedSha }),
  saveDemoDraft: (slug, content, expectedSha) => request('POST', `m0-demo/${encodeURIComponent(slug)}/draft`, { content, expectedSha }),
};
