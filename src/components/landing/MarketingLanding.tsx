"use client";
/** Assembles the public Commander capability landing page. */
import "./landing.css";
import { LandingNavbar } from "./LandingNavbar";
import { Hero } from "./Hero";
import { CapabilityAtlas } from "./CapabilityAtlas";
import { FinalCta } from "./FinalCta";
import { LandingFooter } from "./LandingFooter";

export function MarketingLanding() {
  return (
    <div className="landing-page">
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
