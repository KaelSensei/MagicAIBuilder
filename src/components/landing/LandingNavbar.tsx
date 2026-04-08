"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

/** Fixed glassmorphism navbar with brand links */
export function LandingNavbar() {
  const { status } = useSession();
  const isLoggedIn = status === "authenticated";

  return (
    <nav className="landing-nav">
      <div className="landing-logo">
        MagicAIBuilder
      </div>
      <ul className="landing-nav-links">
        <li><Link href="#product">Features</Link></li>
        <li><Link href="#how">How it works</Link></li>
        {isLoggedIn ? (
          <li><Link href="/decks" className="nav-cta">My Decks</Link></li>
        ) : (
          <li><Link href="/auth/signin" className="nav-cta">Get Started</Link></li>
        )}
      </ul>
    </nav>
  );
}
