# EMC — Astro rebuild

Astro migration of the **Every Mother & Child (EMC)** website, previously on
WordPress at `http://141.164.55.18`.

**Status:** content + routing + a first visual-theme pass in place. Every page
renders through a shared layout with navigation, breadcrumbs, redirects, a brand
palette + type system, and responsive nav.

## Prerequisites

Node 20.3+ / 22+ (built and tested on Node 24). Then:

```bash
npm install
npm run dev      # http://localhost:4321
npm run check    # astro check — type-checks .astro files + collections
npm run build    # builds the static site
npm run preview  # serve the production build locally
```

If PowerShell blocks npm (`npm.ps1 cannot be loaded`), run once:
`Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

## Project layout

```
astro.config.mjs           redirects + remark-breaks
src/
  content.config.ts        collection definitions + Zod schema (start here)
  content/
    pages/                  12 informational pages (Markdown + frontmatter)
    team/                   4 team members
    partners/               10 partner organisations
    news/                   "What's Happening" posts (only the WP starter post, as draft)
    media-coverage.json     press links for "EMC in The Media"
  data/
    site.json               org details (name, contact, banking)
    navigation.json          primary menu
    redirects.json           old WordPress URL -> new route map
    wordpress-images.json    manifest of all 48 media-library images
  styles/
    tokens.css               design tokens: colour / type / spacing, light + dark
    global.css               base element styles, .prose, .btn, layout helpers
  layouts/
    BaseLayout.astro         HTML shell, fonts, no-flash theme script
  components/
    SiteHeader / SiteFooter / Breadcrumbs / Logo
    TeamGrid / PartnerGrid / MediaCoverageList / NewsList
  pages/
    index.astro              home (hero + highlights + gallery from home.md)
    [...slug].astro          every other page; renders body + optional collection list
    whats-happening/[id].astro   individual news posts
    404.astro
public/
  favicon.svg
  images/                    48 images, downloaded from the WP media library
scripts/
  fetch-wp-images.ps1        (re)download the media library into public/images/
  dump-wp-rest.ps1           snapshot the raw WordPress REST API for re-syncing
MIGRATION.md                 what was found, what was skipped, decisions
```

## Content model

| Collection      | Source in WordPress                              | Loader          |
| --------------- | ----------------------------------------------- | --------------- |
| `pages`         | Pages (15, hierarchical → 12 kept + 3 redirects) | `glob` Markdown |
| `team`          | body of the "The Team" page                     | `glob` Markdown |
| `partners`      | body of the "Partners" page                     | `glob` Markdown |
| `mediaCoverage` | body of the "EMC in The Media" page             | `file` JSON     |
| `news`          | Posts (only the default "Hello world!" post)    | `glob` Markdown |

Pages that are just a shell for a list (`The Team`, `Partners`, `EMC in The
Media`, `What's Happening`) carry `rendersCollection` in their frontmatter and
the matching component is rendered after the page body.

`parent` drives breadcrumbs only — all pages route at the top level
(`/the-team`, `/donations`, …). Old nested WordPress URLs 301 via
`astro.config.mjs`.

Every migrated entry keeps a `wordpress` block (original id / slug / URL).

Draft `news` posts and any `reviewNotes` banner show in `dev` and are hidden in
production builds.

## Theme

First pass, brand-aligned refresh (see MIGRATION.md § Theme):

- **Palette** from the EMC logo — rose/magenta primary, royal-blue secondary,
  teal accent, warm neutrals. All in `src/styles/tokens.css` as CSS custom
  properties. Light theme only (dark mode was tried and dropped).
- **Type** — Fraunces (display) + Open Sans (body), self-hosted via
  `@fontsource`. Fluid type scale.
- **Logo** — `Logo.astro`, an SVG wordmark rebuilt from the low-res JPG. The
  globe-with-figures mark is omitted pending a transparent source.
- Sticky header with CSS dropdowns on desktop / drawer on mobile + a Donate
  button; restyled footer, breadcrumbs, hero, cards, and all four collection
  list views.

Still rough / next: real photography treatment, the globe logo mark, per-page
hero art, spacing polish on long content pages.

## Not done yet (deliberately)

- **Contact / intake forms** — Contact Form 7 (contact-us) and embedded Naver
  Office forms (emergency-support, donations monthly). Recorded, not rebuilt —
  need a form solution.
- **Image optimization** — images are plain `<img>` to `/images/...`; not yet
  moved to `astro:assets` / `<Image>`.

Settled: **donation flow is info-only** (`donations.md`), no on-site payments —
see MIGRATION.md.
