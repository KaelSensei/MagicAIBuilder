import React from "react";
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";

vi.mock(import("@/i18n/navigation"), () => import("@/test/i18n-navigation-stub"));

import { CapabilityAtlas } from "./CapabilityAtlas";

describe("CapabilityAtlas", () => {
  it("presents confirmed Commander journeys with truthful destinations", () => {
    renderWithIntl(<CapabilityAtlas />);

    expect(
      screen.getByRole("region", { name: "Your Commander field guide" })
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Build the list" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Know what you own" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Goldfish before game night" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Share the work" })).toBeInTheDocument();

    expect(screen.getByRole("link", { name: "Start a guest deck" })).toHaveAttribute(
      "href",
      "/builder/guest"
    );
    expect(screen.getByRole("link", { name: "Open collection" })).toHaveAttribute(
      "href",
      "/collection"
    );
    expect(screen.getByRole("link", { name: "Browse Game Changers" })).toHaveAttribute(
      "href",
      "/rules/game-changers"
    );
    expect(screen.getByRole("link", { name: "Read comprehensive rules" })).toHaveAttribute(
      "href",
      "/rules/comprehensive"
    );

    expect(screen.queryByText(/Gemini/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/98%/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/co-pilot/i)).not.toBeInTheDocument();
  });
});
