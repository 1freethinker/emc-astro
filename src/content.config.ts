import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

/**
 * Content collections for the EMC site, mirroring what was found in the live
 * WordPress instance (http://141.164.55.18) as of 2026-09-10.
 *
 * Source shape in WordPress:
 *   - 15 Pages (hierarchical), 1 placeholder Post ("Hello world!"), 1 category.
 *   - No custom post types / ACF. Layout was built with the GenerateBlocks
 *     plugin; that presentational markup has been dropped in favour of clean
 *     Markdown + structured frontmatter.
 *   - Contact form was Contact Form 7 (not rebuilt yet). Donation pages were
 *     GiveWP; by decision the donation flow is info-only (no on-site payments),
 *     so `pages/donations.md` is a plain content page — see MIGRATION.md.
 */

// Provenance back to the WordPress record this entry came from.
const wordpress = z
  .object({
    id: z.number().optional(),
    slug: z.string().optional(),
    path: z.string().optional(), // original public URL path
    link: z.string().url().optional(),
    modified: z.string().optional(),
  })
  .optional();

const cta = z.object({
  label: z.string(),
  href: z.string(),
});

/**
 * pages — the informational content pages.
 *
 * Some pages are just a landing shell for a list that lives in another
 * collection (The Team -> `team`, Partners -> `partners`, EMC in The Media ->
 * `mediaCoverage`). Those set `rendersCollection` and carry little/no body.
 */
const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    /** Menu label when it differs from the page title. */
    navLabel: z.string().optional(),
    /** Short summary (from the WP excerpt where one existed). */
    description: z.string().optional(),
    /** Sort order within its nav group. */
    order: z.number().default(0),
    /** Slug of the parent page, for breadcrumbs / nested nav. */
    parent: z.string().optional(),
    draft: z.boolean().default(false),
    heroImage: z.string().optional(),

    /** Optional structured hero (used by the home page). */
    hero: z
      .object({
        heading: z.string(),
        subheading: z.string().optional(),
        image: z.string().optional(),
        ctas: z.array(cta).default([]),
      })
      .optional(),

    /** Optional row of short "what we do" style cards (home page). */
    highlights: z
      .array(
        z.object({
          title: z.string(),
          body: z.string(),
          /** icon key — see the `icons` map in src/pages/index.astro */
          icon: z.enum(['crisis', 'supplies', 'immigration', 'counseling']).optional(),
        }),
      )
      .optional(),

    /** Optional list of image paths for a simple gallery block. */
    gallery: z.array(z.string()).optional(),

    /**
     * This page is a shell that renders one or more other collections (in
     * order). A section heading is shown above each one only when there's
     * more than one (see the `sectionLabel` map in `[...slug].astro`).
     */
    rendersCollection: z
      .array(z.enum(['team', 'partners', 'mediaCoverage', 'news']))
      .optional(),

    /** Free-text notes for the migration review. */
    reviewNotes: z.string().optional(),

    wordpress,
  }),
});

/** team — members listed on the "The Team" page. */
const team = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/team' }),
  schema: z.object({
    name: z.string(),
    role: z.string(),
    order: z.number().default(0),
    /** Local image path (see public/images + src/data/wordpress-images.json). */
    photo: z.string().optional(),
    /** CSS object-position for the square photo crop (default "50% 30%"). */
    photoPosition: z.string().optional(),
    /** Original WordPress media URL, for later download. */
    photoSource: z.string().url().optional(),
    location: z.string().optional(),
  }),
});

/** partners — organisations listed on the "Partners" page. */
const partners = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/partners' }),
  schema: z.object({
    name: z.string(),
    order: z.number().default(0),
    logo: z.string().optional(),
    logoSource: z.string().url().optional(),
    url: z.string().url().optional(),
  }),
});

/** mediaCoverage — external press links from "EMC in The Media". */
const mediaCoverage = defineCollection({
  loader: file('./src/content/media-coverage.json'),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    /** Original Korean headline, where given alongside the English. */
    titleKo: z.string().optional(),
    outlet: z.string().optional(),
    url: z.string().url(),
    date: z.coerce.date().optional(),
    order: z.number().default(0),
  }),
});

/**
 * news — the "What's Happening" section.
 *
 * WordPress currently has only the default "Hello world!" post (kept as a
 * draft so the schema is exercised). Schema mirrors standard WP post fields
 * so real updates can be added later.
 */
const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: z.object({
    title: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    description: z.string().optional(),
    draft: z.boolean().default(false),
    category: z.string().default('Uncategorized'),
    tags: z.array(z.string()).default([]),
    heroImage: z.string().optional(),
    wordpress,
  }),
});

export const collections = { pages, team, partners, mediaCoverage, news };
