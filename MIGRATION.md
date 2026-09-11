# WordPress → Astro migration notes

Source: `http://141.164.55.18` — WordPress 6.2.2, theme **GeneratePress**, layout
built with the **GenerateBlocks** plugin. Snapshot taken **2026-09-10** via the
public REST API (`/wp-json/wp/v2/`).

## What's on the WordPress site

| Type       | Count | Notes                                                           |
| ---------- | ----- | -------------------------------------------------------------- |
| Pages      | 15    | Hierarchical; this is where all real content lives.           |
| Posts      | 1     | Default "Hello world!" only. Category: Uncategorized.         |
| Categories | 1     | Uncategorized.                                                |
| Tags       | 0     |                                                              |
| Media      | 48    | All images. ~20 referenced by pages; the rest are unused.     |
| Users      | 1     | `terry`.                                                      |

No custom post types, no ACF, no exposed custom REST namespaces. Active plugins
seen on the frontend: **Contact Form 7**, **facebook-page-feed-graph-api** (not
actually used in any page body). **GiveWP** left donation pages behind but is not
active on the frontend (no `give` REST namespace, no Give assets loaded).

Menus/`menu-items` require auth (401), so `src/data/navigation.json` was
reconstructed from the rendered header HTML.

## Page → Astro mapping

| WP id | WP path                          | Astro file                         | Notes |
| ----- | -------------------------------- | ---------------------------------- | ----- |
| 6     | `/` (`/home/`)                   | `pages/home.md`                    | Hero + 4 highlights + photo gallery captured as frontmatter; mission text as body. |
| 59    | `/about-emc/`                    | `pages/about-emc.md`               | Full text. Route is `/about-emc` — same as the WP path (renamed from `who-we-are.md` on 2026-09-11; see "Nav restructure" below). |
| 65    | `/about-emc/the-team/`           | `pages/the-team.md` + `team/*`     | 4 members extracted to `team` collection. |
| 63    | `/about-emc/partners/`           | `pages/partners.md` + `partners/*` | 10 orgs extracted to `partners` collection. |
| 61    | `/about-emc/contact-us/`         | `pages/contact-us.md` + `contact-us.astro` | Form **rebuilt** with Web3Forms. |
| 13    | `/what-we-need/`                 | *(consolidated into `pages/volunteers.md`)* | Redirects to `/volunteers`. See "Nav restructure" below. |
| 15    | `/what-we-need/donations/`       | `pages/donations.md`               | **Donation content only**, info page — see "Donation flow" below. |
| 53    | `/what-we-need/volunteers/`      | `pages/volunteers.md`             | Full text, plus page 13's content merged in. |
| 11    | `/what-we-do/`                   | `pages/our-programs.md`           | Full text. Renamed from `what-we-do.md`; redirects to `/our-programs`. See "Nav restructure" below. |
| 9     | `/what-we-do/emergency-support/` | `pages/emergency-support.md`       | **Body was only an embedded Naver Office form** — URL recorded, nothing rebuilt. |
| 55    | `/whats-happening/`              | *(consolidated into `pages/emc-in-the-media.md`)* | Was empty in WP; redirects to `/emc-in-the-media`. See "Nav restructure" below. |
| 51    | `/whats-happening/emc-in-the-media/` | `pages/emc-in-the-media.md` + `media-coverage.json` + `news` | 5 external press links, plus page 55's news-feed intent merged in. |
| 1     | `/hello-world/`                  | `news/hello-world.md`             | Default WP post, kept as draft. |

### Donation flow — decision: info-only, permanently

**Decided 2026-09-10:** no on-site payment flow. The **Donations** page
(`pages/donations.md`) keeps its real, portable content — bank-transfer details,
an international wire, a PayPal address, and two external Naver Office form links
(one-time and automatic monthly) — migrated verbatim. It has no
`needsPaymentIntegration` flag; `reviewNotes` just asks that the details/links be
verified before launch.

The three **GiveWP** plugin pages are **not** reproduced. Their old URLs 301 to
`/donations` (see `redirects.json`). Content recorded here for the archive only:

