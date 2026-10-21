// Test identities for the GitHub sign-in (Task AUTH-G1). The tests sign session cookies with the test SESSION_SECRET,
// exactly as the Worker does after a successful GitHub sign-in, so the API suites can run as the owner, as another
// GitHub account, with a forged or expired cookie, or with none. The OAuth flow itself is tested in oauth.test.mjs.
import { seal, SESSION_COOKIE, SESSION_TTL } from '../../worker/session.js';
import { MOCK_OAUTH } from './mock-github.mjs';

export const OWNER_ID = String(MOCK_OAUTH.user.id);
export const SESSION_SECRET = 'test-session-secret-0123456789abcdef0123456789abcdef';
/** The sign-in settings every test environment needs (test values only; production refuses this session secret). */
export const authEnv = {
  GITHUB_OAUTH_CLIENT_ID: MOCK_OAUTH.clientId,
  GITHUB_OAUTH_CLIENT_SECRET: MOCK_OAUTH.clientSecret,
  ADMIN_GITHUB_USER_ID: OWNER_ID,
  SESSION_SECRET,
};

/**
 * Who makes a request, for the suites' `call` helpers. Keeps the old call sites readable:
 *   ctxFor()                  the owner, with a valid session
 *   ctxFor('intruder…')       a validly signed session for another GitHub account
 *   ctxFor(anyone, 'other')   a session signed with another key (forged)
 *   {}                        no session at all
 */
export const ctxFor = (who = 'owner', key) => ({ who: String(who).includes('intruder') ? 'intruder' : 'owner', forged: key !== undefined });

/** The Cookie header for a ctx (or null), signed now. */
export async function sessionCookie(ctx, { secret = SESSION_SECRET, ttl = SESSION_TTL, now } = {}) {
  if (!ctx || !ctx.who) return null;
  const uid = ctx.who === 'intruder' ? '7654321' : OWNER_ID;
  const token = await seal(ctx.forged ? 'another-secret-another-secret-another-secret' : secret, 'session', { sid: 'test-session', uid, login: ctx.who === 'intruder' ? 'someone-else' : MOCK_OAUTH.user.login }, ttl, now);
  return `${SESSION_COOKIE}=${token}`;
}
