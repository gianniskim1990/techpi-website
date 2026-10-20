/**
 * Sveltia CMS configuration for the TechPi admin (M0 proof of concept).
 *
 * Security-relevant choices (docs/admin/M0.md explains each):
 * - GitHub backend with access-token sign-in only (`auth_methods: ['token']`): a fine-grained personal access token
 *   limited to this repository (Contents and Pull requests: read and write) with an expiry. No OAuth app and no
 *   client secret exist anywhere, so there is no application secret that could reach the browser.
 * - Editorial Workflow: every save goes to its own `cms/<collection>/<slug>` branch and pull request. Nothing reaches
 *   `main` (production) until the pull request is merged with Publish. Server-side enforcement is GitHub's branch
 *   rule on `main` (owner setting), not this file.
 * - One isolated demo collection with dummy content. It has no route on the public website.
 *
 * `vite --mode demo` swaps the backend for Sveltia's in-memory `test-repo` backend, so the editor can be exercised
 * locally without any credential. Nothing is saved anywhere in that mode.
 */

const github = {
  name: 'github',
  repo: 'gianniskim1990/techpi-website',
  branch: 'main',
  auth_methods: ['token'],
  squash_merges: true,
};

/** A field that must stay identical across languages (shared facts such as the image). */
const shared = 'duplicate';

export const config = {
  load_config_file: false,
  backend: import.meta.env.MODE === 'demo' ? { name: 'test-repo' } : github,
  publish_mode: 'editorial_workflow',
  app_title: 'TechPi Admin',
  logo: { src: '/techpi-symbol.png' },
  site_url: 'https://techpi.eu',

  // Uploads: raster images only, re-encoded to WebP, bounded size, slugified names. The public build's own
  // validators remain the authoritative check before anything can be deployed.
  media_folder: '/content/m0-demo',
  public_folder: '',
  media_libraries: {
    default: {
      config: {
        max_file_size: 2_000_000,
        slugify_filename: true,
        transformations: { raster_image: { format: 'webp', quality: 85, width: 2400, height: 2400 } },
      },
    },
  },

  // English is the default; Greek is optional per entry and never filled in automatically.
  i18n: { structure: 'single_file', locales: ['en', 'el'], default_locale: 'en', initial_locales: 'default' },

  collections: [
    {
      name: 'm0-demo',
      label: 'M0 demo articles',
      label_singular: 'M0 demo article',
      description: 'Proof-of-concept content only. Not shown on techpi.eu.',
      folder: 'content/m0-demo',
      path: '{{slug}}/index',
      format: 'json',
      extension: 'json',
      create: true,
      identifier_field: 'title',
      media_folder: '',
      public_folder: '',
      i18n: true,
      fields: [
        { name: 'title', label: 'Title', widget: 'string', i18n: true, minlength: 10, maxlength: 90 },
        { name: 'summary', label: 'Summary', widget: 'text', i18n: true, maxlength: 200 },
        {
          name: 'body',
          label: 'Body',
          widget: 'richtext',
          i18n: true,
          modes: ['rich_text'],
          buttons: ['bold', 'italic', 'link', 'heading-two', 'heading-three', 'bulleted-list', 'numbered-list'],
          editor_components: [],
        },
        {
          name: 'cover',
          label: 'Cover image',
          widget: 'image',
          i18n: shared,
          required: false,
          accept: 'image/png,image/jpeg,image/webp',
        },
        { name: 'coverAlt', label: 'Cover image alt text', widget: 'string', i18n: true, required: false, maxlength: 200 },
        { name: 'seoTitle', label: 'SEO title', widget: 'string', i18n: true, required: false, maxlength: 70 },
        { name: 'seoDescription', label: 'SEO description', widget: 'text', i18n: true, required: false, maxlength: 170 },
      ],
    },
  ],
};
