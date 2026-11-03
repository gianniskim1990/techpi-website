import type { ImageMetadata } from 'astro';
import media from 'virtual:techpi-media';

/**
 * Every image a case study or an article may reference, by id (the file name without its extension):
 *
 *   src/assets/projects   uploaded for a case study (Task M6) or migrated with one
 *   src/assets/insights   uploaded for an article (Task M7)
 *   src/assets/media      the admin's media library (Task M8): uploaded once, usable by any case study or article
 *
 * Any entry may use an image from any of the three folders, so an id must be unique across all of them; the build fails
 * otherwise. Declared sizes live in the content files and are checked against these files by scripts/assets/validate.mjs.
 * A library image no page uses is not imported at all, so it is not published with the site.
 */
const entryFiles = import.meta.glob<ImageMetadata>('../assets/{projects,insights}/*.{png,jpg,jpeg,webp}', { eager: true, import: 'default' });
// The library's images through scripts/media/used-media.mjs: in a build, only those a page references.
const files: Record<string, ImageMetadata> = { ...entryFiles };
for (const [name, meta] of Object.entries(media)) files[`../assets/media/${name}`] = meta;

export const siteImages: Readonly<Record<string, ImageMetadata>> = (() => {
  const out: Record<string, ImageMetadata> = {};
  const where: Record<string, string> = {};
  for (const [file, meta] of Object.entries(files)) {
    const [folder, name] = file.split('/').slice(-2);
    const id = name.replace(/\.[a-z]+$/, '');
    if (out[id]) throw new Error(`Two images share the id "${id}" (src/assets/${where[id]} and src/assets/${folder}): keep one file per name across src/assets/projects, insights and media`);
    out[id] = meta;
    where[id] = folder;
  }
  return out;
})();
