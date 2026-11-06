import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";

import deckMessages from "@/messages/en/deck.json";
import { RecommendationProvenance } from "./RecommendationProvenance";

function renderProvenance(kind: "popular" | "synergy" | "tournament" | "ai") {
  render(
    <NextIntlClientProvider locale="en" messages={{ deck: deckMessages }}>
      <RecommendationProvenance kind={kind} />
    </NextIntlClientProvider>
  );
}

describe("RecommendationProvenance", () => {
  it.each([
    ["popular", "popular recommendations"],
    ["synergy", "high-synergy recommendations"],
    ["tournament", "tournament observations"],
    ["ai", "AI suggestions"],
  ] as const)("identifies %s recommendations as %s", (kind, label) => {
    renderProvenance(kind);

    expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.getByLabelText(`Recommendation provenance: ${label}`)).toBeInTheDocument();
  });
});
