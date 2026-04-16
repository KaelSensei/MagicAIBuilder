---
name: web-performance
description:
  PageSpeed and Core Web Vitals checklist for web projects. Use when building UI, shipping a page,
  reviewing front-end code, or running /audit-code, /beautify, /done on a web target.
---

# Web Performance Skill

Reference checklist for web performance: PageSpeed Insights score and Google Core Web Vitals. The
standard is non-negotiable for production web pages: **PageSpeed >= 90/100** on mobile, **all Core
Web Vitals in the green** on real-user data.

## When to use this skill

- Before merging any branch that ships or modifies a public web page.
- When running `/audit-code`, `/beautify`, `/feature`, `/fix`, or `/done` on a web target.
- When the user asks "is this fast enough?", "what's the LCP?", or mentions PageSpeed/Lighthouse.
- When designing or reviewing UI that affects layout, images, fonts, scripts, or third-party tags.

## How this skill is used

**Users do not invoke skills directly.** Skills are reference knowledge that the AI loads
automatically when it detects a matching task, or when a command explicitly says "use the
`web-performance` skill."

- **Automatic:** The AI loads this skill when working on web pages, UI, or front-end perf.
- **Referenced by:** `/beautify`, `/audit-code`, `/feature`, `/done` -- these commands include a
  performance validation step that uses this skill's checklist.

## Targets (non-negotiable for production web)

| Metric              | Target (mobile, p75 field) | Notes                                    |
| ------------------- | -------------------------- | ---------------------------------------- |
| PageSpeed score     | **>= 90 / 100**            | Lighthouse mobile run                    |
| LCP                 | **<= 2.5 s**               | Largest Contentful Paint                 |
| INP                 | **<= 200 ms**              | Interaction to Next Paint (replaced FID) |
| CLS                 | **<= 0.1**                 | Cumulative Layout Shift                  |
| FCP                 | **<= 1.8 s**               | First Contentful Paint                   |
| TTFB                | **<= 800 ms**              | Time To First Byte                       |
| Total Blocking Time | **<= 200 ms**              | Lab metric, proxy for INP                |

If a page falls below any target, treat it as a release blocker until justified or fixed.

## Checklist

### 1. Largest Contentful Paint (LCP)

- [ ] Hero image has `fetchpriority="high"` and is **not** lazy-loaded.
- [ ] Hero image is properly sized (no oversized assets) and served as AVIF/WebP with fallback.
- [ ] Critical CSS is inlined or preloaded; no render-blocking stylesheets above the fold.
- [ ] Web fonts use `font-display: swap` and are preloaded if used in the hero.
- [ ] Server response time (TTFB) under 800 ms; CDN in front of static assets.
- [ ] No client-side rendering for the hero on initial load when avoidable (SSR/SSG preferred).

### 2. Interaction to Next Paint (INP)

- [ ] No long tasks (> 50 ms) on the main thread during initial interaction.
- [ ] Heavy JS deferred (`defer`/`async`) or moved to a worker.
- [ ] Third-party scripts (analytics, chat, ads) loaded lazily or after `load` event.
- [ ] Event handlers debounced/throttled where appropriate.
- [ ] Hydration cost minimized (islands, partial hydration, RSC where applicable).

### 3. Cumulative Layout Shift (CLS)

- [ ] All images and videos have explicit `width` and `height` (or aspect-ratio).
- [ ] Ad / embed slots have reserved space (min-height) before they load.
- [ ] Web fonts preloaded; size-adjust used to match fallback metrics.
- [ ] No content injected above existing content after load (banners, cookie bars use overlay).
- [ ] Skeletons or fixed-size placeholders for async UI.

### 4. JavaScript and bundles

- [ ] Bundle size budget set and enforced (e.g. main bundle <= 170 KB gzipped).
- [ ] Code-splitting per route; no single mega-bundle.
- [ ] Tree-shaken dependencies; check for accidental large imports (lodash full, moment, full icon
      packs).
