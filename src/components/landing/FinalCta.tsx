"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

/** Final call-to-action with gradient text and glow background */
export function FinalCta() {
  const { status } = useSession();
  const isLoggedIn = status === "authenticated";
  const ctaHref = isLoggedIn ? "/decks" : "/auth/signin";
  const ctaLabel = isLoggedIn ? "\u2726 Go to My Decks" : "\u2726 Start Building Now";

  return (
    <section className="landing-final-cta">
      <h2 className="reveal">
        Your Next Win
        <br />
        Starts <span>Right Here.</span>
      </h2>
      <p className="reveal">
        Stop second-guessing your card choices. Build the deck you meant to
        build &mdash; and win with it.
      </p>
      <Link href={ctaHref} className="btn-primary reveal">
        {ctaLabel}
      </Link>
    </section>
  );
}
