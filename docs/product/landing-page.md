# MagicAIBuilder — Landing Page

> Design system reference + Next.js/TypeScript migration guide

---

## Table of Contents

1. [Design System Overview](#1-design-system-overview)
2. [Folder Structure for Next.js](#2-folder-structure-for-nextjs)
3. [Step-by-step Migration](#3-step-by-step-migration)
4. [Component Breakdown](#4-component-breakdown)
5. [Animations in Next.js](#5-animations-in-nextjs)
6. [Full HTML Source](#6-full-html-source)

---

## 1. Design System Overview

### Color Tokens

These are the CSS variables used throughout the page. In Next.js you'll
move them to `globals.css` or a Tailwind `theme.extend`.

```css
:root {
  --gold: #7c5cfc; /* primary violet — brand color */
  --gold-light: #a78bfa; /* lighter violet — gradients, text */
  --gold-dark: #4f35c2; /* deeper violet — buttons dark end */
  --accent: #00e5ff; /* cyan — AI features only */

  --black: #07060f; /* page background */
  --deep: #0c0b18; /* alternate section background */
  --card-bg: #100f1e; /* card/panel backgrounds */
  --surface: #16152a; /* elevated surface (nav, headers) */
  --border: rgba(124, 92, 252, 0.22); /* default border */

  --text: #e2dff5; /* body text */
  --muted: #6b6890; /* secondary text */
  --white: #f0eeff; /* near-white headings */
}
```

**Color logic:**

- `--gold` / `--gold-light` / `--gold-dark` → all brand/UI elements
- `--accent` (#00e5ff cyan) → **exclusively AI-related** elements
  (AI prompt bar, AI badge, AI suggestion box). This creates an
  instant visual language: violet = product, cyan = intelligence.

### Typography

Two font families from Google Fonts:

| Font                           | Usage                                   |
| ------------------------------ | --------------------------------------- |
| `Cinzel Decorative` (700, 900) | Hero H1, section H2, logo, step numbers |
| `Cinzel` (400, 600, 700)       | Nav links, labels, buttons, plan names  |
| `Inter` (300, 400, 500, 600)   | Body text, paragraphs, descriptions     |

In Next.js use `next/font/google`:

```tsx
// app/layout.tsx
import { Cinzel, Cinzel_Decorative, Inter } from "next/font/google";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-cinzel",
});

const cinzelDeco = Cinzel_Decorative({
  subsets: ["latin"],
  weight: ["700", "900"],
  variable: "--font-cinzel-deco",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-inter",
});

export default function RootLayout({ children }) {
  return (
    <html
      className={`${cinzel.variable} ${cinzelDeco.variable} ${inter.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
```

Then in CSS: `font-family: var(--font-cinzel-deco), serif;`

### Key Visual Effects

| Effect                | How it works                                                     |
| --------------------- | ---------------------------------------------------------------- |
| **Gradient text**     | `background-clip: text` + `color: transparent`                   |
| **Noise overlay**     | SVG `feTurbulence` filter as `body::before` fixed layer          |
| **Scroll reveal**     | `IntersectionObserver` toggles `.visible` class → CSS transition |
| **Floating mana**     | `@keyframes float` on absolute-positioned emoji divs             |
| **Glow buttons**      | `box-shadow` with rgba of primary color                          |
| **Typewriter AI bar** | `setInterval` swaps `innerHTML` every 3.5s                       |

---

## 2. Folder Structure for Next.js

```
src/
├── app/
│   ├── layout.tsx           ← fonts + globals import
│   ├── page.tsx             ← assembles all sections
│   └── globals.css          ← CSS vars + base resets + animations
├── components/
│   └── landing/
│       ├── Navbar.tsx
│       ├── Hero.tsx
│       ├── PainSection.tsx
│       ├── ProductSection.tsx
│       ├── StatsSection.tsx
│       ├── HowItWorks.tsx
│       ├── ColorsSection.tsx
│       ├── Testimonials.tsx
│       ├── Pricing.tsx
│       ├── FinalCta.tsx
│       └── Footer.tsx
├── hooks/
│   └── useScrollReveal.ts   ← IntersectionObserver hook
└── lib/
    └── constants.ts         ← color tokens as JS constants (optional)
```

---

## 3. Step-by-step Migration

### Step 1 — `globals.css`

Paste all CSS variables, resets, and keyframe animations here.
This is the single source of truth for the design tokens.

```css
/* src/app/globals.css */

@import url("https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap");

/* If using next/font, remove the @import above */

:root {
  --gold: #7c5cfc;
  --gold-light: #a78bfa;
  --gold-dark: #4f35c2;
  --accent: #00e5ff;
  --black: #07060f;
  --deep: #0c0b18;
  --card-bg: #100f1e;
  --surface: #16152a;
  --border: rgba(124, 92, 252, 0.22);
  --text: #e2dff5;
  --muted: #6b6890;
  --white: #f0eeff;
}

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: smooth;
}

body {
  background: var(--black);
  color: var(--text);
  font-family: var(--font-inter), "Inter", sans-serif;
  overflow-x: hidden;
}

/* Noise texture */
body::before {
  content: "";
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 0;
  opacity: 0.4;
}

/* Keyframes */
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes float {
  0% {
    transform: translateY(100vh) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 0.06;
  }
  90% {
    opacity: 0.06;
  }
  100% {
    transform: translateY(-100px) rotate(360deg);
    opacity: 0;
  }
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

/* Scroll reveal utility */
.reveal {
  opacity: 0;
  transform: translateY(30px);
  transition:
    opacity 0.7s ease,
    transform 0.7s ease;
}
.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
```

### Step 2 — `useScrollReveal` hook

Replaces the vanilla `IntersectionObserver` script:

```ts
// src/hooks/useScrollReveal.ts
"use client";

import { useEffect, useRef } from "react";

export function useScrollReveal() {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const elements = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add("visible"), i * 80);
          }
        });
      },
      { threshold: 0.1 }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return ref;
}
```

Then call it once at the page level:

```tsx
// src/app/page.tsx
"use client";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function LandingPage() {
  useScrollReveal();
  return (
    <>
      <Navbar />
      <Hero />
      <PainSection />
      {/* ... */}
    </>
  );
}
```

### Step 3 — Typewriter hook (for AI prompt bar)

```ts
// src/hooks/useTypewriter.ts
"use client";

import { useEffect, useState } from "react";

const TEXTS = [
  '✦ Ask AI: "Suggest 5 discard engines under $10"',
  '✦ Ask AI: "What should I cut to lower the curve?"',
  '✦ Ask AI: "Find me a finisher for this strategy"',
  '✦ Ask AI: "Is this deck Bracket 3 or 4?"',
];

export function useTypewriter(interval = 3500) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setIndex((i) => (i + 1) % TEXTS.length),
      interval
    );
    return () => clearInterval(id);
  }, [interval]);

  return TEXTS[index];
}
```

### Step 4 — Tailwind config (optional but recommended)

If you use Tailwind, extend the theme to expose the CSS tokens as
Tailwind utilities:

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#7c5cfc",
        "primary-light": "#a78bfa",
        "primary-dark": "#4f35c2",
        accent: "#00e5ff",
        "page-bg": "#07060f",
        deep: "#0c0b18",
        "card-bg": "#100f1e",
        surface: "#16152a",
        "body-text": "#e2dff5",
        muted: "#6b6890",
      },
      fontFamily: {
        cinzel: ["var(--font-cinzel)", "serif"],
        "cinzel-deco": ["var(--font-cinzel-deco)", "serif"],
        sans: ["var(--font-inter)", "sans-serif"],
      },
      boxShadow: {
        glow: "0 4px 24px rgba(124,92,252,0.45)",
        "glow-lg": "0 8px 36px rgba(124,92,252,0.65)",
        "cyan-glow": "0 0 20px rgba(0,229,255,0.3)",
      },
    },
  },
};
export default config;
```

