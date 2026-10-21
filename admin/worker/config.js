/**
 * Content configuration of the admin Worker (Task M4). Everything fails closed: a missing or inconsistent setting stops
 * the content API (503) instead of falling back to a default.
 *
 *   CONTENT_MODE         `development` (default) or `production`.
 *   CONTENT_BASE_BRANCH  the branch the admin reads published content from, and that draft pull requests target.
 *                        development: any branch except `main` and the `cms/` draft branches (it must be set; there is
 *                                     no default).
 *                        production:  exactly `main`. `main` is accepted only in production mode, so it can never be
 *                                     reached by accident. The admin still never writes to it: every save goes to a
 *                                     `cms/` draft branch and a pull request, which the owner reviews and merges.
 *   ADMIN_HOSTNAME       production only: the hostname the admin is served on (proposed: admin.techpi.eu). Requests for
 *                        any other host (workers.dev, a preview URL, localhost) are refused.
 *   ENABLE_TEST_CONTENT  development only: `true` shows the M0 test collection. Refused in production.
 *
 * Production also refuses local-test settings: the GitHub API override (the local mock), reserved test identities
 * (example.test / example.com addresses) and test audience tags.
 */
export const MODES = ['development', 'production'];
const BRANCH = /^[A-Za-z0-9._/-]{1,100}$/;
const TEST_EMAIL = /@(?:[a-z0-9-]+\.)*(?:example\.(?:com|org|net|test)|[a-z0-9-]+\.test|localhost)$/i;
const TEST_AUD = /(?:^|[^a-z])(?:test|local|dev|example)(?:[^a-z]|$)/i;

/** The content mode and base branch, or the problems that stop the content API. */
export function contentConfig(env) {
  const problems = [];
  const mode = String(env.CONTENT_MODE ?? '').trim() || 'development';
  if (!MODES.includes(mode)) problems.push('CONTENT_MODE must be "development" or "production".');
  const base = String(env.CONTENT_BASE_BRANCH ?? '').trim();
  if (!base) problems.push('CONTENT_BASE_BRANCH is not set.');
  else if (!BRANCH.test(base) || base.includes('..') || base.startsWith('cms/') || base.startsWith('/') || base.endsWith('/')) problems.push('CONTENT_BASE_BRANCH is not an allowed branch name.');
  else if (mode === 'development' && base === 'main') problems.push('main is accepted only with CONTENT_MODE=production.');
  else if (mode === 'production' && base !== 'main') problems.push('In production mode the base branch must be main.');
  const testContent = mode === 'development' && String(env.ENABLE_TEST_CONTENT ?? '') === 'true';
  return { ok: problems.length === 0, mode, base: problems.length ? null : base, testContent, problems };
}

/**
 * Production-only checks on the deployment itself, run before anything is served. Returns a list of problems; empty
 * when the request may proceed. Never includes a secret or a configured value, only what is wrong.
 */
export function productionProblems(env, url) {
  const mode = String(env.CONTENT_MODE ?? '').trim() || 'development';
  if (mode !== 'production') return [];
  const problems = [];
  const host = String(env.ADMIN_HOSTNAME ?? '').trim().toLowerCase();
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host)) problems.push('ADMIN_HOSTNAME is not set.');
  else if (url.hostname.toLowerCase() !== host || url.protocol !== 'https:') problems.push('This host is not the admin hostname.');
  if (String(env.GITHUB_API_BASE ?? '').trim()) problems.push('GITHUB_API_BASE (the local test override) must not be set.');
  if (String(env.ENABLE_TEST_CONTENT ?? '') === 'true') problems.push('ENABLE_TEST_CONTENT must not be set.');
  const emails = String(env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim()).filter(Boolean);
  if (emails.some((e) => TEST_EMAIL.test(e))) problems.push('ADMIN_EMAILS contains a test address.');
  if (TEST_AUD.test(String(env.ACCESS_AUD ?? ''))) problems.push('ACCESS_AUD looks like a test value.');
  return problems;
}
