import Link from "next/link";
import { ManaFloats } from "./ManaFloats";

/** Mana colors in WUBRG + Colorless order */
const MANA_COLORS = [
  { code: "W", label: "White" },
  { code: "U", label: "Blue" },
  { code: "B", label: "Black" },
  { code: "R", label: "Red" },
  { code: "G", label: "Green" },
  { code: "C", label: "Colorless" },
] as const;

/** Hero section — gradient headline, CTA, floating mana particles */
export function Hero() {
  return (
    <section className="landing-hero">
      <div className="hero-bg" />
      <ManaFloats />

      {/* Real Scryfall mana symbols — W U B R G C */}
      <div className="hero-mana-pips" aria-label="All mana colors">
        {MANA_COLORS.map((c) => (
          <img
            key={c.code}
            src={`https://svgs.scryfall.io/card-symbols/${c.code}.svg`}
            alt={c.label}
            width={40}
            height={40}
            className="w-10 h-10"
          />
        ))}
      </div>

      <p className="hero-eyebrow">{"\u2726"} The Future of Commander Deckbuilding {"\u2726"}</p>

      <h1>
        <span className="hero-line1">Stop Guessing.</span>
        <span className="hero-line2">Start Winning.</span>
      </h1>

      <p className="hero-sub">
        You spend <strong>hours building decks</strong> only to sit across the
        table and realize three cards don&apos;t synergize, your curve is broken,
        and you&apos;re missing an answer to the meta.
        <br />
        <strong>There&apos;s a smarter way.</strong>
      </p>

      <div className="hero-actions">
        <Link href="/auth/signin" className="btn-primary">
          {"\u2726"} Build My First Deck
        </Link>
        <Link href="#product" className="btn-secondary">
          See How It Works
        </Link>
      </div>

      <p className="hero-note">
        100% free &middot; Commander &middot; Standard &middot; Pioneer &middot; All formats
      </p>
    </section>
  );
}