| WP id | WP path                       | Content in WordPress |
| ----- | ---------------------------- | -------------------- |
| 24    | `/donation-confirmation-2/`  | Just the `[give_receipt]` shortcode — a GiveWP donation receipt. No portable content. |
| 25    | `/donation-failed-2/`        | "We're sorry, your donation failed to process. Please try again or contact site support." |
| 26    | `/donor-dashboard-2/`        | Empty — would have held the GiveWP donor dashboard. |

### Forms

- **Contact Us** — **rebuilt** with Web3Forms (`ContactForm.astro`, dedicated
  `src/pages/contact-us.astro` route). Fields: name, email, subject, message
  (all required — the WP form had message optional and a "4 or 8?" quiz;
  replaced by a Web3Forms honeypot). Needs `PUBLIC_WEB3FORMS_KEY` at build time
  (Netlify env var / local `.env`).
- **Emergency Support** — **embedded** (2026-09-11), decision: keep the
  external Naver Office form rather than rebuild it. Same `<iframe>` src as
  WordPress (`form.office.naver.com/form/responseView.cmd?formkey=...`), same
  1800px height carried over as-is. `.prose iframe` styled in `global.css`
  (bordered, rounded, full-width). This environment can't reach
  `form.office.naver.com` to preview it — check the live page and adjust the
  height in `emergency-support.md` if it doesn't match.
- **Donations → Automatic Monthly Donation** — Naver Office form
  (`...formkey=NzEyZTNkMGQtMDczZS00ZmYyLWE1MDEtNDk2NmE0ODA5MDg3`), kept as an
  external link in `donations.md`.

## Routing & layout

- Shared `BaseLayout` (header nav from `navigation.json`, footer from
  `site.json`) wraps every page. CSS is a minimal legibility baseline, not a
  theme.
- `src/pages/[...slug].astro` renders each `pages` entry at a top-level route
  (`/about-emc`, `/donations`, …). `parent` is kept for future nav/nesting but
  is not shown (no breadcrumbs, no page subtitle — client preference). Draft
  pages build in dev only. `contact-us` has its own dedicated route instead
  (`src/pages/contact-us.astro`) and is excluded from this catch-all.
- Shell pages render their collection after the body: `TeamGrid`,
  `PartnerGrid`, `MediaCoverageList`, `NewsList`.
- `emc-in-the-media/[id].astro` builds individual news posts (none in
  production yet — the one post is a draft).
- Old WordPress URLs 301 via `astro.config.mjs` (`redirects.json`). Identity
  redirects (`/emergency-support/` → `/emergency-support` etc.) are filtered in
  the config so they don't clobber the real page; those paths just resolve
  directly.
- No `remark-breaks` — content Markdown is reflowed to one-line paragraphs;
  the few places that need a hard line break (donations bank/wire blocks) use
  an explicit `<br>`.
- `astro build` = 11 pages, clean.

### Nav restructure: "Who We Are" is now a label, not a page (2026-09-11)

On WordPress, the "Who We Are" dropdown's *top-level item* linked to
`/about-emc/` (origins/mission content) and had The Team / Partners / Contact Us
as siblings underneath. Client asked to split those apart: "Who We Are" in the
header is now a **dropdown label only** — no `href`, renders as a `<span>`
(`SiteHeader.astro`), not clickable — and the origins/mission content moved to
its own child item, **"About EMC"**, alongside The Team / Partners / Contact Us.

- `pages/who-we-are.md` renamed to `pages/about-emc.md` (`title`/`navLabel`
  "About EMC"); its route is now `/about-emc`, matching the original WordPress
  path exactly, so the old `/about-emc/` redirect entry was removed (it's an
  identity mapping now — see `redirects.json` "unchanged").
- `the-team.md` / `partners.md` / `contact-us.md` `parent:` updated to
  `about-emc`.
- `navigation.json`: the "Who We Are" entry has no `href`; "About EMC" added as
  its first child, pointing at `/about-emc`.
- `SiteHeader.astro`: a nav item renders as `<a>` if it has an `href`, else as a
  non-interactive `<span tabindex="0">` (still focusable so keyboard users can
  reach the dropdown via `:focus-within`).

### Nav restructure: "What We Need" is now a label too, no page (2026-09-11)

