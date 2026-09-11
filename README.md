# EMC — Astro rebuild

Astro migration of the **Every Mother & Child (EMC)** website, previously on
WordPress at `http://141.164.55.18`.

**Status:** content, routing, visual theme, and a working contact form in
place. Targeting a **Netlify** static deploy.

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
astro.config.mjs           redirects
netlify.toml               Netlify build config
.env.example               PUBLIC_WEB3FORMS_KEY (contact form)
src/
  content.config.ts        collection definitions + Zod schema (start here)
  content/
    pages/                  10 informational pages (Markdown + frontmatter)
    team/                   4 team members
    partners/               10 partner organisations
    news/                   "Latest Updates" posts shown on emc-in-the-media (only the WP starter post, as draft)
    media-coverage.json     press links for "EMC in The Media"
  data/
    site.json               org details (name, contact, banking)
    navigation.json          primary menu
    redirects.json           old WordPress URL -> new route map
    wordpress-images.json    manifest of all 48 media-library images
  styles/
    tokens.css               design tokens: colour / type / spacing (light only)
    global.css               base element styles, .prose, .btn, layout helpers
  layouts/
    BaseLayout.astro         HTML shell + fonts
  components/
    SiteHeader / SiteFooter / Logo
    TeamGrid / PartnerGrid / MediaCoverageList / NewsList
    ContactForm.astro        Web3Forms contact form (AJAX + honeypot)
    PayPalDonateBox.astro    live PayPal hosted-button form (donate / subscribe)
  pages/
    index.astro              home (hero + highlights + gallery from home.md)
    contact-us.astro         dedicated route: contact details + ContactForm
    donations.astro          dedicated route: donation info + two PayPalDonateBox
    [...slug].astro          every other page; renders body + optional collection list
    emc-in-the-media/[id].astro   individual news posts
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
| `pages`         | Pages (15, hierarchical → 10 kept + 2 merged + 3 dropped) | `glob` Markdown |
| `team`          | body of the "The Team" page                     | `glob` Markdown |
| `partners`      | body of the "Partners" page                     | `glob` Markdown |
| `mediaCoverage` | body of the "EMC in The Media" page             | `file` JSON     |
| `news`          | Posts (only the default "Hello world!" post)    | `glob` Markdown |

Pages that are just a shell for a list (`The Team`, `Partners`, `EMC in The
Media`) carry `rendersCollection` — an **array** — in their frontmatter, and
the matching component(s) render after the page body. `EMC in The Media`
renders two (`news` then `mediaCoverage`); a page renders more than one only
gets a section heading per collection.

All pages route at the top level (`/the-team`, `/donations`, …); old nested
WordPress URLs 301 via `astro.config.mjs`. `parent` is retained in frontmatter
for future nav grouping but isn't shown (no breadcrumbs / page subtitles).

Every migrated entry keeps a `wordpress` block (original id / slug / URL).

Draft pages/`news` posts and any `reviewNotes` banner show in `dev` and are
hidden in production builds.

## Theme

First pass, brand-aligned refresh (see MIGRATION.md § Theme):

- **Palette** from the EMC logo — rose/magenta primary, royal-blue secondary,
  teal accent, warm neutrals. All in `src/styles/tokens.css` as CSS custom
  properties. Light theme only (dark mode was tried and dropped).
- **Type** — Fraunces (display) + Open Sans (body) + Baloo 2 (logo only),
  self-hosted via `@fontsource`. Fluid type scale.
- **Logo** — `Logo.astro`, an SVG rebuilt from the low-res JPG: "EMC" in Baloo 2
  plus a taegeuk (Korean-flag swirl) in the brand rose + blue — a nod to Korea
  that also reads as mother + child. The globe-with-figures mark is omitted
  pending a transparent source.
- Sticky header (CSS dropdowns on desktop / drawer on mobile) + Donate button;
  sticky footer with the logo; restyled hero, numbered feature cards, gallery,
  and all four collection list views.

Still rough / next: real photography treatment, per-page hero art, spacing
polish on long content pages.

## Deploy (Netlify)

Static site. `netlify.toml` sets `npm run build` → publish `dist/`.

**Before the first deploy:** add the contact-form key under
_Site settings → Environment variables_:

```
PUBLIC_WEB3FORMS_KEY = <your Web3Forms access key>
```

Get one at [web3forms.com](https://web3forms.com) (enter the address that should
receive messages). Locally, put it in `.env` (see `.env.example`). Without it the
contact form renders but is disabled with a notice.

## Contact form

`ContactForm.astro` posts straight to Web3Forms — no backend. JS on: AJAX submit
with an inline success/error message. JS off: normal POST, Web3Forms shows its
own confirmation page. Spam: Web3Forms honeypot (`botcheck`).

## PayPal donation buttons

⚠️ **Live, not a demo.** `donations.astro` embeds two real PayPal "hosted
button" forms (`PayPalDonateBox.astro`) — same `hosted_button_id`s as the
WordPress site, one-time ($10/25/50/100) and monthly subscription. They post
directly to `paypal.com`; PayPal handles checkout, no backend here. See
MIGRATION.md "Donation flow" for why (client explicitly asked for these back,
overriding the earlier info-only decision).

## Other forms

**Emergency Support** embeds the original Naver Office form in an `<iframe>`
(kept, not rebuilt — see `emergency-support.md`). ⚠️ **That formkey looks
dead** — the embed shows a generic Naver "Form OPEN" promo page, not the
intake form; needs a fresh Naver form before launch. The **Donations** page's
automatic-monthly-transfer option (for domestic/KRW donors) is still just an
external link to its own Naver form.

## Not done yet (deliberately)

- **Image optimization** — images are plain `<img>` to `/images/...`; not yet
  moved to `astro:assets` / `<Image>`.

Settled: bank/wire/Naver-form content on the Donations page is **info-only**;
the **PayPal boxes are live** (real hosted-button forms, same as the WP site,
by explicit request) — see MIGRATION.md "Donation flow".