---

## 4. Component Breakdown

### `Navbar.tsx`

```tsx
"use client";
import Link from "next/link";

export function Navbar() {
  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "1.2rem 3rem",
        background: "rgba(10,10,15,0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="logo">
        Magic<span>AI</span>Builder
      </div>
      <ul style={{ display: "flex", gap: "2.5rem", listStyle: "none" }}>
        <li>
          <Link href="#product">Features</Link>
        </li>
        <li>
          <Link href="#how">How it works</Link>
        </li>
        <li>
          <Link href="#pricing">Pricing</Link>
        </li>
        <li>
          <Link href="#pricing" className="nav-cta">
            Start Free
          </Link>
        </li>
      </ul>
    </nav>
  );
}
```

> **Note:** For the glassmorphism nav on scroll (opacity change), add a
> `scroll` event listener in a `useEffect` and toggle a class.

### `Hero.tsx`

The hero uses CSS `animation: fadeUp` directly on elements with
`animationDelay`. In Next.js this is fine in a `'use client'` component
since the animations are pure CSS.

```tsx
export function Hero() {
  return (
    <section className="hero">
      <div className="hero-bg" />
      <ManaFloats /> {/* floating emoji particles */}
      <p className="hero-eyebrow">✦ The Future of Commander Deckbuilding ✦</p>
      <h1>
        <span className="line1">Stop Guessing.</span>
        <span className="line2">Start Winning.</span>
      </h1>
      <p className="hero-sub">
        You spend <strong>hours building decks</strong> only to sit across the
        table and realize three cards don't synergize...
      </p>
      <div className="hero-actions">
        <Link href="#pricing" className="btn-primary">
          ✦ Build My First Deck Free
        </Link>
        <Link href="#product" className="btn-secondary">
          See How It Works
        </Link>
      </div>
    </section>
  );
}
```

### `ProductSection.tsx` (with typewriter)

```tsx
"use client";
import { useTypewriter } from "@/hooks/useTypewriter";

export function ProductSection() {
  const aiText = useTypewriter();

  return (
    <section id="product" className="product">
      <div className="product-inner">
        <div className="product-text reveal">{/* ... text content */}</div>
        <div className="deck-ui reveal">
          <div className="deck-ui-header">
            <div className="dot r" />
            <div className="dot y" />
            <div className="dot g" />
            <span className="deck-ui-title">
              MagicAIBuilder — Tinybones EDH
            </span>
          </div>
          <div className="deck-ui-body">
            <div className="ai-prompt-bar">
              {aiText}
              <span className="cursor" />
            </div>
            {/* card grid + ai suggestion */}
          </div>
        </div>
      </div>
    </section>
  );
}
```

---

## 5. Animations in Next.js

### Hero fade-in (CSS only — no JS needed)

Works exactly the same in Next.js. Just make sure the CSS is in
`globals.css` or a CSS module, and the classes are on the elements.

```css
/* Already in globals.css */
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-eyebrow {
  opacity: 0;
  animation: fadeUp 0.8s 0.2s ease forwards;
}
/* h1 → delay 0.4s, hero-sub → delay 0.6s, etc. */
```

### Scroll reveal (IntersectionObserver)

The `useScrollReveal()` hook (Step 2 above) handles this.
Add `className="reveal"` to any element you want to animate in on scroll.

```tsx
<div className="stats-grid reveal">{/* ... */}</div>
```

### Floating mana particles

In vanilla HTML these are hardcoded divs. In Next.js, generate them
from an array so it's clean:

```tsx
const MANA = [
  { symbol: "⚪", left: "5%", duration: "18s", delay: "0s", size: "2rem" },
  { symbol: "🔵", left: "15%", duration: "22s", delay: "3s" },
  { symbol: "⚫", left: "30%", duration: "16s", delay: "7s", size: "1.2rem" },
  { symbol: "🔴", left: "50%", duration: "20s", delay: "1s" },
  { symbol: "🟢", left: "65%", duration: "25s", delay: "5s", size: "2.5rem" },
  { symbol: "✦", left: "80%", duration: "19s", delay: "9s" },
];

export function ManaFloats() {
  return (
    <>
      {MANA.map((m, i) => (
        <div
          key={i}
          className="mana-float"
          style={{
            left: m.left,
            animationDuration: m.duration,
            animationDelay: m.delay,
            fontSize: m.size ?? "1.5rem",
          }}
        >
          {m.symbol}
        </div>
      ))}
    </>
  );
}
```