Same pattern as "Who We Are", but here the client asked to consolidate rather
than spin off a new page: WordPress page 13 (`/what-we-need/`, "How can you
help EMC?") and page 53 (`/what-we-need/volunteers/`, "Volunteers") had
near-duplicate content — same six ways to help (interpretation, accompanying,
car service, child care, teaching Korean, sponsorship), just reworded.

- `pages/what-we-need.md` **deleted**; its "How can you help EMC?" heading and
  framing were folded into `pages/volunteers.md`, which already had the fuller
  bullet list. Nothing unique was lost (diffed the two before deleting).
- `navigation.json`: "What We Need" entry has no `href` (dropdown label only);
  children unchanged (Donations, Volunteers).
- `donations.md` / `volunteers.md`: dropped `parent: what-we-need` (no page for
  it to point at anymore — unlike "About EMC", no single child page inherits
  the old parent slot here).
- `redirects.json`: `/what-we-need/` now redirects to `/volunteers` (moved out
  of "unchanged" since it's no longer an identity route).

### Nav restructure: "What We Do" and "What's Happening" (2026-09-11)

Same pattern, applied twice more, one of each flavour:

**"What We Do" → split** (real, non-duplicate content — like "Who We Are"):
- `pages/what-we-do.md` renamed to `pages/our-programs.md` (`title`/`navLabel`
  "Our Programs"); added as the first child under the now-label-only
  "What We Do", alongside the existing "Emergency Support".
- `emergency-support.md`: `parent:` updated to `our-programs`.
- `redirects.json`: `/what-we-do/` now redirects to `/our-programs` (moved out
  of "unchanged").

**"What's Happening" → merge** (page 55 was empty in WP — like "What We Need"):
- `pages/whats-happening.md` **deleted**; its intro line moved into
  `pages/emc-in-the-media.md`, which is now the dropdown's only child and
  renders **two** collections instead of one: `news` ("Latest Updates") above
  `mediaCoverage` ("In The Media").
- `rendersCollection` on the `pages` schema changed from a single enum to an
  **array** (`content.config.ts`), so a page can combine collections.
  `[...slug].astro` now maps over it and only prints a section `<h2>` (via a
  `sectionLabel` lookup) when a page renders more than one — existing
  single-collection pages (`the-team`, `partners`) are unaffected.
- News-post permalinks moved from `whats-happening/[id].astro` to
  `emc-in-the-media/[id].astro` (`/emc-in-the-media/<slug>`); `NewsList.astro`
  links updated, and its per-item heading dropped from `<h2>` to `<h3>` since
  it now nests under the page's own "Latest Updates" `<h2>`.
- `emc-in-the-media.md`: dropped `parent: whats-happening` (no page left to
  point at).
- `redirects.json`: `/whats-happening/` now redirects to `/emc-in-the-media`.

**Both restructures**, plus the earlier two, meant `SiteFooter.astro`'s
"Explore" column — which used to link each top-level nav item directly — broke,
since *every* top-level item is now label-only. It now falls back to each
group's first child's `href` while keeping the group's own label as the link
text (e.g. "What We Need" → `/donations`).

**Nav order**: "What We Do" moved before "What We Need" per client request —
now Who We Are, What We Do, What We Need, What's Happening.

## Theme (first pass)

Direction chosen: **brand-aligned refresh** — drop the site's mismatched purple
(a GeneratePress default) and build from the logo's real colours.

- **Original design DNA** (for reference): Open Sans; bright purple headings
  `#b41ddb`; blue links `#1e73be`; lavender hero gradient `#e7ccf8 → #a48fb1`;
  three inconsistent button colours (blue / green / rose); square corners.
- **New palette** (`src/styles/tokens.css`): rose/magenta primary `#e5476a`
  (from the logo mark; darkened to `#bc2f54` for AA text), royal-blue secondary
  `#294ba6` (logo wordmark), teal accent `#2f97ab` (globe figures), warm sand
  neutrals. **Light theme only** — a dark mode was built (toggle +
  `prefers-color-scheme` + `[data-theme]`) then removed at the client's request;
  `color-scheme: light` is fixed.
- **Type**: Fraunces (display serif), Open Sans (body), Baloo 2 (rounded,
  playful — logo only). All self-hosted via `@fontsource`, latin subset. Fluid
  `clamp()` scale. Headings use "and" not "&" (Fraunces's stylised ampersand
  reads as a glitch).
- **Logo**: `src/components/Logo.astro` — "EMC" set in Baloo 2 plus a **taegeuk**
  (the Korean-flag swirl) drawn in the brand rose + blue: places EMC in Korea,
  and the two nested commas still read as mother + child. `favicon.svg` matches.
  Rebuilt as theme-aware SVG; the original globe-with-figures raster is dropped
  (low-res JPG, baked-in white box).
- One button system (`.btn`, `.btn--secondary`, `.btn--ghost`, pill shape).
- Header: sticky, CSS-only dropdowns ≥60rem, slide-in drawer below (small JS),
  plus a Donate button. Dropdowns use `display:none/block` (not opacity) to
  avoid ghost-render in screenshot capture.
- Sticky footer (flex column) with the logo + column headings.
- Restyled: footer, home (hero / mission + CTA row / numbered "How EMC helps"
  cards / 6-photo gallery), generic page shell, and TeamGrid / PartnerGrid /
  MediaCoverageList / NewsList.
- Partner logos get `mix-blend-mode: multiply` on their tint chip (many are
  JPGs with white backgrounds).

Team photos are square (1:1) with a per-member `photoPosition` (object-position)
so faces sit right; Natasha's is the weak source (seated, small in frame).

Not yet: per-page hero photography, image art-direction.

## Partner links

The WordPress page had no outbound links except GGC. Websites were researched and
added to `partners/*.md` (`url`):

| Partner | URL | Note |
| --- | --- | --- |
| Linker | http://www.linker.or.kr | 사단법인 링커 / NGO LINKER |
| Tium | https://teaumgroup.com | 행정사법인 티움 (domain matches the logo file) |
| Love the World | https://lovetheworld.or.kr | 러브더월드 |
| Life Giving Tree | http://www.lifegivingtree.or.kr | 생명을 주는 나무 (https cert expired → http) |
| Framily | http://framily.kr | 사단법인 프래밀리 (self-signed cert; not fully verified) |
| Yanco | https://yanco.or.kr | 얀코사회적협동조합 |
| GGC | http://www.1412.co.kr | 사단법인 경기글로벌센터 — pre-existing, confirmed active |

Each URL was cross-checked against the wording on the partner's own logo file.

No link found / not added:

- **Happy Dream Center** — logo reads 행복드림센터; several unrelated Korean orgs
  share the name (a university counselling centre, a Gwangju welfare centre, a
  dead donation site). EMC needs to say which one. (`name` updated to the fuller
  "Happy Dream Center".)
- **GABRIELA** — social media only.
- **Philippine Kopino Family** — ties to "We Love Kopino / WLK", which has drawn
  public criticism; left for EMC to decide.

## Images

`src/data/wordpress-images.json` manifests all 48 library images with a
`localPath` and best-effort `usedOn`. All 48 have been **downloaded** into
`public/images/` (`scripts/fetch-wp-images.ps1`, re-runnable). Referenced as
plain `<img>` for now — not yet moved to `astro:assets`. Notes:

- Two different files are both named `logo.png` (`2022/08` = Yanco logo,
  `2022/12` = GGC logo). The manifest maps the December one to
  `/images/2022-12-logo.png`.
- Partners "Life Giving Tree" reused EMC's own header logo (`toplogo2.png`) on
  the live site — almost certainly a mistake. An unused `givingtree.jpg` exists
  and is probably the intended logo.
- `cropped-KakaoTalk_20210823_132215728.png` (512×512) looks like the site
  icon/favicon; `cropped-BBHMMNVGFY_643x362-*` look like header-logo crops.
- ~14 `*_n.jpg` Facebook-style photos are in the library but unreferenced —
  candidates for a future gallery.

## Content cleanup applied

GenerateBlocks wrapper markup (`<div class="gb-*">`, `<div class="wp-block-*">`)
was dropped. Text was converted to Markdown and reflowed to one-line paragraphs.
Obvious errors in the source (often rough machine translation) were lightly
corrected — e.g. "mission **with** your help" → "**without**"; "Kopinoi" →
"Kopino"; "provides **excavation** and support" → "traces absent fathers and
provides support"; "help move or move goods" → "help people move house or
transport goods"; the hero line "regardless of national / helps mothers…" →
"Helping mothers and children in crisis — regardless of nationality or race."
Original phrasing is otherwise preserved. HTML entities were decoded. All
absolute `http://141.164.55.18/...` links were rewritten to root-relative Astro
routes.
