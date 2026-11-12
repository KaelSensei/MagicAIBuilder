import { render } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { siteUrl } from "@/lib/seo/alternates";

vi.mock(import("@/components/landing/LandingPage"), () => ({
  LandingPage: () => <main>MagicAIBuilder</main>,
}));

import HomePage from "./page";

it("renders canonical French structured data without unverified pricing or AI claims", async () => {
  const home = await HomePage({ params: Promise.resolve({ locale: "fr" }) });
  const { container } = render(home);

  const structuredData = container.querySelector('script[type="application/ld+json"]');

  expect(structuredData).not.toBeNull();
  expect(JSON.parse(structuredData?.textContent ?? "")).toMatchObject({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "MagicAIBuilder",
    url: `${siteUrl()}/fr`,
    description:
      "Commander deckbuilding for card search, collection tracking, goldfish playtesting, and sharing.",
  });
  expect(JSON.parse(structuredData?.textContent ?? "")).not.toHaveProperty("offers");
});
