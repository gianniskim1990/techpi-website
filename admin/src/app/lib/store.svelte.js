/** Toast notifications, shared by the editors. (The prototype's in-memory content snapshot was removed in Task M4.) */
export const store = $state({ toasts: [] });

let toastId = 0;
export function toast(kind, title, text = '') {
  const id = ++toastId;
  store.toasts.push({ id, kind, title, text });
  // Keep the stack short: older messages give way to the newest three.
  while (store.toasts.length > 3) store.toasts.shift();
  setTimeout(() => dismissToast(id), kind === 'error' ? 8000 : 5000);
}
export function dismissToast(id) {
  const i = store.toasts.findIndex((t) => t.id === id);
  if (i >= 0) store.toasts.splice(i, 1);
}
