"use client";

interface JsonLdProps {
  readonly data: Record<string, unknown>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export const softwareApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "MagicAIBuilder",
  applicationCategory: "GameApplication",
  operatingSystem: "Web",
  description:
    "Free MTG Commander deck builder with live bracket scoring, AI suggestions, Game Changers detection, and combo finder.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  url: "https://magicaibuilder.com",
};
