/**
 * The signed-in session, from GET /api/session. The email comes from Cloudflare Access via the Worker; the browser
 * never decides who is signed in. When the admin runs without the Worker (plain `vite` dev), the session is absent and
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
