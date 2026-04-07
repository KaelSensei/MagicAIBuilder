# MagicAIBuilder — Design System

Color scheme, typography, and visual identity reference.

---

## Color Scheme

### App (Authenticated UI)

| Token              | Hex       | Usage                   |
| ------------------ | --------- | ----------------------- |
| `--background`     | `#0a0a0f` | Page background         |
| `--surface`        | `#12121a` | Cards, panels           |
| `--surface-hover`  | `#1a1a25` | Hovered surfaces        |
| `--border`         | `#2a2a35` | Borders, dividers       |
| `--text-primary`   | `#e8e8ec` | Body text               |
| `--text-secondary` | `#8888a0` | Muted / secondary text  |
| `--accent`         | `#6366f1` | Primary action (indigo) |
| `--accent-hover`   | `#818cf8` | Hovered accent          |

**Light theme overrides** (via `[data-theme="light"]`):

| Token              | Hex       |
| ------------------ | --------- |
| `--background`     | `#f8f9fa` |
| `--surface`        | `#ffffff` |
| `--surface-hover`  | `#f1f3f5` |
| `--border`         | `#e2e8f0` |
| `--text-primary`   | `#0f172a` |
| `--text-secondary` | `#64748b` |
| `--accent`         | `#6366f1` |
| `--accent-hover`   | `#4f46e5` |

### MTG Mana Colors

| Color     | Hex       | CSS variable       |
| --------- | --------- | ------------------ |
| White     | `#f9faf4` | `--mana-white`     |
| Blue      | `#0e68ab` | `--mana-blue`      |
| Black     | `#150b00` | `--mana-black`     |
| Red       | `#d3202a` | `--mana-red`       |
| Green     | `#00733e` | `--mana-green`     |
| Colorless | `#ccc2c0` | `--mana-colorless` |

### Bracket Colors

| Bracket   | Hex       | CSS variable  |
| --------- | --------- | ------------- |
| Bracket 1 | `#22c55e` | `--bracket-1` |
| Bracket 2 | `#3b82f6` | `--bracket-2` |
| Bracket 3 | `#f59e0b` | `--bracket-3` |
| Bracket 4 | `#ef4444` | `--bracket-4` |

### Landing Page (Marketing)

| Token              | Hex                     | Usage                                       |
| ------------------ | ----------------------- | ------------------------------------------- |
| `--gold` (primary) | `#7c5cfc`               | Brand violet — all UI elements              |
| `--gold-light`     | `#a78bfa`               | Lighter violet — gradients, text highlights |
| `--gold-dark`      | `#4f35c2`               | Deeper violet — button dark end             |
| `--accent`         | `#00e5ff`               | Cyan — AI-specific elements only            |
| `--black`          | `#07060f`               | Page background                             |
| `--deep`           | `#0c0b18`               | Alternate section background                |
| `--card-bg`        | `#100f1e`               | Card/panel backgrounds                      |
| `--surface`        | `#16152a`               | Elevated surfaces (nav, headers)            |
| `--border`         | `rgba(124,92,252,0.22)` | Default border                              |
| `--text`           | `#e2dff5`               | Body text                                   |
| `--muted`          | `#6b6890`               | Secondary text                              |
| `--white`          | `#f0eeff`               | Near-white headings                         |

**Color logic:** Violet (`--gold` family) = product/brand. Cyan (`--accent`) = exclusively AI-related elements (AI prompt bar, AI badge, AI suggestion box). This creates an instant visual language: violet = product, cyan = intelligence.

---

## Typography

### Font Families

| Font                  | CSS Variable         | Weights            | Usage                                   |
| --------------------- | -------------------- | ------------------ | --------------------------------------- |
| **Cinzel Decorative** | `--font-cinzel-deco` | 700, 900           | Hero H1, section H2, logo, step numbers |
| **Cinzel**            | `--font-cinzel`      | 400, 600, 700      | Nav links, labels, buttons, plan names  |
| **Inter**             | `--font-inter`       | 300, 400, 500, 600 | Body text, paragraphs, descriptions     |
| **Geist**             | `--font-geist-sans`  | variable           | App UI (authenticated pages)            |
| **Geist Mono**        | `--font-geist-mono`  | variable           | Code, monospace elements                |

