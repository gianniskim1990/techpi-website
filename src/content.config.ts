import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Content collections read by Astro. M0 (admin proof of concept) adds one isolated collection only.
 *
 * m0Demo: dummy entries written by the admin (Sveltia CMS, admin/src/config.js), one folder per entry:
 * content/m0-demo/<slug>/index.json, with its images beside it. No page or route reads this collection, so it adds
 * nothing to the built website; Astro still loads and validates every entry on each build, and a build with an
 * invalid entry fails before anything is deployed.
 *
 * File shape (Sveltia's `single_file` i18n structure): `{ "en": {...}, "el": {...} }`. English is required; Greek is
 * optional and omitted until written.
 */
const localeFields = ({ image }: { image: () => z.ZodType }) =>
  z
    .object({
      title: z.string().trim().min(10).max(90),
      summary: z.string().trim().min(1).max(200),
      body: z.string().trim().min(1),
      // Entry-relative image file, written by the CMS as a bare file name.
      cover: z
        .preprocess((v) => (typeof v === 'string' && v && !/^(\.|\/)/.test(v) ? `./${v}` : v), image())
        .optional(),
      coverAlt: z.string().trim().max(200).optional(),
      seoTitle: z.string().trim().max(70).optional(),
      seoDescription: z.string().trim().max(170).optional(),
    })
    .strict()
    .refine((v) => !v.cover || (v.coverAlt && v.coverAlt.length > 0), {
      message: 'An image needs alt text.',
      path: ['coverAlt'],
    });

const m0Demo = defineCollection({
  loader: glob({ pattern: '*/index.json', base: './content/m0-demo' }),
  schema: ({ image }) => z.object({ en: localeFields({ image }), el: localeFields({ image }).optional() }).strict(),
});

export const collections = { m0Demo };
