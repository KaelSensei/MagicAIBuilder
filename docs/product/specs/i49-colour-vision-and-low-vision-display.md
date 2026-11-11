# I-49: A Display That Works For Colour-Blind And Low-Vision Players

> **Initiative:** I-49, proposed for the [roadmap](../roadmap.md) · **Status:** Proposed · **Priority:** Next; Later for slice 14, the display control, which waits for I-24's motion bundle (marked 2026-11-10) · **Written 2026-11-10**
> **Research:** one dated note on colour-vision prevalence, Magic clients and deck sites, player requests, palettes, simulation, test tooling and EU accessibility law. It is not committed, so every external fact links its own source in [Sources](#sources). Contrast ratios and colour distances are computed from the token values on `dev`, with the method stated. Legal points are research, not legal advice; they go to the lawyer list in [I-30 requirement 7.2](i30-business-model-and-paid-tier.md#7-the-legal-gate).
> **Owns:** every signal a sighted player reads from colour (WCAG 1.4.1); the contrast of status colours, charts, symbols and selected states (1.4.3, 1.4.11); semantic status and chart tokens in both themes; text size, zoom, reflow and spacing (1.4.4, 1.4.10, 1.4.12); forced colours and "more contrast"; the display preferences; the colour-vision test harness. **Does not own:** what a screen reader hears, text alternatives and `aria-pressed` ([I-24](i24-decks-a-screen-reader-can-play-from.md) and accessibility bundles 2 and 3 under [I-24 in the roadmap](../roadmap.md#i-24-decks-a-screen-reader-can-play-from)); page structure and the `prefers-reduced-motion` wiring (bundle 6, same place); dialogs, forms, focus rings and target size (bundles 1, 4 and 5 under [I-04](../roadmap.md#i-04-ux-stability-and-visual-quality)); the visual direction, the border and accent-text corrections and the per-slice thresholds ([I-13](i13-visual-direction.md)); bracket names and levels ([I-28](i28-commander-deckbuilding-guide-by-bracket.md)).

## Overview

Magic is a game of five colours, and a deckbuilder repeats them everywhere: mana costs, colour identity, the colour chart, deck badges, and warnings in red, amber and green. About 8% of men of European ancestry have a red-green colour-vision deficiency [1]. Low vision is common too: at least 2.2 billion people have a near or distance vision impairment [2]. The roadmap never mentions colour blindness.

The product needs **defaults that work without a setting**, not a "colour-blind mode". Every colour signal gets a second channel (a letter, a pictogram, a shape, a number or a position). Every palette is validated against simulated protanopia, deuteranopia and tritanopia in both themes. Text scales to 200% and reflows at 320 CSS px. Reduced motion and Windows contrast themes are honoured. The only preferences added are motion and contrast, for players who cannot change those settings in their operating system.

It passes three tests. A deuteranopic player names every segment of a Simic deck's colour chart without the legend. A player on the light theme reads every warning at 4.5:1 or better. A low-vision player at 200% zoom reads the stats panel without horizontal scrolling and without clipped text.

**Why Next.** The work is small and benefits everyone. The colour-only signals are few. The contrast failures are larger but mechanical: the status colours were tuned for the dark theme and are reused unchanged in the light theme (see [Current state](#current-state-in-this-codebase)). No competitor read offers this, and it is a correction, not a feature to sell.

## What the market does

Read 2026-11-10 unless dated.

| Product                               | Colour vision and low vision                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **MTG Arena**                         | No colour-blind mode found in the patch notes searched. Patch 2023.25.00 (2023-04-19) added "an accessibility toggle for large rules text" [13]. A 2021 article found no official answer beyond one staffer's reply [15]. A 2023 article quotes a player saying Arena "is sorely missing proper colorblind support" and that a friend cannot tell opponents' lands apart [16] |
| **Magic Online**                      | Nothing found on colour-vision options                                                                                                                                                                                                                                                                                                                                        |
| **Scryfall**                          | Mana symbols are marked up as text with a spoken title, `<abbr class="card-symbol card-symbol-R" title="one red mana">{R}</abbr>`, and styled as the symbol [19]. Each SVG is a pale circle with a near-black pictogram. Black and colourless share one circle colour (`#CAC5C0`), so the pictogram, not the hue, identifies them                                             |
| **Archidekt**                         | Mana shown with the Mana icon font (`ms ms-w`, …), a pictogram per colour [20]                                                                                                                                                                                                                                                                                                |
| **17lands**                           | Loads the Mana font and Keyrune stylesheets on its card data page [21]                                                                                                                                                                                                                                                                                                        |
| **Moxfield**, **EDHREC**              | Not assessed: Moxfield answered 403 to automated requests, and EDHREC's server HTML showed no symbol markup                                                                                                                                                                                                                                                                   |
| **Mana font** (Andrew Gioia, v1.18.0) | Font under SIL OFL 1.1, CSS under MIT; the symbol images are © Wizards [22]. The `ms-cost` style draws pale circles with a `#111` glyph. Neither the README nor the site gives accessibility guidance, and an issue search for colour blindness or accessibility found nothing                                                                                                |

No deckbuilding site read offers a colour-vision setting or says its charts were checked against colour-vision simulation. The official mana symbols already solve the mana case with pictograms. The gaps appear where a site adds colour of its own: charts, status, selected states.

**Players ask for the second channel, not for a palette.** In a 2019 r/MagicArena thread from a low-vision player, a commenter asked for a colour-blind mode and for "a simple character cue, like 'U', 'R' and 'M'" to tell rarities apart (10 points). The original poster asked for cards "without art (only white text over black background)". A Wizards staffer replied that "We definitely want to make the game accessible to all players, but it's hard/expensive" [14]. In 2021 an r/magicTCG post (220 points) asked the moderators to replace yellow text its author measured at 1.8:1, and they did [17]. A 2015 r/magicTCG post about Battle for Zendikar's colourless frames ends "then I look at the symbols and d'oh" [18]. A title search of r/EDH timed out, so this spec claims no r/EDH demand.

**Standards and tools.**

- WCAG 2.2 became a W3C Recommendation on 2024-12-12 [3]. 1.4.1 (A) forbids colour as the only visual means of conveying information. 1.4.3 (AA) sets 4.5:1 for text. 1.4.11 (AA) sets 3:1 for graphics and component states. 1.4.4 (AA) requires text resize to 200%. 1.4.10 (AA) requires reflow at 320 CSS px. 1.4.12 (AA) covers text spacing. 2.3.3 (AAA) lets users disable motion triggered by interaction.
- Okabe and Ito's Color Universal Design advises showing differences by shape, line type or hatching as well as colour, and labelling marks directly rather than through a distant key [4]. Their palette's hex values are in R's `grDevices` [5]. Wong's 2011 _Nature Methods_ column on colour blindness [6] was not read (paywalled), so nothing here rests on it. Okabe–Ito is not usable verbatim on the light theme: its yellow, orange and sky blue measure 1.32, 2.25 and 2.31:1 on white (own computation).
- The physiological simulation of Machado, Oliveira and Fernandes (2009) publishes its matrices [7]. Chrome DevTools implements it [8], and the DevTools protocol exposes `Emulation.setEmulatedVisionDeficiency` with `protanopia`, `deuteranopia`, `tritanopia`, `achromatopsia`, `blurredVision` and `reducedContrast` [9].
- axe-core checks text contrast (`color-contrast`, tagged 1.4.3). Its only 1.4.1 rule is `link-in-text-block`, and no rule is tagged 1.4.11 [10]. A scanner therefore cannot catch a chart that relies on colour, or a bar at 1.2:1.
- In forced-colours mode the browser replaces `background-color`, `border-color` and SVG `fill`, sets `box-shadow` to `none`, and drops gradient `background-image` [11].
- The European Accessibility Act applies from 28 June 2025 to "e-commerce services" among others. It exempts microenterprises providing services (fewer than 10 people and at most €2 million turnover or balance sheet). Annex I asks for "an alternative to colour" and a mode that "does not require user perception of colour" [12]. Whether a subscription makes this product an e-commerce service is a lawyer question (open question 5).

## Current state in this codebase

Verified on `dev` at `72fbfc1` on 2026-11-10. Ratios use the WCAG formula. Tailwind colours come from `tailwindcss` 4.3.3, the version pinned in `pnpm-lock.yaml`, converted from OKLCH. Colour distances are OKLab ΔE × 100 under the Machado severity-1.0 matrices [7].

| Surface                                                                                                                                                                                                 | What the code does                                                                                                                                                                                                                                                                                                                                 | Verdict                                      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Colour identity, filters, deck cards: `ColorIdentityBanner.tsx:73`, `DeckListTable.tsx:23`, `HomeDeckCard.tsx:72`, `DeckWizard.tsx:153`, `BuilderColorSearchPicker.tsx:55`, `SearchFilters.tsx:227,250` | Scryfall SVGs, a pictogram per colour                                                                                                                                                                                                                                                                                                              | Doubled                                      |
| Mana costs: `src/components/card/ManaSymbol.tsx`, used by `CardImage`, `PrintingSelectorModal`, `ShareDeckView`                                                                                         | Letter pills (W U B R G C S); letter on fill is 4.77:1 or better. Letters are `text-[9px]` (`:29`), hybrid halves `text-[8px]`, and the `{2/W}` prefix and the Phyrexian `Φ` are `text-[7px]` at 70% opacity (`:70`, `:81`)                                                                                                                        | Doubled; too small                           |
| `src/components/deck/ColorDistribution.tsx`                                                                                                                                                             | Stacked bar segments carry hue and a `title` only (`:46-59`); legend rows below carry name and count. `--mana-black` `#150b00` is 1.24:1 on the dark surface, blue 2.69, green 2.64; on white, mana white is 1.05:1 and colourless 1.74. Zero counts are dropped, so any two colours can touch: red/green ΔE 7.3 (protan), blue/green 4.3 (tritan) | Fails 1.4.11; segments by hue                |
| `src/components/deck/ManaCurve.tsx`                                                                                                                                                                     | Eight hues for eight mana values (`:14-23`); the axis carries the meaning, but red, green and blue suggest mana colours. Grey 0 and slate 7 differ by ΔE 1.8 even with normal vision; blue 2 and violet 3 by 1.3 under deutan. Grid lines `border-white/10` (`:71`); counts `text-[10px]`; height fixed at 140 px                                  | Misleading hues; light theme loses the grid  |
| Status colours, 106 `.tsx` files, 496 hard-coded `text-`/`bg-`/`border-` red, green, amber, yellow, emerald, orange, rose or lime classes                                                               | No semantic token exists in `src/styles/globals.css`; no `dark:` variant anywhere; the light theme remaps nothing. On white: `red-400` 2.89:1, `blue-400` 2.64, `emerald-400` 1.94, `green-400` 1.78, `amber-400` 1.72, `amber-300` 1.45. On the dark surface all pass (5.44–10.87)                                                                | Light theme fails 1.4.3                      |
| `src/components/deck/DeckStats.tsx:71-81,105-112`                                                                                                                                                       | Warning and error share `AlertTriangle` and differ only by `amber-400` against `red-500`. `GroupedDeckWarnings.tsx` uses a different icon per tone and a titled heading; `SnapshotsPanel.tsx:38-50` shows a sign and a number                                                                                                                      | Tier by hue only                             |
| `src/components/deck/BracketIndicator.tsx`                                                                                                                                                              | Number (`text-4xl`) and name beside the colour (`:145-150`); the bar fills one segment per level. The number uses `BRACKET_TEXT` (`:32-37`): green-400 1.78:1 and amber-400 1.72:1 on white. `--bracket-*` tokens (`globals.css:65-68`) measure 2.15–3.76:1 on white                                                                               | Doubled; light-theme contrast fails          |
| Colour filter toggles: `SearchFilters.tsx:218-223`, `BuilderColorSearchPicker.tsx:44-49`                                                                                                                | Selected state is the `--accent` border, `scale-110` and full opacity. `#7c3aed` on the dark surface is 2.76:1                                                                                                                                                                                                                                     | State indicator under 3:1                    |
| Text size                                                                                                                                                                                               | 154 uses of `text-[7px]` to `text-[11px]` in 51 files, 118 of them at 10 px. Fixed pixel sizes ignore the browser's font-size setting. No `viewport` export, so the Next.js default applies and pinch zoom is not blocked. 200% zoom and 320 px reflow are unmeasured                                                                              | Unmeasured                                   |
| Forced colours, `prefers-contrast`                                                                                                                                                                      | No rule in `src/`. Chart bars paint with inline `background-color` or a `linear-gradient`, which forced colours replace or drop [11]                                                                                                                                                                                                               | Charts expected to vanish (not yet observed) |
| Motion                                                                                                                                                                                                  | Bundle 6 records that Framer Motion ignores `prefers-reduced-motion`. Counted here: `framer-motion` is imported in 18 files with no `MotionConfig`, and the `globals.css:139-149` reduce block covers only `body` and `.card-image-wrapper`. Chart bars grow on mount (`ManaCurve.tsx:117-130`, `BracketIndicator.tsx:257-269`)                    | Owned by bundle 6                            |
| Preferences                                                                                                                                                                                             | Theme stored under `magic-ai-builder-theme` with a pre-paint script (`src/lib/theme/preference.ts`); `ThemeToggle` sits in `Header` and `LandingNavbar`. Settings pages exist only for API keys and notifications. Locales routed: `en`, `fr`                                                                                                      | No display preferences                       |
| Tests                                                                                                                                                                                                   | No axe tool and no `toHaveScreenshot`; `e2e/deck-editor-visual.spec.ts` measures geometry. Lighthouse CI scans three public pages. Playwright 1.64.1's `emulateMedia` accepts `colorScheme`, `contrast`, `forcedColors` and `reducedMotion`                                                                                                        | No colour or zoom test                       |

I-13's audit listed "brackets are encoded by hue alone" ([finding 5](i13-visual-direction.md#to-fix)). On `dev` the number and name now sit beside the colour. What remains is contrast in the light theme. Its border and accent-text findings stay in I-13 slice 1 and are not repeated here.

## Functional requirements

### 1. Principles

1.1 **Defaults that need no setting.** No palette swap and no "colour-blind mode". Every surface reads under protanopia, deuteranopia, tritanopia and achromatopsia as shipped. A mode would split testing, and it implies that the default excludes some players.
1.2 **Mana colours keep their identity.** Players name colours by mana. Chart tokens may change lightness and chroma per theme, never hue family. The official symbols are never recoloured.
1.3 **Free and without an account.** Every requirement here applies to every visitor, guests included. Section 8 explains why.
1.4 **Deterministic.** Nothing here calls a language model ([strategic boundaries](../roadmap.md#strategic-boundaries)).

### 2. A second channel for every colour signal (1.4.1)

2.1 Slice 1 records a **colour-signal register** in `docs/design/colour-signals.md`: every place where colour carries meaning, its second channel, and the test that asserts it. New surfaces add a row in the same PR. I-13 slice 3 links the register from `design-system.md`.
2.2 **Mana.** A colour is always shown by the official pictogram or by a letter. A bare coloured dot, swatch or bar never stands for a mana colour alone.
2.3 **Charts.** Every series or segment carries a direct label, letter or symbol on or beside the mark, in the legend's order. A segment too narrow for its label is separated by a 2 px gap and listed in the legend. Every chart offers a "Show as table" view with the same numbers.
2.4 **Mana curve.** All buckets use one neutral chart hue. The axis label identifies the bucket. No bucket uses a hue that reads as a mana colour.
2.5 **Status tiers.** OK, warning, error and info each have a distinct icon shape (check circle, triangle, octagon, info circle) and a word or count. `DeckStats` warning and error stop sharing `AlertTriangle`.
2.6 **Selected states.** A selected toggle shows a non-colour marker (a check mark, a filled background or a 2 px underline) in addition to colour. Opacity alone is not a marker.
2.7 **Change.** Gains and losses show a sign and a word or number, as `SnapshotsPanel` does. This applies to new history and comparison views ([I-37](i37-editor-depth.md)).
2.8 **Brackets.** Wherever a bracket colour appears, its number and name appear with it.
2.9 **Links in text** are underlined, which axe's `link-in-text-block` checks [10].

### 3. Contrast in both themes (1.4.3, 1.4.11)

3.1 **Semantic status tokens** `--status-{ok,warn,error,info}-{text,fill,border}` are defined in the base `:root` and in `[data-theme="light"]` (I-13 token rule 1). Each `-text` meets 4.5:1 against `--background`, `--surface`, `--surface-elevated`, `--surface-hover` and its own `-fill`, in both themes.
3.2 **No raw status hue in components.** After migration, a lint rule rejects `(text|bg|border)-(red|green|amber|yellow|emerald|orange|rose|lime)-NNN` in `src/components` and `src/app`, with an empty allowlist.
3.3 **Chart tokens** `--chart-mana-{w,u,b,r,g,c}`, `--chart-neutral`, `--chart-grid` and `--chart-outline` are defined per theme. Each mark meets 3:1 against the chart surface, or carries a 1 px `--chart-outline` that does (black on dark, white on light).
3.4 **Bracket tokens per theme.** The bracket number meets 3:1 where it is large text in WCAG's sense, and 4.5:1 otherwise.
3.5 **State indicators** (selected borders, markers) meet 3:1 against adjacent colours in both themes.
3.6 **Grid lines** exist in both themes. Where they carry the scale, they meet 3:1.
3.7 Border and accent-text corrections remain [I-13 slice 1](i13-visual-direction.md#delivery-slices).

### 4. Palettes validated against simulated colour vision

4.1 A pure module `src/lib/a11y/palette.ts` exports `contrastRatio`, `simulateCvd(hex, "protan" | "deutan" | "tritan")` with the Machado severity-1.0 matrices [7], `deltaE` (OKLab × 100) and `validatePalette(colours, surface)`.
4.2 **Thresholds**, a product decision: every pair of chart colours that can touch is at least ΔE 8 under each simulation and 15 with normal vision. Because zero counts are dropped, every pair of the six mana chart colours counts as touching. A pair between 6 and 8 is allowed only where requirement 2.3 labels every mark.
4.3 The check runs per theme against the real surface tokens. The tokens are read from `src/styles/globals.css`, so no hex value is duplicated in a test.
4.4 **Feasibility.** A random search on 2026-11-10 inside mana hue bands found palettes that pass every pair at ΔE 13.1 or more (dark) and 10.1 or more (light). Every mark except black on dark and white on light reached 3:1. Example, dark: W `#f9f3d3`, U `#4173ad`, B `#463631`, R `#b65030`, G `#84cc7c`, C `#939292`. These are evidence that the thresholds can be met, not a design choice.
4.5 The status tokens pass the same check pairwise, so warning and error separate even before their icons are read.

### 5. Text size, zoom, reflow and spacing (1.4.4, 1.4.10, 1.4.12)

5.1 Font sizes are in `rem`. No informational text is below 12 CSS px (0.75 rem) at default settings. The exception is the letter inside a mana pill, which is at least 10 px and sized in `em`. Pills grow with their text.
5.2 At 200% zoom (a 1280×800 window, about 640×400 CSS px), the landing page, deck library, builder (search, deck, stats), playtest and public deck page lose no content or function.
5.3 At 320 CSS px width there is no two-dimensional page scroll. Wide tables and charts scroll inside their own container.
5.4 With the WCAG 1.4.12 spacing applied, no chip, badge, pill or button clips its text.
5.5 With the root font size doubled, text grows and fixed-height containers (`ManaCurve`'s 140 px, `h-8` buttons) do not clip it.
5.6 Pinch zoom is never blocked: no `maximum-scale` and no `user-scalable=no`.

### 6. Motion, forced colours and more contrast

6.1 **Reduced motion** is honoured through bundle 6, which makes Framer Motion and the CSS respect `prefers-reduced-motion`; the "reduce" preference in 7.1 feeds the same switch. This spec adds one assertion: under "reduce", chart bars render at their final size on the first frame.
6.2 **Forced colours.** Under `forced-colors: active`, nothing that carries information disappears. Chart marks get a system-colour border (`CanvasText`), and selected states use `Highlight`. No separate design is built for forced colours [11].
6.3 **More contrast.** Under `prefers-contrast: more`, or the in-app preference, translucent tints (`/10`, `/15`) become opaque fills, `--text-secondary` reaches 7:1 and component borders 4.5:1.

### 7. Display preferences

7.1 One **Display** control sits beside the theme buttons in `Header` and `LandingNavbar`. It offers motion (follow system, reduce) and contrast (follow system, more). There is no colour-vision option (requirement 1.1).
7.2 Preferences are stored in `localStorage` like the theme and applied before paint as `data-motion` and `data-contrast` on `<html>`. They work for guests. There is no server column in version 1.
7.3 Labels exist in `en` and `fr`. The defaults follow the system, with no prompt and no onboarding step.

### 8. Free and paid ([I-30](i30-business-model-and-paid-tier.md))

8.1 **Nothing here is paid, ever.** A player who needs contrast or a second channel would otherwise pay more for the same product. These surfaces are the evidence the product shows, which the strategic boundaries keep free. No competitor read charges for anything comparable.
8.2 **Indirect value only.** [I-31](i31-deck-lab.md) and [I-34](i34-commander-data-reports.md) charts, and [I-36](i36-creator-and-embed-toolkit.md) embeds, inherit sections 2 to 4. A chart that reads in grayscale, in print and when embedded is a quality any paid report needs, but it is never the thing sold.

## Data model / API

No server data and no API.

```
localStorage "magic-ai-builder-display"  { version: 1, motion: "system" | "reduce", contrast: "system" | "more" }
<html data-theme="light|dark" data-motion="reduce"? data-contrast="more"?>

globals.css (:root, [data-theme="light"], [data-contrast="more"], @media (prefers-contrast: more), @media (forced-colors: active))
  --status-{ok,warn,error,info}-{text,fill,border}
  --chart-mana-{w,u,b,r,g,c}  --chart-neutral  --chart-grid  --chart-outline

src/lib/a11y/palette.ts   contrastRatio · simulateCvd · deltaE · validatePalette
```

## Non-goals

- A colour-blind palette mode, or one mode per deficiency type (requirement 1.1).
- Recolouring or filtering card images. Card names, costs and text are already shown as text.
- Replacing or recolouring the official mana symbols.
- Text alternatives, screen-reader output and focus management ([I-24](i24-decks-a-screen-reader-can-play-from.md), [I-04](../roadmap.md#i-04-ux-stability-and-visual-quality) bundles).
- AAA contrast (7:1) by default. It is available through "more contrast".
- Claiming WCAG conformance. Each slice says what was tested and by whom, as I-24 requires.
- A native application.

## Testing strategy

Each slice records its focused Red failure, per [`docs/engineering/tdd-with-ai.md`](../../engineering/tdd-with-ai.md).

- **Palette maths (solitary).** `palette.ts` reproduces the WCAG reference pair (`#767676` on white is 4.54:1) and the published Machado matrices [7]. Red: the module does not exist.
- **Token contrast (solitary).** A test parses `globals.css` and asserts the pairs in requirements 3.1, 3.3, 3.4 and 3.5 for dark, light and "more contrast". Red today: `--mana-black` on `--surface` is 1.24:1.
- **Palette under simulation.** The chart and status tokens pass requirement 4.2 in both themes. Red today: mana red and green are ΔE 7.3 under protan.
- **Lint.** The rule in 3.2 fails on today's 496 occurrences and passes at zero.
- **Components (sociable, `renderWithIntl`).** `ColorDistribution` renders a letter or symbol per segment and offers a table. `DeckStats` renders different icons for warning and error, asserted through a `data-status` attribute. `ManaCurve` uses one chart token.
- **Simulated colour vision (E2E, Chromium).** A CDP session calls `Emulation.setEmulatedVisionDeficiency` [9] for protanopia, deuteranopia, tritanopia and achromatopsia. It captures the stats panel, search filters, deck library and public deck in both themes with `toHaveScreenshot`. A person reviews the baselines once; later diffs fail the run.
- **Forced colours and contrast.** `page.emulateMedia({ forcedColors: "active" })` and `({ contrast: "more" })`: every chart mark keeps a nonzero box and a computed border colour different from the canvas.
- **Zoom and reflow.** At 640×400 and at 320×640, `scrollWidth` does not exceed `clientWidth` on the six journeys. With the 1.4.12 spacing injected, no chip has `scrollHeight > clientHeight`. With `html { font-size: 200% }`, informational text doubles in computed size, which catches leftover `px`.
- **Reduced motion.** With `reducedMotion: "reduce"`, the first frame shows chart bars at full height.
- **Axe.** Reuses I-04's planned `@axe-core/playwright` gate for 1.4.3. The tests above cover what axe does not [10].
- **People.** In slice 15, one colour-blind player and one low-vision player review the changed surfaces. A scanner does not replace them.

## Delivery slices

| #   | Slice                                                                                                                                            | Depends on                                        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| 1   | Measure and inventory: colour-signal register; zoom, reflow, forced-colours and simulated-vision captures of the six journeys; no product change | —                                                 |
| 2   | `src/lib/a11y/palette.ts` and the token contrast test reading `globals.css` (Red recorded, failing pairs listed as expected failures)            | —                                                 |
| 3   | E2E harness: simulated-vision screenshots, forced colours, zoom and reflow, spacing; baselines reviewed                                          | 1                                                 |
| 4   | Semantic status tokens in both themes and a status icon primitive; fix `DeckStats` warning and error                                             | 2                                                 |
| 5   | Migrate raw status hues in deck panels and warnings                                                                                              | 4                                                 |
| 6   | Migrate raw status hues in collection, community and profile                                                                                     | 4                                                 |
| 7   | Migrate raw status hues in builder, search, playtest and the rest; turn on the lint rule with an empty allowlist                                 | 5, 6                                              |
| 8   | Chart tokens and `ColorDistribution`: labels on segments, outlines, table view, validated palette                                                | 2                                                 |
| 9   | `ManaCurve`: one hue, `rem` sizing, grid in both themes, table view                                                                              | 2; bundle 5 (I-04) owns the bars' focus ring      |
| 10  | Bracket number and token contrast per theme; selected-state markers on the colour filters                                                        | 4                                                 |
| 11  | Text sizes: replace `text-[7px]` to `text-[11px]` with the `rem` scale; `em`-sized mana pills                                                    | —                                                 |
| 12  | Reflow and zoom fixes found by slice 1                                                                                                           | 3, 11                                             |
| 13  | Forced colours and "more contrast" rules                                                                                                         | 4, 8, 9, 10                                       |
| 14  | Display control (motion, contrast) beside the theme buttons, `en` and `fr`                                                                       | 13; bundle 6 (I-24 roadmap) for the motion wiring |
| 15  | Review with a colour-blind and a low-vision player, and act on it                                                                                | 7, 8, 9, 10, 12, 13                               |

Slices 1, 2 and 11 can start today and in parallel. Slice 4 fixes the one tier that colour alone separates. Slices 5 and 6 are mechanical and can run in parallel once slice 4 lands; slice 7 closes the migration with the lint rule. Slice 8 is the most visible change.

## Open questions

1. **Overlap with I-13 slice 1.** That slice lists "non-colour status encoding". Should it pass to slices 4 to 10 here, leaving I-13 slice 1 with borders and accent text? Recommended: yes, so that one owner holds each defect.
2. **Who reviews?** I-24 has the same unanswered question. Finding a colour-blind and a low-vision Commander player before slice 7 needs an owner and a channel.
3. **Mana chart hues.** Should the chart tokens stay close to the brand `--mana-*` values and change only lightness, or use the Scryfall circle colours with pictograms on every segment? The second reads as official but needs room for a symbol on each segment.
4. **Sync preferences to the account?** Version 1 is local only. Players on several devices may want sync, which needs a column and a consented default.
5. **European Accessibility Act.** Would a paid subscription make the product an "e-commerce service", and would the microenterprise exemption apply [12]? This is research, not legal advice; add it to the lawyer list in [I-30 requirement 7.2](i30-business-model-and-paid-tier.md#7-the-legal-gate). This spec applies whatever the answer.
6. **Official pictograms in costs.** Should the cost pills switch from letters to the Scryfall SVGs already used for identity, for one visual language? Letters scale and print better. The SVGs match what players see on cards.

## Sources

Read 2026-11-10 unless dated. Ratios and distances marked "own computation" come from the token values on `dev` at `72fbfc1`.

1. J. Birch, "Worldwide prevalence of red-green color deficiency", _JOSA A_ 29(3):313–320, March 2012, doi:10.1364/JOSAA.29.000313, [PubMed 22472762](https://pubmed.ncbi.nlm.nih.gov/22472762/), abstract read through Europe PMC.
2. World Health Organization, [Blindness and vision impairment](https://www.who.int/news-room/fact-sheets/detail/blindness-and-visual-impairment), updated 2026-02-10.
3. W3C, [Web Content Accessibility Guidelines 2.2](https://www.w3.org/TR/WCAG22/), Recommendation 2024-12-12.
4. M. Okabe and K. Ito, [Color Universal Design](https://jfly.uni-koeln.de/color/), 2002-11-20, modified 2008-09-24.
5. R Core Team, [`grDevices/R/palette.R`](https://github.com/wch/r-source/blob/trunk/src/library/grDevices/R/palette.R), the "Okabe-Ito" palette.
6. B. Wong, "Color blindness", [_Nature Methods_ 8:441](https://www.nature.com/articles/nmeth.1618), 2011-06-01; metadata only, text not read.
7. G. M. Machado, M. M. Oliveira and L. A. F. Fernandes, [A Physiologically-based Model for Simulation of Color Vision Deficiency](https://www.inf.ufrgs.br/~oliveira/pubs_files/CVD_Simulation/CVD_Simulation.html), _IEEE TVCG_ 15(6):1291–1298, 2009.
8. M. Bynens, [article on colour-vision deficiency simulation in DevTools and Blink](https://developer.chrome.com/blog/cvd), Chrome for Developers, undated; it links the DevTools 83 release notes.
9. Chrome DevTools Protocol, [`browser_protocol.json`](https://github.com/ChromeDevTools/devtools-protocol/blob/master/json/browser_protocol.json), `Emulation.setEmulatedVisionDeficiency`.
10. Deque, [axe-core rule descriptions](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md), `develop` branch, rules linked to 4.14.
11. MDN, [`forced-colors`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors), last modified 2026-04-20.
12. [Directive (EU) 2019/882](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32019L0882) (European Accessibility Act), 2019-04-17: Art. 2(2)(f), 3(23), 3(30), 4(5), 31(2); Annex I §I 2(d), §VII(c).
13. MTG Arena, [2023.25.00 March of the Machine patch notes](https://mtgazone.com/2023-25-00-patch-notes/), 2023-04-19, as republished by MTGAZone.
14. r/MagicArena, ["Visually impaired trying to play MTG Arena"](https://www.reddit.com/r/MagicArena/comments/easwf2/), 2019-12-15, comments `fayhrtx`, `faz7npd`, `fazomu2`; read through the Arctic Shift archive because reddit.com refuses automated requests.
15. J. Coles, [Will MTG Arena Get Accessibility Options?](https://mtgrocks.com/mtg-arena-accessibility-options/), MTG Rocks, 2021-04-23.
16. A. Atkin, [MTG Arena Is Still Missing Critically Needed Features](https://mtgrocks.com/mtg-arena-is-still-missing-critically-needed-features/), MTG Rocks, 2023-02-07, quoting [u/TheSilverWolfPup](https://www.reddit.com/r/MagicArena/comments/10tv2xo/comment/j7910rh/).
17. r/magicTCG, ["Holy crap please change this yellow text on this sub…"](https://www.reddit.com/r/magicTCG/comments/mfpdrj/), 2021-03-29.
18. r/magicTCG, ["Am I the only one who thinks that Wizards designed Battle for Zendikar to punish us colorblind folks?"](https://www.reddit.com/r/magicTCG/comments/3n5prk/), 2015-10-01.
19. Scryfall, own reading of the [Lightning Bolt page](https://scryfall.com/card/2xm/141/lightning-bolt) markup and of the symbol SVGs, e.g. [`R.svg`](https://svgs.scryfall.io/card-symbols/R.svg).
20. Archidekt, own reading of [deck 28247803](https://archidekt.com/decks/28247803) markup.
21. 17lands, own reading of the [card data page](https://www.17lands.com/card_data) markup.
22. A. Gioia, Mana font: [README v1.18.0](https://cdn.jsdelivr.net/npm/mana-font@1.18.0/README.md), [`mana.css`](https://cdn.jsdelivr.net/npm/mana-font@1.18.0/css/mana.css), [documentation site](https://mana.andrewgioia.com/), [repository](https://github.com/andrewgioia/mana).