All fonts are loaded via `next/font/google` in `app/layout.tsx` for optimal performance (no layout shift, self-hosted subsets).

### Usage Rules

| Context               | Font              | Weight  | Size                       | Style                                 |
| --------------------- | ----------------- | ------- | -------------------------- | ------------------------------------- |
| Landing hero H1       | Cinzel Decorative | 900     | `clamp(2.8rem, 7vw, 6rem)` | Gradient text (violet → cyan)         |
| Landing section H2    | Cinzel Decorative | 700     | `clamp(1.8rem, 4vw, 3rem)` | White (`--white`)                     |
| Landing eyebrow/label | Cinzel            | 400–600 | `0.7–0.85rem`              | Uppercase, wide tracking (`0.3em`)    |
| Landing nav links     | Cinzel            | 500     | `0.85rem`                  | Uppercase, `0.08em` tracking          |
| Landing body text     | Inter             | 300–400 | `1–1.2rem`                 | Muted color, `1.7` line-height        |
| App headings          | Geist             | 600–700 | `1.5–2rem`                 | `--text-primary`                      |
| App body              | Geist             | 400     | `0.875–1rem`               | `--text-primary` / `--text-secondary` |
| App monospace         | Geist Mono        | 400     | `0.8rem`                   | Mana costs, code-like data            |

### Gradient Text Effect

Used on hero headlines and stat numbers:

```css
background: linear-gradient(
  135deg,
  var(--white) 0%,
  var(--gold-light) 60%,
  var(--accent) 100%
);
-webkit-background-clip: text;
background-clip: text;
color: transparent;
```

---

## Visual Effects

| Effect            | Where                | Implementation                                                       |
| ----------------- | -------------------- | -------------------------------------------------------------------- |
| Noise overlay     | Landing background   | SVG `feTurbulence` as `::before` fixed layer, `opacity: 0.4`         |
| Gradient glow BG  | Hero section         | 3 layered radial gradients (violet center, cyan accents, dark edges) |
| Scroll reveal     | All landing sections | IntersectionObserver adds `.visible` class, CSS transition `0.7s`    |
| Floating mana     | Hero background      | Emoji particles with CSS `@keyframes float`, `opacity: 0.06`         |
| Typewriter AI bar | Product section      | `useTypewriter` hook rotates text every 3.5s                         |
| Button glow       | CTA buttons          | `box-shadow` with rgba violet, expands on hover                      |
| Card hover lift   | Pain/stat cards      | `translateY(-3px)` + border color change on hover                    |

---

## Mana Symbols

Real Scryfall SVGs used throughout the app:

```
https://svgs.scryfall.io/card-symbols/{W,U,B,R,G,C}.svg
```

In-app colored pills (ManaSymbol component):

| Color         | Background   | Text         | Border       |
| ------------- | ------------ | ------------ | ------------ |
| W (White)     | `yellow-100` | `yellow-900` | `yellow-300` |
| U (Blue)      | `blue-600`   | `white`      | `blue-400`   |
| B (Black)     | `gray-900`   | `gray-100`   | `gray-600`   |
| R (Red)       | `red-600`    | `white`      | `red-400`    |
| G (Green)     | `green-700`  | `white`      | `green-500`  |
| C (Colorless) | `gray-400`   | `gray-900`   | `gray-300`   |

---

## Spacing & Layout

- Max content width: `1100px` (product section), `900px` (how it works), `800px` (stats)
- Section padding: `6rem 2rem` (desktop), tighter on mobile
- Card border radius: `8–12px`
- Button border radius: `4px`
- Transition timing: `0.2–0.35s ease` or `cubic-bezier(0.4, 0, 0.2, 1)`
