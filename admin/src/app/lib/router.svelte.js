/** Minimal hash router: #/ , #/case-studies, #/case-studies/<slug>, #/articles/<slug>, #/pages, ... */
const read = () => (location.hash.replace(/^#/, '') || '/').replace(/\/+$/, '') || '/';

export const route = $state({ path: read() });

addEventListener('hashchange', () => {
  route.path = read();
  window.scrollTo(0, 0);
});

export const navigate = (path) => { location.hash = path; };

/** Splits the current path into the section and an optional entry slug. */
export const parts = () => {
  const [, section = '', slug = ''] = route.path.split('/');
  return { section, slug };
};
