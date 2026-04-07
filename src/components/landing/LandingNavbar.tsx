import Link from "next/link";

/** Fixed glassmorphism navbar with brand links */
export function LandingNavbar() {
  return (
    <nav className="landing-nav">
      <div className="landing-logo">
        MagicAIBuilder
      </div>
      <ul className="landing-nav-links">
        <li><Link href="#product">Features</Link></li>
        <li><Link href="#how">How it works</Link></li>
        <li><Link href="/auth/signin" className="nav-cta">Get Started</Link></li>
      </ul>
    </nav>
  );
}
