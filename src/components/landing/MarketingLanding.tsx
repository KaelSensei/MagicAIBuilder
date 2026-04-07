"use client";
/**
 * MarketingLanding — full marketing landing page assembly.
 * Imports all section components and the useScrollReveal hook.
 */
import "./landing.css";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { LandingNavbar } from "./LandingNavbar";
import { Hero } from "./Hero";
import { PainSection } from "./PainSection";
import { ProductSection } from "./ProductSection";
import { StatsSection } from "./StatsSection";
import { HowItWorks } from "./HowItWorks";
import { Testimonials } from "./Testimonials";

import { FinalCta } from "./FinalCta";
import { LandingFooter } from "./LandingFooter";

export function MarketingLanding() {
  useScrollReveal();

  return (
    <div className="landing-page">
      <LandingNavbar />
      <Hero />
      <PainSection />
      <ProductSection />
      <StatsSection />
      <HowItWorks />
      <Testimonials />

      <FinalCta />
      <LandingFooter />
    </div>
  );
}