- [ ] No unused polyfills shipped to modern browsers (use `module`/`nomodule` or browserslist).
- [ ] Source maps generated but not shipped to clients in production unless needed.

### 5. Images and media

- [ ] Modern formats (AVIF preferred, WebP fallback, JPEG/PNG only as last resort).
- [ ] Responsive images via `srcset` / `sizes` or framework `<Image>` component.
- [ ] Below-the-fold media uses `loading="lazy"` and `decoding="async"`.
- [ ] Videos use `preload="metadata"` (not `auto`) and a poster image.
- [ ] SVGs minified; raster icons replaced with inline SVG or icon font subset.

### 6. Fonts

- [ ] Self-hosted or preconnected to a single font provider.
- [ ] Subset to required glyphs / weights only.
- [ ] `font-display: swap` to avoid invisible text (FOIT).
- [ ] At most 2 font families and 4 total weights on any page.

### 7. Network and caching

- [ ] HTTP/2 or HTTP/3 enabled.
- [ ] Static assets served with long-lived cache headers + content hash in filename.
- [ ] HTML response uses sensible cache + revalidation strategy.
- [ ] Brotli (preferred) or gzip compression enabled.
- [ ] DNS preconnect / preload hints for critical third parties only.

### 8. Third parties

- [ ] Each third-party script is justified -- remove unused tags.
- [ ] Tag manager / analytics loaded after first interaction or via `requestIdleCallback`.
- [ ] Embedded widgets (YouTube, Twitter, maps) lazy-loaded behind a placeholder.
- [ ] No third-party CSS that blocks rendering.

### 9. Accessibility intersects performance

- [ ] No layout shifts caused by focus rings or skip links.
- [ ] Reduced-motion preference honored (`prefers-reduced-motion`).
- [ ] Animations use `transform`/`opacity` (composited), not layout properties.

## How to measure

1. **Lab (during development):**
   - Run **Lighthouse** in Chrome DevTools (mobile preset, throttled CPU + network).
   - Or `npx lighthouse <url> --preset=desktop` / `--preset=perf` from CLI.
   - Or **PageSpeed Insights**: <https://pagespeed.web.dev/>

2. **Field (real users, p75):**
   - Google **Chrome UX Report (CrUX)** via PageSpeed Insights.
   - Or `web-vitals` JS library streaming to your analytics.
   - Or Vercel / Cloudflare / New Relic real-user monitoring.

3. **Continuous:**
   - Add Lighthouse CI to the pipeline (assertions on score and metrics).
   - Track perf budget in CI; fail the build on regression.

## Report format

After running the checklist, structure findings as:

| Metric    | Lab value | Field value | Target | Status |
| --------- | --------- | ----------- | ------ | ------ |
| PageSpeed | 78        | n/a         | >= 90  | RED    |
| LCP       | 3.2 s     | 2.9 s       | 2.5 s  | RED    |
| INP       | 180 ms    | 160 ms      | 200 ms | GREEN  |
| CLS       | 0.05      | 0.04        | 0.1    | GREEN  |

Then list violations grouped by severity:

1. **Blocker** -- any Core Web Vital in the red on field data.
2. **High** -- PageSpeed score < 90, lab metric in the red.
3. **Medium** -- Single optimization missing (e.g. image not in AVIF) but metrics still green.
4. **Low** -- Style / hygiene (e.g. unused font weight).
5. **Positive** -- Patterns worth keeping.

For each finding: file path, root cause, suggested fix, expected metric impact.

## Common root causes

- Hero image not preloaded or served too large.
- Render-blocking CSS / fonts on the critical path.
- A single heavy third-party script (chat, analytics, A/B tester).
- Hydration of an entire SPA when an SSR snapshot would suffice.
- Unbounded list rendering (no virtualization).
- Layout shift from late-arriving banners, ads, or web fonts.
- Forgotten `width`/`height` on images.
