import React from "react";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import enLanding from "@/messages/en/landing.json";

vi.mock(import("@/i18n/navigation"), () => import("@/test/i18n-navigation-stub"));

import { CapabilityAtlas } from "./CapabilityAtlas";

describe("CapabilityAtlas", () => {
  it("presents confirmed Commander journeys with truthful destinations", () => {
    render(
      <NextIntlClientProvider locale="en" messages={{ landing: enLanding }}>
        <CapabilityAtlas />
      </NextIntlClientProvider>
    );

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