---

## 6. Full HTML Source

The complete standalone HTML file (zero dependencies, works in any browser):

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MagicAIBuilder — Build Smarter. Win Faster.</title>
    <link
      href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap"
      rel="stylesheet"
    />
    <style>
      :root {
        --gold: #7c5cfc;
        --gold-light: #a78bfa;
        --gold-dark: #4f35c2;
        --black: #07060f;
        --deep: #0c0b18;
        --card-bg: #100f1e;
        --surface: #16152a;
        --border: rgba(124, 92, 252, 0.22);
        --text: #e2dff5;
        --muted: #6b6890;
        --white: #f0eeff;
        --accent: #00e5ff;
        --accent-dim: rgba(0, 229, 255, 0.12);
        --red: #c0392b;
        --blue: #2980b9;
        --green: #27ae60;
      }

      *,
      *::before,
      *::after {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      html {
        scroll-behavior: smooth;
      }
      body {
        background: var(--black);
        color: var(--text);
        font-family: "Inter", sans-serif;
        overflow-x: hidden;
      }

      body::before {
        content: "";
        position: fixed;
        inset: 0;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
        pointer-events: none;
        z-index: 0;
        opacity: 0.4;
      }

      nav {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 100;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.2rem 3rem;
        background: rgba(10, 10, 15, 0.85);
        backdrop-filter: blur(20px);
        border-bottom: 1px solid var(--border);
      }
      .logo {
        font-family: "Cinzel Decorative", serif;
        font-size: 1.1rem;
        font-weight: 700;
        background: linear-gradient(135deg, var(--gold-light), var(--gold));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        letter-spacing: 0.05em;
      }
      .logo span {
        background: linear-gradient(135deg, #fff, #c0b8a0);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      nav .nav-links {
        display: flex;
        gap: 2.5rem;
        list-style: none;
        font-size: 0.85rem;
        font-weight: 500;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      nav .nav-links a {
        color: var(--muted);
        text-decoration: none;
        transition: color 0.2s;
        font-family: "Cinzel", serif;
      }
      nav .nav-links a:hover {
        color: var(--gold);
      }
      .nav-cta {
        background: linear-gradient(135deg, var(--gold-dark), var(--gold));
        color: #fff !important;
        padding: 0.55rem 1.4rem;
        border-radius: 4px;
        font-weight: 700 !important;
        -webkit-text-fill-color: #fff !important;
      }

      .hero {
        position: relative;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 8rem 2rem 6rem;
        overflow: hidden;
      }
      .hero-bg {
        position: absolute;
        inset: 0;
        background:
          radial-gradient(
            ellipse 80% 60% at 50% 30%,
            rgba(124, 92, 252, 0.13) 0%,
            transparent 70%
          ),
          radial-gradient(
            ellipse 40% 40% at 20% 60%,
            rgba(0, 229, 255, 0.06) 0%,
            transparent 60%
          ),
          radial-gradient(
            ellipse 40% 40% at 80% 70%,
            rgba(124, 92, 252, 0.07) 0%,
            transparent 60%
          );
      }
      .mana-float {
        position: absolute;
        font-size: 1.5rem;
        opacity: 0.06;
        animation: float linear infinite;
        pointer-events: none;
        user-select: none;
      }
      @keyframes float {
        0% {
          transform: translateY(100vh) rotate(0deg);
          opacity: 0;
        }
        10% {
          opacity: 0.06;
        }
        90% {
          opacity: 0.06;
        }
        100% {
          transform: translateY(-100px) rotate(360deg);
          opacity: 0;
        }
      }
      .hero-eyebrow {
        font-family: "Cinzel", serif;
        font-size: 0.75rem;
        letter-spacing: 0.3em;
        text-transform: uppercase;
        color: var(--gold);
        margin-bottom: 1.5rem;
        opacity: 0;
        animation: fadeUp 0.8s 0.2s ease forwards;
      }
      .hero h1 {
        font-family: "Cinzel Decorative", serif;
        font-size: clamp(2.8rem, 7vw, 6rem);
        font-weight: 900;
        line-height: 1.05;
        letter-spacing: -0.01em;
        max-width: 900px;
        opacity: 0;
        animation: fadeUp 0.8s 0.4s ease forwards;
      }
      .hero h1 .line1 {
        display: block;
        background: linear-gradient(
          135deg,
          var(--white) 0%,
          var(--gold-light) 60%,
          var(--accent) 100%
        );
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .hero h1 .line2 {
        display: block;
        background: linear-gradient(90deg, var(--gold-light), var(--accent));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-size: 0.7em;
        margin-top: 0.15em;
      }
      .hero-sub {
        margin-top: 2rem;
        font-size: 1.2rem;
        color: var(--muted);
        max-width: 560px;
        line-height: 1.7;
        font-weight: 300;
        opacity: 0;
        animation: fadeUp 0.8s 0.6s ease forwards;
      }
      .hero-sub strong {
        color: var(--text);
        font-weight: 500;
      }
      .hero-actions {
        margin-top: 3rem;
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
        justify-content: center;
        opacity: 0;
        animation: fadeUp 0.8s 0.8s ease forwards;
      }
      .btn-primary {
        background: linear-gradient(
          135deg,
          var(--gold-dark),
          var(--gold),
          var(--accent)
        );
        color: #fff;
        font-family: "Cinzel", serif;
        font-weight: 700;
        font-size: 0.95rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        padding: 1rem 2.5rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        text-decoration: none;
        display: inline-block;
        transition:
          transform 0.2s,
          box-shadow 0.2s;
        box-shadow: 0 4px 24px rgba(124, 92, 252, 0.45);
      }
      .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 36px rgba(124, 92, 252, 0.65);
      }
      .btn-secondary {
        background: transparent;
        color: var(--gold);
        font-family: "Cinzel", serif;
        font-weight: 600;
        font-size: 0.9rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        padding: 1rem 2.5rem;
        border: 1px solid var(--border);
        border-radius: 4px;
        cursor: pointer;
        text-decoration: none;
        display: inline-block;
        transition:
          border-color 0.2s,
          background 0.2s;
      }
      .btn-secondary:hover {
        border-color: var(--gold);
        background: rgba(124, 92, 252, 0.05);
      }
      .hero-note {
        margin-top: 1rem;
        font-size: 0.75rem;
        color: var(--muted);
        letter-spacing: 0.05em;
        opacity: 0;
        animation: fadeUp 0.8s 1s ease forwards;
      }

      .section-label {
        font-family: "Cinzel", serif;
        font-size: 0.7rem;
        letter-spacing: 0.35em;
        text-transform: uppercase;
        color: var(--gold-dark);
        margin-bottom: 1.5rem;
      }

      .pain {
        position: relative;
        padding: 6rem 2rem;
        text-align: center;
        border-top: 1px solid var(--border);
      }
      .pain-inner {
        max-width: 760px;
        margin: 0 auto;
      }
      .pain h2 {
        font-family: "Cinzel Decorative", serif;
        font-size: clamp(1.8rem, 4vw, 3rem);
        font-weight: 700;
        line-height: 1.2;
        color: var(--white);
        margin-bottom: 1.5rem;
      }
      .pain h2 em {
        font-style: normal;
        color: var(--gold);
      }
      .pain-list {
        list-style: none;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1.5rem;
        margin-top: 3rem;
        text-align: left;
      }
      .pain-item {
        background: var(--card-bg);
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 1.5rem;
        position: relative;
        overflow: hidden;
        transition:
          border-color 0.2s,
          transform 0.2s;
      }
      .pain-item:hover {
        border-color: rgba(124, 92, 252, 0.5);
        transform: translateY(-3px);
      }
      .pain-item::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(
          90deg,
          transparent,
          var(--gold),
          var(--accent),
          transparent
        );
      }
      .pain-icon {
        font-size: 1.8rem;
        margin-bottom: 0.75rem;
      }
      .pain-item h3 {
        font-family: "Cinzel", serif;
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--white);
        margin-bottom: 0.5rem;
        letter-spacing: 0.03em;
      }
      .pain-item p {
        font-size: 0.85rem;
        color: var(--muted);
        line-height: 1.6;
      }

      .product {
        padding: 6rem 2rem;
        background: var(--deep);
        border-top: 1px solid var(--border);
        border-bottom: 1px solid var(--border);
      }
      .product-inner {
        max-width: 1100px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 5rem;
        align-items: center;
      }
      .product-text h2 {
        font-family: "Cinzel Decorative", serif;
        font-size: clamp(1.6rem, 3.5vw, 2.5rem);
        font-weight: 700;
        line-height: 1.2;
        color: var(--white);
        margin-bottom: 1.5rem;
      }
      .product-text h2 span {
        color: var(--gold);
      }
      .product-text p {
        font-size: 1rem;
        color: var(--muted);
        line-height: 1.8;
        margin-bottom: 1rem;
      }
      .feature-list {
        list-style: none;
        margin-top: 2rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .feature-list li {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        font-size: 0.95rem;
        color: var(--text);
        line-height: 1.5;
      }
      .feature-list li::before {
        content: "✦";
        color: var(--gold);
        font-size: 0.7rem;
        margin-top: 0.3rem;
        flex-shrink: 0;
      }

      .deck-ui {
        background: var(--card-bg);
        border: 1px solid var(--border);
        border-radius: 12px;
        overflow: hidden;
        box-shadow:
          0 20px 60px rgba(0, 0, 0, 0.5),
          0 0 0 1px rgba(124, 92, 252, 0.15);
      }
      .deck-ui-header {
        background: var(--surface);
        padding: 0.75rem 1rem;
        border-bottom: 1px solid var(--border);
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
      }
      .dot.r {
        background: #c0392b;
      }
      .dot.y {
        background: #f39c12;
      }
      .dot.g {
        background: #27ae60;
      }
      .deck-ui-title {
        font-family: "Cinzel", serif;
        font-size: 0.75rem;
        color: var(--muted);
        margin-left: 0.5rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }
      .deck-ui-body {
        padding: 1.25rem;
      }
      .ai-prompt-bar {
        background: rgba(0, 229, 255, 0.04);
        border: 1px solid rgba(0, 229, 255, 0.25);
        border-radius: 6px;
        padding: 0.75rem 1rem;
        font-size: 0.8rem;
        color: #6af0ff;
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .ai-prompt-bar .cursor {
        display: inline-block;
        width: 2px;
        height: 14px;
        background: #00e5ff;
        animation: blink 1s infinite;
        vertical-align: middle;
      }
      @keyframes blink {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0;
        }
      }
      .card-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 6px;
        margin-bottom: 1rem;
      }
      .mtg-card-mini {
        aspect-ratio: 2/3;
        border-radius: 4px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: linear-gradient(135deg, #1a1030, #0d2035);
        transition: transform 0.15s;
        cursor: pointer;
      }
      .mtg-card-mini:hover {
        transform: scale(1.08) translateY(-3px);
        z-index: 2;
      }
      .mtg-card-mini.g {
        background: linear-gradient(135deg, #0d2015, #1a3520);
      }
      .mtg-card-mini.w {
        background: linear-gradient(135deg, #1e1c10, #2e2c1e);
      }
      .mtg-card-mini.u {
        background: linear-gradient(135deg, #0a1525, #0d2035);
      }
      .mtg-card-mini.b {
        background: linear-gradient(135deg, #100d1a, #1a1530);
      }
      .mtg-card-mini.r {
        background: linear-gradient(135deg, #200a0a, #351515);
      }
      .mtg-card-mini.gold {
        background: linear-gradient(135deg, #201505, #352510);
      }
      .ai-suggestion {
        background: rgba(0, 229, 255, 0.06);
        border: 1px solid rgba(0, 229, 255, 0.2);
        border-radius: 6px;
        padding: 0.65rem 0.9rem;
        font-size: 0.75rem;
        color: #6af0ff;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .ai-badge {
        background: rgba(0, 229, 255, 0.12);
        border-radius: 3px;
        padding: 0.15rem 0.4rem;
        font-size: 0.65rem;
        font-weight: 600;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: #00e5ff;
        flex-shrink: 0;
      }

      .stats {
        padding: 5rem 2rem;
        text-align: center;
      }
      .stats-grid {
        max-width: 800px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 2rem;
      }
      .stat-item {
        padding: 2rem;
        border: 1px solid var(--border);
        border-radius: 8px;
        background: var(--card-bg);
        position: relative;
        overflow: hidden;
      }
      .stat-item::before {
        content: "";
        position: absolute;
        inset: 0;
        background: radial-gradient(
          circle at 50% 0%,
          rgba(124, 92, 252, 0.1),
          transparent 70%
        );
      }
      .stat-number {
        font-family: "Cinzel Decorative", serif;
        font-size: 3rem;
        font-weight: 900;
        background: linear-gradient(135deg, var(--gold-light), var(--accent));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        line-height: 1;
        margin-bottom: 0.5rem;
      }
      .stat-label {
        font-size: 0.8rem;
        color: var(--muted);
        letter-spacing: 0.1em;
        text-transform: uppercase;
        font-family: "Cinzel", serif;
      }

      .how {
        padding: 6rem 2rem;
        background: var(--deep);
        border-top: 1px solid var(--border);
      }
      .how-inner {
        max-width: 900px;
        margin: 0 auto;
        text-align: center;
      }
      .how h2 {
        font-family: "Cinzel Decorative", serif;
        font-size: clamp(1.8rem, 4vw, 2.8rem);
        color: var(--white);
        margin-bottom: 1rem;
      }
      .how-subtitle {
        color: var(--muted);
        font-size: 1rem;
        margin-bottom: 4rem;
        line-height: 1.7;
      }
      .steps {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 2rem;
        position: relative;
      }
      .steps::before {
        content: "";
        position: absolute;
        top: 2rem;
        left: calc(16.66% + 1rem);
        right: calc(16.66% + 1rem);
        height: 1px;
        background: linear-gradient(
          90deg,
          transparent,
          var(--gold),
          var(--accent),
          var(--gold),
          transparent
        );
      }
      .step {
        position: relative;
        padding: 2rem 1.5rem 1.5rem;
      }
      .step-number {
        width: 4rem;
        height: 4rem;
        border-radius: 50%;
        background: var(--card-bg);
        border: 2px solid var(--gold);
        box-shadow:
          0 0 20px rgba(124, 92, 252, 0.4),
          0 0 40px rgba(0, 229, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: "Cinzel Decorative", serif;
        font-size: 1.2rem;
        font-weight: 700;
        color: var(--gold-light);
        margin: 0 auto 1.5rem;
        position: relative;
        z-index: 1;
      }
      .step h3 {
        font-family: "Cinzel", serif;
        font-size: 1rem;
        font-weight: 600;
        color: var(--white);
        margin-bottom: 0.75rem;
      }
      .step p {
        font-size: 0.875rem;
        color: var(--muted);
        line-height: 1.7;
      }

      .colors {
        padding: 6rem 2rem;
        border-top: 1px solid var(--border);
      }
      .colors-inner {
        max-width: 1000px;
        margin: 0 auto;
        text-align: center;
      }
      .colors h2 {
        font-family: "Cinzel Decorative", serif;
        font-size: clamp(1.8rem, 4vw, 2.8rem);
        color: var(--white);
        margin-bottom: 1rem;
      }
      .colors-subtitle {
        color: var(--muted);
        margin-bottom: 3rem;
        line-height: 1.7;
      }
      .color-pips {
        display: flex;
        justify-content: center;
        gap: 1.5rem;
        flex-wrap: wrap;
      }
      .pip {
        width: 5rem;
        height: 5rem;
        border-radius: 50%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-size: 1.8rem;
        border: 2px solid rgba(255, 255, 255, 0.1);
        cursor: pointer;
        transition: transform 0.2s;
        position: relative;
      }
      .pip:hover {
        transform: scale(1.1);
      }
      .pip.w {
        background: radial-gradient(circle, #f5e8a0, #c8b864);
        box-shadow: 0 0 20px rgba(245, 232, 160, 0.3);
      }
      .pip.u {
        background: radial-gradient(circle, #4a90d9, #1a5fa0);
        box-shadow: 0 0 20px rgba(74, 144, 217, 0.3);
      }
      .pip.b {
        background: radial-gradient(circle, #4a3060, #1a1025);
        box-shadow: 0 0 20px rgba(74, 48, 96, 0.3);
      }
      .pip.r {
        background: radial-gradient(circle, #e05030, #902010);
        box-shadow: 0 0 20px rgba(224, 80, 48, 0.3);
      }
      .pip.g {
        background: radial-gradient(circle, #4a9060, #1a5025);
        box-shadow: 0 0 20px rgba(74, 144, 96, 0.3);
      }
      .pip-label {
        font-family: "Cinzel", serif;
        font-size: 0.6rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        margin-top: 0.75rem;
        color: var(--muted);
        position: absolute;
        bottom: -1.8rem;
        white-space: nowrap;
      }

      .testimonials {
        padding: 6rem 2rem;
        background: var(--deep);
        border-top: 1px solid var(--border);
        border-bottom: 1px solid var(--border);
        text-align: center;
      }
      .testimonials h2 {
        font-family: "Cinzel Decorative", serif;
        font-size: clamp(1.6rem, 3vw, 2.2rem);
        color: var(--white);
        margin-bottom: 3rem;
      }
      .testi-grid {
        max-width: 1000px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1.5rem;
      }
      .testi-card {
        background: var(--card-bg);
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 1.75rem;
        text-align: left;
        transition: border-color 0.2s;
      }
      .testi-card:hover {
        border-color: rgba(124, 92, 252, 0.4);
      }
      .stars {
        color: var(--gold);
        font-size: 0.8rem;
        margin-bottom: 1rem;
        letter-spacing: 0.1em;
      }
      .testi-text {
        font-size: 0.9rem;
        color: var(--text);
        line-height: 1.7;
        margin-bottom: 1.25rem;
        font-style: italic;
      }
      .testi-author {
        font-family: "Cinzel", serif;
        font-size: 0.75rem;
        color: var(--gold);
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }
      .testi-role {
        font-size: 0.7rem;
        color: var(--muted);
        margin-top: 0.2rem;
      }

      .pricing {
        padding: 6rem 2rem;
        text-align: center;
      }
      .pricing h2 {
        font-family: "Cinzel Decorative", serif;
        font-size: clamp(1.8rem, 4vw, 2.8rem);
        color: var(--white);
        margin-bottom: 0.75rem;
      }
      .pricing-sub {
        color: var(--muted);
        margin-bottom: 3.5rem;
        font-size: 1rem;
      }
      .pricing-grid {
        max-width: 800px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
      }
      .pricing-card {
        background: var(--card-bg);
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 2.5rem 2rem;
        text-align: left;
        position: relative;
        overflow: hidden;
        transition: transform 0.2s;
      }
      .pricing-card:hover {
        transform: translateY(-4px);
      }
      .pricing-card.featured {
        border-color: var(--gold-dark);
        background: linear-gradient(
          135deg,
          rgba(124, 92, 252, 0.06),
          var(--card-bg)
        );
      }
      .pricing-card.featured::before {
        content: "✦ MOST POPULAR";
        position: absolute;
        top: 1rem;
        right: 1rem;
        font-family: "Cinzel", serif;
        font-size: 0.6rem;
        letter-spacing: 0.15em;
        color: var(--gold);
        background: rgba(124, 92, 252, 0.2);
        padding: 0.3rem 0.6rem;
        border-radius: 3px;
        border: 1px solid rgba(124, 92, 252, 0.2);
      }
      .plan-name {
        font-family: "Cinzel", serif;
        font-size: 0.8rem;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: var(--gold);
        margin-bottom: 1rem;
      }
      .plan-price {
        font-family: "Cinzel Decorative", serif;
        font-size: 2.8rem;
        font-weight: 900;
        color: var(--white);
        line-height: 1;
        margin-bottom: 0.25rem;
      }
      .plan-period {
        font-size: 0.8rem;
        color: var(--muted);
        margin-bottom: 1.75rem;
      }
      .plan-features {
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-bottom: 2rem;
      }
      .plan-features li {
        font-size: 0.875rem;
        color: var(--text);
        display: flex;
        align-items: center;
        gap: 0.6rem;
      }
      .plan-features li::before {
        content: "✓";
        color: var(--gold);
        font-weight: 700;
        flex-shrink: 0;
      }
      .plan-features li.off {
        color: var(--muted);
      }
      .plan-features li.off::before {
        content: "—";
        color: var(--muted);
      }

      .final-cta {
        padding: 8rem 2rem;
        text-align: center;
        position: relative;
        overflow: hidden;
      }
      .final-cta::before {
        content: "";
        position: absolute;
        inset: 0;
        background: radial-gradient(
          ellipse 70% 60% at 50% 50%,
          rgba(124, 92, 252, 0.1),
          transparent 70%
        );
      }
      .final-cta h2 {
        font-family: "Cinzel Decorative", serif;
        font-size: clamp(2rem, 5vw, 4rem);
        font-weight: 900;
        line-height: 1.1;
        max-width: 700px;
        margin: 0 auto 1.5rem;
      }
      .final-cta h2 span {
        background: linear-gradient(135deg, var(--gold-light), var(--accent));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .final-cta p {
        font-size: 1.1rem;
        color: var(--muted);
        max-width: 480px;
        margin: 0 auto 2.5rem;
        line-height: 1.7;
      }

      footer {
        border-top: 1px solid var(--border);
        padding: 2rem 3rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        color: var(--muted);
        font-size: 0.8rem;
      }
      footer a {
        color: var(--muted);
        text-decoration: none;
      }
      footer a:hover {
        color: var(--gold);
      }

      @keyframes fadeUp {
        from {
          opacity: 0;
          transform: translateY(24px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .reveal {
        opacity: 0;
        transform: translateY(30px);
        transition:
          opacity 0.7s ease,
          transform 0.7s ease;
      }
      .reveal.visible {
        opacity: 1;
        transform: translateY(0);
      }

      @media (max-width: 768px) {
        nav {
          padding: 1rem 1.5rem;
        }
        nav .nav-links {
          display: none;
        }
        .product-inner {
          grid-template-columns: 1fr;
          gap: 3rem;
        }
        .steps {
          grid-template-columns: 1fr;
        }
        .steps::before {
          display: none;
        }
        .testi-grid {
          grid-template-columns: 1fr;
        }
        .pricing-grid {
          grid-template-columns: 1fr;
        }
        .stats-grid {
          grid-template-columns: 1fr;
          gap: 1rem;
        }
      }
    </style>
  </head>
  <body>
    <div
      class="mana-float"
      style="left:5%;animation-duration:18s;animation-delay:0s;font-size:2rem;"
    >
      ⚪
    </div>
    <div
      class="mana-float"
      style="left:15%;animation-duration:22s;animation-delay:3s;"
    >
      🔵
    </div>
    <div
      class="mana-float"
      style="left:30%;animation-duration:16s;animation-delay:7s;font-size:1.2rem;"
    >
      ⚫
    </div>
    <div
      class="mana-float"
      style="left:50%;animation-duration:20s;animation-delay:1s;"
    >
      🔴
    </div>
    <div
      class="mana-float"
      style="left:65%;animation-duration:25s;animation-delay:5s;font-size:2.5rem;"
    >
      🟢
    </div>
    <div
      class="mana-float"
      style="left:80%;animation-duration:19s;animation-delay:9s;"
    >
      ✦
    </div>

    <nav>
      <div class="logo">Magic<span>AI</span>Builder</div>
      <ul class="nav-links">
        <li><a href="#product">Features</a></li>
        <li><a href="#how">How it works</a></li>
        <li><a href="#pricing">Pricing</a></li>
        <li><a href="#pricing" class="nav-cta">Start Free</a></li>
      </ul>
    </nav>

    <section class="hero">
      <div class="hero-bg"></div>
      <div class="hero-eyebrow">✦ The Future of Commander Deckbuilding ✦</div>
      <h1>
        <span class="line1">Stop Guessing.</span
        ><span class="line2">Start Winning.</span>
      </h1>
      <p class="hero-sub">
        You spend <strong>hours building decks</strong> only to sit across the
        table and realize three cards don't synergize, your curve is broken, and
        you're missing an answer to the meta.<br /><strong
          >There's a smarter way.</strong
        >
      </p>
      <div class="hero-actions">
        <a href="#pricing" class="btn-primary">✦ Build My First Deck Free</a>
        <a href="#product" class="btn-secondary">See How It Works</a>
      </div>
      <p class="hero-note">
        No credit card · Commander · Standard · Pioneer · All formats
      </p>
    </section>

    <section class="pain">
      <div class="pain-inner">
        <div class="section-label">The Problem</div>
        <h2>Deckbuilding is <em>broken.</em><br />And you know it.</h2>
        <ul class="pain-list reveal">
          <li class="pain-item">
            <div class="pain-icon">⏳</div>
            <h3>Hours Down the Drain</h3>
            <p>
              You open 20 Scryfall tabs, scroll Moxfield for an hour, and still
              aren't sure if the deck works.
            </p>
          </li>
          <li class="pain-item">
            <div class="pain-icon">🎲</div>
            <h3>Blind Synergy Testing</h3>
            <p>
              You only find out your combo doesn't work at the table. In front
              of three opponents.
            </p>
          </li>
          <li class="pain-item">
            <div class="pain-icon">💸</div>
            <h3>Expensive Mistakes</h3>
            <p>
              You buy the cards, build the deck, and a week later realize you
              built the wrong gameplan.
            </p>
          </li>
          <li class="pain-item">
            <div class="pain-icon">📉</div>
            <h3>Broken Mana Curves</h3>
            <p>
              No tool tells you your curve is top-heavy until you're stuck on 3
              lands on turn 6.
            </p>
          </li>
        </ul>
      </div>
    </section>

    <section class="product" id="product">
      <div class="product-inner">
        <div class="product-text reveal">
          <div class="section-label">The Solution</div>
          <h2>
            Moxfield-level power.<br /><span>Gemini-level intelligence.</span>
          </h2>
          <p>
            MagicAIBuilder is the deck building tool you always wished existed —
            a full-featured deck manager where an AI co-pilot analyzes every
            card choice, flags synergy gaps, and suggests upgrades in real time.
          </p>
          <ul class="feature-list">
            <li>
              AI commander analysis — instant synergy scoring on every card you
              add
            </li>
            <li>Mana curve optimizer with bracket-aware power budgeting</li>
            <li>
              Real-time "What should I cut?" — context-aware removal suggestions
            </li>
            <li>
              Full format support: Commander, Standard, Pioneer, Modern, Legacy
            </li>
            <li>Import from Moxfield, Archidekt, MTGO, Arena — in one click</li>
            <li>
              Price tracker + budget alternatives with similar power level
            </li>
          </ul>
        </div>
        <div class="deck-ui reveal">
          <div class="deck-ui-header">
            <div class="dot r"></div>
            <div class="dot y"></div>
            <div class="dot g"></div>
            <div class="deck-ui-title">MagicAIBuilder — Tinybones EDH</div>
          </div>
          <div class="deck-ui-body">
            <div class="ai-prompt-bar">
              ✦ Ask AI: "Suggest 5 discard engines under $10"<span
                class="cursor"
              ></span>
            </div>
            <div class="card-grid">
              <div class="mtg-card-mini b"></div>
              <div class="mtg-card-mini b"></div>
              <div class="mtg-card-mini b"></div>
              <div class="mtg-card-mini b"></div>
              <div class="mtg-card-mini b"></div>
              <div class="mtg-card-mini b"></div>
              <div class="mtg-card-mini gold"></div>
              <div class="mtg-card-mini b"></div>
              <div class="mtg-card-mini b"></div>
              <div class="mtg-card-mini b"></div>
              <div class="mtg-card-mini b"></div>
              <div class="mtg-card-mini b"></div>
              <div class="mtg-card-mini gold"></div>
              <div class="mtg-card-mini b"></div>
              <div class="mtg-card-mini b"></div>
            </div>
            <div class="ai-suggestion">
              <span class="ai-badge">AI</span>
              Add
              <strong style="color:#00e5ff;margin:0 0.25rem"
                >Chains of Mephistopheles</strong
              >
              — highest synergy score (97%) with your current strategy
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="stats">
      <div class="stats-grid reveal">
        <div class="stat-item">
          <div class="stat-number">3x</div>
          <div class="stat-label">Faster deck building</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">50K+</div>
          <div class="stat-label">Cards in database</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">98%</div>
          <div class="stat-label">Synergy accuracy</div>
        </div>
      </div>
    </section>

    <section class="how" id="how">
      <div class="how-inner">
        <div class="section-label">The Process</div>
        <h2 class="reveal">Three Steps to<br />Your Best Deck</h2>
        <p class="how-subtitle reveal">
          No tutorials. No friction. Just open it and build.
        </p>
        <div class="steps reveal">
          <div class="step">
            <div class="step-number">I</div>
            <h3>Choose Your Commander</h3>
            <p>
              Pick any legendary creature. The AI instantly profiles the
              archetype, color identity, and top synergy packages for that
              commander.
            </p>
          </div>
          <div class="step">
            <div class="step-number">II</div>
            <h3>Build with AI Guidance</h3>
            <p>
              Add cards naturally. Every addition is scored in real time. The AI
              flags weak links, suggests replacements, and keeps your curve in
              check.
            </p>
          </div>
          <div class="step">
            <div class="step-number">III</div>
            <h3>Export & Dominate</h3>
            <p>
              One-click export to MTGO, Arena, or your LGS buylist. Your deck is
              bracket-rated and optimized before you even sleeve it up.
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="colors">
      <div class="colors-inner">
        <div class="section-label">All 5 Colors Supported</div>
        <h2 class="reveal">Every Color.<br />Every Archetype. Every Format.</h2>
        <p class="colors-subtitle reveal">
          From mono-black stax to 5-color goodstuff — the AI understands the
          nuances of every color combination.
        </p>
        <div class="color-pips reveal">
          <div style="position:relative;margin:0 1rem 2.5rem">
            <div class="pip w">☀️</div>
            <span class="pip-label">White</span>
          </div>
          <div style="position:relative;margin:0 1rem 2.5rem">
            <div class="pip u">💧</div>
            <span class="pip-label">Blue</span>
          </div>
          <div style="position:relative;margin:0 1rem 2.5rem">
            <div class="pip b">💀</div>
            <span class="pip-label">Black</span>
          </div>
          <div style="position:relative;margin:0 1rem 2.5rem">
            <div class="pip r">🔥</div>
            <span class="pip-label">Red</span>
          </div>
          <div style="position:relative;margin:0 1rem 2.5rem">
            <div class="pip g">🌿</div>
            <span class="pip-label">Green</span>
          </div>
        </div>
      </div>
    </section>

    <section class="testimonials">
      <h2 class="reveal">What Players Are Saying</h2>
      <div class="testi-grid reveal">
        <div class="testi-card">
          <div class="stars">★★★★★</div>
          <p class="testi-text">
            "I built a Bracket 4 Tinybones deck in 45 minutes. The AI caught
            three dead cards I would have never noticed until game night."
          </p>
          <div class="testi-author">Kael M.</div>
          <div class="testi-role">cEDH Player · Paris</div>
        </div>
        <div class="testi-card">
          <div class="stars">★★★★★</div>
          <p class="testi-text">
            "Finally a tool that speaks Commander language. It knows what
            Bracket 3 means. It knows what 'goodstuff' means. It gets it."
          </p>
          <div class="testi-author">Romain V.</div>
          <div class="testi-role">LGS Regular · Lyon</div>
        </div>
        <div class="testi-card">
          <div class="stars">★★★★★</div>
          <p class="testi-text">
            "The curve optimizer alone is worth the subscription. My decks have
            never been this consistent. I'm not going back to Moxfield alone."
          </p>
          <div class="testi-author">Julien T.</div>
          <div class="testi-role">Competitive Player · Bordeaux</div>
        </div>
      </div>
    </section>

    <section class="pricing" id="pricing">
      <div class="section-label">Pricing</div>
      <h2 class="reveal">Start Free.<br />Upgrade When You're Ready.</h2>
      <p class="pricing-sub reveal">No credit card required to start.</p>
      <div class="pricing-grid reveal">
        <div class="pricing-card">
          <div class="plan-name">✦ Apprentice</div>
          <div class="plan-price">$0</div>
          <div class="plan-period">Forever free</div>
          <ul class="plan-features">
            <li>3 saved decks</li>
            <li>Basic AI synergy scoring</li>
            <li>Mana curve analyzer</li>
            <li>All formats supported</li>
            <li class="off">Unlimited AI suggestions</li>
            <li class="off">Budget alternatives engine</li>
            <li class="off">Priority export & buylist</li>
          </ul>
          <a
            href="#"
            class="btn-secondary"
            style="width:100%;text-align:center;display:block;"
            >Start Free</a
          >
        </div>
        <div class="pricing-card featured">
          <div class="plan-name">✦ Archmage</div>
          <div class="plan-price">$9</div>
          <div class="plan-period">per month · cancel anytime</div>
          <ul class="plan-features">
            <li>Unlimited decks</li>
            <li>Full AI co-pilot (unlimited queries)</li>
            <li>Smart curve optimizer</li>
            <li>Budget swap engine</li>
            <li>Bracket power rating</li>
            <li>Export to Arena, MTGO, buylist</li>
            <li>Priority support</li>
          </ul>
          <a
            href="#"
            class="btn-primary"
            style="width:100%;text-align:center;display:block;"
            >Get Archmage Access ✦</a
          >
        </div>
      </div>
    </section>

    <section class="final-cta">
      <h2 class="reveal">Your Next Win<br />Starts <span>Right Here.</span></h2>
      <p class="reveal">
        Stop second-guessing your card choices. Build the deck you meant to
        build — and win with it.
      </p>
      <a href="#pricing" class="btn-primary reveal">✦ Start Building Free</a>
    </section>

    <footer>
      <div class="logo" style="font-size:0.9rem">
        Magic<span>AI</span>Builder
      </div>
      <div style="display:flex;gap:2rem">
        <a href="#">Privacy</a><a href="#">Terms</a> <a href="#">Contact</a
        ><a href="#">Discord</a>
      </div>
      <div>
        © 2025 MagicAIBuilder · Not affiliated with Wizards of the Coast
      </div>
    </footer>

    <script>
      const reveals = document.querySelectorAll(".reveal");
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((e, i) => {
            if (e.isIntersecting)
              setTimeout(() => e.target.classList.add("visible"), i * 80);
          });
        },
        { threshold: 0.1 }
      );
      reveals.forEach((el) => observer.observe(el));

      const aiBar = document.querySelector(".ai-prompt-bar");
      const texts = [
        '✦ Ask AI: "Suggest 5 discard engines under $10"',
        '✦ Ask AI: "What should I cut to lower the curve?"',
        '✦ Ask AI: "Find me a finisher for this strategy"',
        '✦ Ask AI: "Is this deck Bracket 3 or 4?"',
      ];
      let current = 0;
      setInterval(() => {
        current = (current + 1) % texts.length;
        aiBar.innerHTML = texts[current] + '<span class="cursor"></span>';
      }, 3500);
    </script>
  </body>
</html>
```
