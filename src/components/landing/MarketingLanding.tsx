"use client";

import { LandingNavbar } from "./LandingNavbar";
import { Hero } from "./Hero";
import { CapabilityAtlas } from "./CapabilityAtlas";
import { FinalCta } from "./FinalCta";
import { LandingFooter } from "./LandingFooter";

/**
 * Assembles the public Commander capability landing page.
 *
 * @returns the full landing document
 */
export function MarketingLanding() {
  return (
    <div className="min-h-screen overflow-x-clip bg-[var(--background)] text-[var(--text-primary)]">
      <LandingNavbar />
      <main>
        <Hero />
        <CapabilityAtlas />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
