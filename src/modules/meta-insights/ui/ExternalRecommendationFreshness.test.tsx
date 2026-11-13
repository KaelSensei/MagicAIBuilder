import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ExternalRecommendationFreshness } from "./ExternalRecommendationFreshness";

describe("ExternalRecommendationFreshness", () => {
  it("discloses the source, exact observation time and analyzed deck snapshot", () => {
    render(
      <ExternalRecommendationFreshness
        source="OpenAI"
        observedAt={new Date("2026-11-02T10:30:00.000Z")}
        sampleSize={93}
      />
    );

    expect(screen.getByText("Source: OpenAI")).toBeInTheDocument();
    expect(screen.getByText("Observed: Nov 2, 2026, 10:30 AM")).toBeInTheDocument();
    expect(screen.getByText("Deck snapshot: 93 cards")).toBeInTheDocument();
  });
});