"use client";

interface JsonLdProps {
  readonly data: Record<string, unknown>;
}

// Safely serialize JSON-LD data for inline injection into <script> tags.
// JSON.stringify already escapes </script> sequences, but this helper adds
// explicit unicode escaping to make the intent clear to static analysis tools.
function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003C")
    .replace(/>/g, "\\u003E")
    .replace(/&/g, "\\u0026");
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }}
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
