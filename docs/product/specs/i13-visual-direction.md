# Spec: Visual Direction (I-13)

> **Initiative:** [I-13 in the roadmap](../roadmap.md) · **Status:** Next · **Audited:** 2026-11-08
> **Owns:** the visual direction, its tokens and its acceptance thresholds. **Does not own:** the functional surfaces being restyled.

## Overview

The roadmap's first I-13 slice asks for an audit and an agreed direction before implementation. This spec is that deliverable: what the audit measured, what it found, the direction chosen, and the thresholds each redesigned slice must meet.

## What the audit found

Measured on 2026-11-08 from a local dev server at 1440×900 and 390×844, with contrast computed from the real values in `src/styles/globals.css`.

### Blocking

1. **No card art anywhere.** The hero's product preview is four empty rounded rectangles and an unlabelled bar chart. On mobile the preview is hidden entirely, so a phone visitor sees no product visual at all. Magic's own art is the one visual asset the category gives away free, and every incumbent leads with it.

2. **The documented identity does not exist in the code.** `docs/design/design-system.md` describes Cinzel Decorative, a `--gold` family, a noise overlay and floating mana. `grep --gold src/` returns **0 results**. The doc claims `--background: #0a0a0f` and `--accent: #6366f1`; the code says `#1b1628` and `#7c3aed`, plus a "lumen" token layer the doc never mentions.

### To fix

3. **A dead 3D stack is still declared.** `three`, `gsap`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing` and `@types/three` have **0 imports** in `src/`. `public/textures/` ships leather, paper and stone maps nothing references. The README still advertises a "3D landing experience".

4. **Borders fail WCAG 1.4.11**, which requires 3:1 for component boundaries:

| Pair                                    | Ratio  | Required |
| --------------------------------------- | ------ | -------- |
| `--border #443a5e` / surface (dark)     | 1.51:1 | 3:1      |
| `--border #e4dcf2` / white (light)      | 1.33:1 | 3:1      |
| `--accent #7c3aed` as text / background | 3.09:1 | 4.5:1    |

`src/components/deck/MoxfieldProfileResults.tsx:102` applies `text-[var(--accent)]` to a `text-xs` link — the failing pair, on the smallest text in the interface.

5. **Brackets are encoded by hue alone.** Green, blue, amber, red each pass 3:1 individually, but a deuteranopic player cannot separate bracket 1 from bracket 4 — exhibition from optimized.

### To tighten

6. The first screen carries a headline, a paragraph and a button, then roughly 150 px of nothing. 7. The same action appears four times under two labels ("Start a guest deck" ×3, "Guest deck" in the nav). 8. "Commander field guide" appears three times in one viewport. 9. Three always-visible theme buttons compete with the only call to action on a 390 px screen.

### What works, and must survive

Text contrast is **excellent** — 16.09:1 primary, 8.06:1 secondary. The light theme is better balanced than the dark one. The hero headline states the product in one sentence. The capability copy describes real functions without inflation.

## The direction

**Two registers, one token set.**

- **The instrument** for the application — editor, analysis, acquisition. Dense, tabular, calm. Monospace tabular figures wherever digits compare in a column. One signal hue. A provenance chip on every piece of external data. This register _is_ the "AI you can check" positioning made visible, and it is what no competitor's UI expresses.
- **Paper and ink** for everything public — landing, public decks, discovery. The interface recedes and card art carries the colour. The five mana colours, already in the token set, are the only semantic palette.

They are not two designs. They share neutrals, type scale and spacing, and differ in density and in how much imagery is allowed. One system, two settings.

**Rejected:** a fantasy-serif "grimoire" register. It is what the current documentation describes, it photographs well on one mockup, and it degrades fastest under the density of a 100-card editor. Choosing it would require a discipline no one sustains, and it dates quickly. Keep Cinzel out of the product.

## Token requirements

1. **Every token is defined in the base `:root`.** A colour whose only definition sits inside a media query or a `[data-theme]` block never applies in the unstamped default state.
2. **Borders meet 3:1** against the surface behind them, in both themes. This is a correction, not a preference.
3. **`--accent` is never a text colour.** Dark themes use `--accent-text`, which already measures 9.54:1. The failing call site above is the first fix.
4. **No status is encoded by hue alone.** Bracket, severity and legality each carry a shape, a glyph or a number in addition to colour.
5. **One accent.** Semantic colours — good, warning, critical — are separate from the accent and do not become a second brand hue.
6. **Tabular numerals** wherever figures align in columns.

## Non-goals

- A native mobile application. Narrow web widths are in scope; an app is not.
- Rewriting working functionality for visual reasons.
- Copying Moxfield's or EDHREC's layout, artwork or interaction details.
- Reviving the 3D landing. The direction above replaces it; the dependencies should be removed rather than reconnected.

## Acceptance thresholds per slice

A redesigned slice is not done until all of these hold:

- Every text pair meets 4.5:1; every component boundary meets 3:1; measured, not estimated.
- No information is conveyed by colour alone.
- Keyboard focus is visible on every interactive element; the slice is operable by screen reader.
- The slice renders correctly in all **three** theme states: explicit light, explicit dark, and unstamped system default.
- No horizontal body scroll at 390 px; wide content scrolls inside its own container.
- Visual regression coverage exists for the slice.
- Lighthouse performance does not regress against the pre-slice measurement.

## Delivery slices

| #   | Slice                                                                                                      | Depends on |
| --- | ---------------------------------------------------------------------------------------------------------- | ---------- |
| 1   | **Token corrections** — borders to 3:1, accent-as-text removed, non-colour status encoding                 | —          |
| 2   | **Remove the dead 3D stack** and align the README with reality                                             | —          |
| 3   | **Rewrite `design-system.md` from the code**, including the lumen layer                                    | 1          |
| 4   | **Card art in the hero** — a real commander, its colour identity, three cards, with a designed empty state | 1          |
| 5   | Deck library and navigation in the instrument register                                                     | 1, 3       |
| 6   | Deck editor: card views, warnings, analytics, at density                                                   | 5          |
| 7   | Public decks and discovery in the paper-and-ink register                                                   | 4          |
| 8   | Responsive, accessibility, visual-regression and performance validation across the redesigned journey      | 5, 6, 7    |

Slices 1, 2 and 3 are corrections with no aesthetic debate attached, and should land before any restyling begins. Slice 4 is the highest visible return for the least effort in the whole initiative.

## Open questions

- Which card art appears in the hero for a visitor with no deck? A fixed curated commander is predictable and legally safe; a rotating one is livelier and harder to keep looking deliberate.
- Does the instrument register survive the landing page, or does the split confuse the brand? The shared token set is the mitigation, but it needs one side-by-side review before slice 7.
- `public/textures/` is 32 KB of unused leather, paper and stone. Delete with slice 2, or keep for the paper-and-ink register? Keeping unused assets is how the 3D stack survived this long.
