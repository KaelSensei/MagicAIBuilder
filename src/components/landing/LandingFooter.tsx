import Link from "next/link";

/** Simple footer with brand + links */
export function LandingFooter() {
  return (
    <footer className="landing-footer">
      <div className="landing-logo" style={{ fontSize: "0.9rem" }}>
        MagicAIBuilder
      </div>
      <div style={{ display: "flex", gap: "2rem" }}>
        <Link href="#">Privacy</Link>
        <Link href="#">Terms</Link>
        <Link href="#">Contact</Link>
        <Link href="#">Discord</Link>
      </div>
      <div>&copy; 2025 MagicAIBuilder</div>
      <div className="landing-disclaimer">
        Magic: The Gathering, the mana symbols, and all associated card names and images
        are trademarks of Wizards of the Coast LLC. MagicAIBuilder is not produced by,
        endorsed by, supported by, or affiliated with Wizards of the Coast.
        Card data provided by <a href="https://scryfall.com" target="_blank" rel="noopener noreferrer">Scryfall</a>.
      </div>
    </footer>
  );
}
