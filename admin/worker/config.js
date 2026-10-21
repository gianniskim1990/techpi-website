/**
 * Configuration of the admin Worker (Tasks M4 and AUTH-G1). Everything fails closed: a missing or inconsistent setting
 * stops the admin (503) instead of falling back to a default.
 *
 * Content:
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
 * Sign-in with GitHub (Task AUTH-G1, auth.js), required in every mode:
 *   GITHUB_OAUTH_CLIENT_ID      the GitHub App's Client ID (public).
 *   GITHUB_OAUTH_CLIENT_SECRET  a client secret of the GitHub App (Worker secret).
 *   ADMIN_GITHUB_USER_ID        the owner's numeric GitHub user ID: the only account allowed in. It is immutable, unlike
 *                               a username or an email address, which are never used to decide access.
 *   SESSION_SECRET              at least 32 random characters (Worker secret); signs the session cookies.
 *   GITHUB_OAUTH_BASE           development only: the local mock of github.com, honoured only for http://127.0.0.1.
 *
 * Production also refuses local-test settings: the GitHub API and OAuth overrides (the local mock), the test content,
 * and the session secrets used by the tests.
 */
import { MIN_SECRET_LENGTH } from './session.js';

export const MODES = ['development', 'production'];
const BRANCH = /^[A-Za-z0-9._/-]{1,100}$/;
/** The session secrets used by the tests and the local example configuration; never accepted in production. */
const TEST_SECRET = /test-session-secret|local-session-secret|example-session-secret/i;

export const isProduction = (env) => (String(env.CONTENT_MODE ?? '').trim() || 'development') === 'production';

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

/** The sign-in configuration, or the problems that stop the admin. Never returns a secret. */
export function authConfig(env) {
  const problems = [];
  const clientId = String(env.GITHUB_OAUTH_CLIENT_ID ?? '').trim();
  const userId = String(env.ADMIN_GITHUB_USER_ID ?? '').trim();
  if (!/^[A-Za-z0-9._-]{8,100}$/.test(clientId)) problems.push('GITHUB_OAUTH_CLIENT_ID is not set.');
  if (String(env.GITHUB_OAUTH_CLIENT_SECRET ?? '').trim().length < 20) problems.push('GITHUB_OAUTH_CLIENT_SECRET is not set.');
  if (!/^[1-9][0-9]{0,15}$/.test(userId)) problems.push('ADMIN_GITHUB_USER_ID must be the owner’s numeric GitHub user ID.');
  if (String(env.SESSION_SECRET ?? '').length < MIN_SECRET_LENGTH) problems.push(`SESSION_SECRET must be at least ${MIN_SECRET_LENGTH} characters.`);
  return { ok: problems.length === 0, problems, clientId, userId };
}

/** Where github.com's OAuth pages are: github.com, or (development only) the local mock on 127.0.0.1. */
export function oauthBase(env) {
  const v = String(env.GITHUB_OAUTH_BASE ?? '');
  return /^http:\/\/127\.0\.0\.1:\d+$/.test(v) && !isProduction(env) ? v : 'https://github.com';
}

/**
 * Production-only checks on the deployment itself, run before anything is served (including the sign-in pages).
 * Returns a list of problems; empty when the request may proceed. Never includes a secret or a configured value.
 */
export function productionProblems(env, url) {
  if (!isProduction(env)) return [];
  const problems = [];
  const host = String(env.ADMIN_HOSTNAME ?? '').trim().toLowerCase();
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host)) problems.push('ADMIN_HOSTNAME is not set.');
  else if (url.hostname.toLowerCase() !== host || url.protocol !== 'https:') problems.push('This host is not the admin hostname.');
  if (String(env.GITHUB_API_BASE ?? '').trim()) problems.push('GITHUB_API_BASE (the local test override) must not be set.');
  if (String(env.GITHUB_OAUTH_BASE ?? '').trim()) problems.push('GITHUB_OAUTH_BASE (the local test override) must not be set.');
  if (String(env.ENABLE_TEST_CONTENT ?? '') === 'true') problems.push('ENABLE_TEST_CONTENT must not be set.');
  if (TEST_SECRET.test(String(env.SESSION_SECRET ?? ''))) problems.push('SESSION_SECRET is a test value.');
  return problems;
}
