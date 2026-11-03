import { render } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { siteUrl } from "@/lib/seo/alternates";

vi.mock("@/components/landing/LandingPage", () => ({
  LandingPage: () => <main>MagicAIBuilder</main>,
}));

import HomePage from "./page";

it("renders canonical French SoftwareApplication structured data on the public home", async () => {
  const home = await HomePage({ params: Promise.resolve({ locale: "fr" }) });
  const { container } = render(home);

  const structuredData = container.querySelector('script[type="application/ld+json"]');

  expect(structuredData).not.toBeNull();
  expect(JSON.parse(structuredData?.textContent ?? "")).toMatchObject({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "MagicAIBuilder",
    url: `${siteUrl()}/fr`,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  });
});
