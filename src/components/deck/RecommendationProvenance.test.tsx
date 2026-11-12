import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithIntl } from "@/test/render-with-intl";
import { RecommendationProvenance } from "./RecommendationProvenance";

function renderProvenance(kind: "popular" | "synergy" | "tournament" | "ai") {
  renderWithIntl(<RecommendationProvenance kind={kind} />);
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
