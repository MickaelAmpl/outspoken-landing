# OutSpoken landing page

Live: **https://outspoken.digital**

OutSpoken is a service I am starting with my partner Max: LinkedIn for founders of Europe-based B2B AI SaaS. This is the code of its landing page, launched on 11 November 2026.

> Public copy of the production repository, published as one snapshot. The working repository, the positioning research and the pricing stay private.

## What I did

I am a product person, not a software developer. I took the page from positioning to production: the audience and messaging, a brand and a design system in Figma, an approved mockup, then the build. The code was written with Claude Code from a written build brief, and I checked every step in the browser.

- **Plain static site.** HTML, CSS and plain JavaScript, no framework, no runtime CDN. A small Node script (`tools/assemble.mjs`, no dependencies) assembles the page from parts and bundles the CSS.
- **Own booking flow.** Every "Book an intro call" button opens a booking popup on the page, built on the Cal.com API (free slots, then the booking), instead of sending the visitor to another site. The popup is prepared after page load, so it opens in about half a second.
- **Fast.** PageSpeed on 11 November 2026: 100 in all four categories on mobile and on desktop ([report](https://pagespeed.web.dev/analysis/https-outspoken-digital/fbqwkn1ri5)).
- **Hosting.** Cloudflare Pages, built from GitHub on every push; cache headers so a deploy shows up at once; security headers; the preview address is kept out of search.

Fonts: Mona Sans, Geist Mono and Kalam ship in `fonts/` (SIL Open Font License). Zodiak (Fontshare, ITF Free Font License) is not included in this copy: download `zodiak-400.woff2` from fontshare.com into `fonts/` to build the page with its headings.

## Build and run

```
node tools/assemble.mjs                                   # cleans and writes ./dist (needs Node 22, no dependencies)
python3 -m http.server 4310 --directory dist              # open http://localhost:4310/
```

CSS is bundled at build time: for each page, the `<link rel="stylesheet">` tags found in the built HTML (in order) are concatenated, comments and blank lines stripped, into one file (`dist/css/site.css` for index.html, `dist/css/404.css` for 404.html, `dist/css/privacy.css` for privacy.html) and replaced by a single link. The `src/*.html` link lists stay the source of truth (a new `<link>` there is bundled automatically); the individual `css/tokens.css`, `css/base.css` and `css/sections/` files are not copied to `dist/`.

`dist/` is generated and git-ignored; nothing is written to the site root. Edit `src/`, `site.config.json` or the static files, then run assemble again. `dist/` contains only public files: index.html, 404.html, css/ (bundles only), js/, fonts/, img/, favicon.ico, apple-touch-icon.png, robots.txt, sitemap.xml, _headers (plus privacy.html and css/privacy.css when PUBLISH_PRIVACY is true). `site.config.json`, `src/`, `tools/`, README and dotfiles never reach `dist/`.

## Deploy (Cloudflare Pages)

- Build command: `node tools/assemble.mjs`
- Build output directory: `dist`
- Node 22 (set `NODE_VERSION=22` if the default differs), no install step.
- `_headers` (security headers, long cache for /fonts/*, and `X-Robots-Tag: noindex` on every `*.pages.dev` host so the Pages test address is not indexed; the custom domain outspoken.digital gets no noindex) and `404.html` (shown for any missing URL) are picked up by Cloudflare Pages automatically from `dist/`.
- `robots.txt` and `sitemap.xml` are static files in the site root; update the sitemap `lastmod` when the page changes.

## Switches in site.config.json

- `PUBLISH_PRIVACY`: `false` (now) = privacy.html and its CSS bundle are not built into `dist/` and the footer shows no Privacy link. `true` = both are published and the footer link appears. Fill the placeholders in `src/privacy.html` and get legal review before switching it on.
- `CALENDLY_URL`: the booking page (now `https://cal.com/outspoken/intro-call`); every "Book an intro call" button uses it.
- `EMAIL`: footer mailto. (The footer has no LinkedIn icon; LinkedIn links are the two founder names in Why us.)

## Base classes and tokens

Breakpoint: phone below 900px (`@media (max-width: 899.98px)`), desktop from 900px. Phone values of tokens switch on `:root` in tokens.css, so section CSS normally needs no media query for type size, gutter, section gap or heading gap.

### Classes in css/base.css

- `.container` - centered content column: width = min(1104px, 100% - 2 x gutter). 1104 at 1440, 836 at 900, 343 at 375.
- `.section` - adds `margin-top: var(--section-gap)` (160 desktop / 80 phone). Put it on every section root after the hero. Hero to Problem and CTA to footer keep their own gaps: override `margin-top` in that section's CSS.
- `.eb` - eyebrow label: Geist Mono 500, 12px (phone 11px), uppercase, tracking .09em, secondary text color.
- `.head` - section head block: centered flex column, gap 16px, `margin-bottom: var(--heading-gap)` (48 / 32). Holds `.eb`, `.h2`, optional `.sub`. Do not add a top margin to the content that follows it.
- `.h2` - section heading: Zodiak 400, 48px (phone 32px), line-height 1.08, max-width 760px, text-wrap balance. Use on the `<h2>`.
- `.sub` - sub line under the heading: 18px (phone 16px), secondary color.
- `.btn` - primary button: navy, porcelain text, 48px high, radius 10, Mona Sans 600 15px; hover and `:focus-visible` states.
- `.btn.s` - small variant (40px, header).
- `.btn.gh` - ghost variant: white fill, navy 1px inset border (Pricing, Voice card).
- `.btn.y` - accent variant: #F6A700 fill, navy text, 52px high, 16px text (Final CTA); focus ring turns marker-yellow for the dark panel.
- `.ac` - `position: relative` helper for accent spans.
- `.ac.ul` - marker underline (hand-drawn yellow stroke) under one heading word. Not wrapped across lines.
- `.visually-hidden` - screen-reader-only text.
- Global rules (not classes): reset, `body` (porcelain background, navy text, Mona Sans, 16px/1.55, `overflow-x: clip`), `[id] { scroll-margin-top: var(--anchor-offset) }`, `:focus-visible` (2px navy outline, 2px offset), `[hidden]`.

Not in base (section-specific, build in section CSS): hero marker selection frame `.ac.sel` and `.mk`, post wall, header card, problem cards and scenes, timeline, note and prints, pricing cards, FAQ rows, CTA panel, footer, `.ac.hl` highlighter, `.lbl` uppercase sans label.

### Tokens in css/tokens.css

Colors
- `--c-navy` #162760 ink, primary button, dark panels
- `--c-navy-hover` #1f3380 primary button hover (added, not in mockup)
- `--c-porcelain` #fcfffc page background
- `--c-white` #fff cards
- `--c-text-2` #676d7a secondary text
- `--c-text-3` #b9bdc7 muted text
- `--c-border` #e5e8ed hairlines and card borders
- `--c-border-2` #d1d4dc stronger and dashed borders
- `--c-marker` #fbd387 highlighter
- `--c-link-underline` #fdbe45 link underline accent
- `--c-button` #f6a700 accent button, list bullets
- `--c-tint` #f1f3f8 active row, summary panel
- `--c-tint-2` #f4f6fa scene background
- `--c-tint-3` #eef1f6 small number chip
- `--c-on-navy-soft` #c4d6f9 secondary text on navy
- `--c-amber-text` #ac6600 amber text
- `--c-paper`, `--c-paper-grid`, `--c-pen`, `--c-pencil` notebook note colors
- `--c-focus` focus ring color (= navy)

Fonts
- `--font-serif` Zodiak (headings), `--font-sans` Mona Sans, `--font-mono` Geist Mono (eyebrow only), `--font-hand` Kalam (Why us note only)

Type (desktop value, phone value switches automatically)
- `--fs-h1` 60 / 34, `--lh-h1` 1.16, `--ls-h1` -0.02em
- `--fs-h2` 48 / 32, `--lh-h2` 1.08, `--ls-h2` -0.015em
- `--fs-lead` 20 / 17, `--lh-lead` 1.45
- `--fs-sub` 18 / 16
- `--fs-body` 16, `--lh-body` 1.55
- `--fs-small` 15, `--fs-xs` 13
- `--fs-eyebrow` 12 / 11, `--lh-eyebrow`, `--ls-eyebrow` .09em
- `--fs-label` 12, `--ls-label` .06em (uppercase sans label)
- `--fs-wordmark` 26 / 22
- `--fs-btn` 15

Radius: `--r-xs` 4, `--r-sm` 8, `--r-btn` 10, `--r-md` 12, `--r-lg` 16, `--r-pill` 999

Shadows: `--shadow-header` (header after scroll), `--shadow-card`, `--shadow-ui` (scene mini-UI), `--shadow-tile`, `--shadow-post` (wall post)

Spacing and layout
- `--space-1..9` = 4, 8, 12, 16, 24, 32, 48, 80, 160
- `--container` 1104px, `--gutter` 32 / 16, `--section-gap` 160 / 80, `--heading-gap` 48 / 32, `--head-inner-gap` 16, `--h2-max` 760px
- `--header-pad-top` 16 / 12, `--header-h` 64 / 56, `--anchor-offset` 104 / 84 (scroll-margin and JS scroll offset)

Motion: `--dur-fast` .25s, `--dur-med` .35s, `--dur-slow` .7s, `--ease-out` cubic-bezier(.2,.7,.2,1), `--ease-pop` cubic-bezier(.3,1.6,.5,1)

## Placeholders (site.config.json)

- Every "Book an intro call" button uses `{{CALENDLY_URL}}` from site.config.json.
- `EMAIL` = hello@outspoken.digital (footer `mailto:`).

## Open items

- Calendly link
- Imprint: removed by decision 11 Nov (the site does not show where we are located); no page, no footer link
- Privacy: NOT published (PUBLISH_PRIVACY=false, decision 11 Nov). `src/privacy.html` is a template with visible placeholders (controller name and address, hosting provider, log and data retention, Calendly transfer basis, supervisory authority, date); needs legal review before launch (HTML comment at the top of `src/privacy.html`)
- OG image `img/og.png` (1200x630), referenced in `src/index.html`
- Why us: the captions "Mykhailo" and "Maksym" under the founder photos link to their LinkedIn profiles (new tab, `rel="noopener"`, marigold underline on hover/focus); URLs are in `src/parts/why.html`
- Original founder photos (current ones are 200x200 from Max's site)
