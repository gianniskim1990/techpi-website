/**
 * The signed-in session, from GET /api/session. The GitHub account comes from the Worker's signed session cookie (which
 * the browser cannot read: it is HttpOnly); the browser never decides who is signed in. When the admin runs without the Worker (plain `vite` dev), the session is absent and
 * only the read-only snapshot sections work.
 */
import { api } from './api.js';

export const session = $state({ loading: true, data: null, error: null });

export async function loadSession() {
  session.loading = true;
  try {
    session.data = await api.session();
    session.error = null;
  } catch (e) {
    session.data = null;
    session.error = e.message;
  } finally {
    session.loading = false;
  }
}

/** Signs out (the Worker clears the session cookie), then returns to the sign-in page. */
export async function signOut() {
  try {
    await fetch('/auth/logout', { method: 'POST', credentials: 'same-origin', cache: 'no-store', headers: { 'X-TechPi-Admin': '1', 'Content-Type': 'application/json' }, body: '{}' });
  } finally {
    location.assign('/');
  }
}
