// The media library's images in the build (Task M8). src/assets/media holds every image uploaded to the admin's media
// library, used by a page or not. Astro writes the full-size original of every imported image into dist/ unless it
// renders a derivative of it, so importing the whole folder would publish each unused upload as dead weight (refused by
// scripts/assets/validate.mjs). This Vite plugin serves `virtual:techpi-media`: in a build, only the library images some
// case study or article references (content/case-studies/*/index.json, content/insights/*/index.json); in the dev
// server, all of them. src/content/image-files.ts reads it.
import fs from 'node:fs';
import path from 'node:path';

const ID = 'virtual:techpi-media';
const RESOLVED = '\0' + ID;
const IMAGE = /\.(png|jpe?g|webp)$/i;

/** The ids of every image a case study or an article references. */
export function referencedImageIds(root) {
  const ids = new Set();
  const refs = {
    'case-studies': (doc) => [doc.images?.image, doc.images?.cover, ...(doc.images?.gallery ?? [])],
    insights: (doc) => [doc.images?.cover, ...Object.values(doc.images?.sections ?? {})],
  };
  for (const [folder, of] of Object.entries(refs)) {
    const dir = path.join(root, 'content', folder);
    for (const d of fs.existsSync(dir) ? fs.readdirSync(dir) : []) {
      const file = path.join(dir, d, 'index.json');
      if (!fs.existsSync(file)) continue;
      for (const ref of of(JSON.parse(fs.readFileSync(file, 'utf8')))) if (ref?.id) ids.add(ref.id);
    }
  }
  return ids;
}

export function usedMedia() {
  let root = process.cwd();
  let all = false;
  return {
    name: 'techpi-used-media',
    configResolved(config) {
      root = config.root;
      all = config.command === 'serve';
    },
    resolveId(id) {
      return id === ID ? RESOLVED : null;
    },
    load(id) {
      if (id !== RESOLVED) return null;
      const dir = path.join(root, 'src', 'assets', 'media');
      const used = all ? null : referencedImageIds(root);
      const files = (fs.existsSync(dir) ? fs.readdirSync(dir) : []).filter((f) => IMAGE.test(f) && (!used || used.has(f.replace(IMAGE, ''))));
      const imports = files.map((f, i) => `import m${i} from ${JSON.stringify(path.join(dir, f).replace(/\\/g, '/'))};`);
      const entries = files.map((f, i) => `${JSON.stringify(f)}: m${i}`);
      return `${imports.join('\n')}\nexport default { ${entries.join(', ')} };\n`;
    },
  };
}
