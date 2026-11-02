import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import deckMessages from "@/messages/en/deck.json";
import { MetaTrendsView } from "./MetaTrendsView";

const metaShifts = vi.hoisted(() => ({
  report: {
    baselineCapturedOn: "2026-10-01T00:00:00.000Z",
    currentCapturedOn: "2026-11-01T00:00:00.000Z",
    spanDays: 31,
    shifts: [
      { kind: "rose" as const, name: "Sol Ring", baseline: 0.5, current: 0.7, delta: 0.2 },
      { kind: "entered" as const, name: "The One Ring", current: 0.6, deltaAtLeast: 0.1 },
      { kind: "left" as const, name: "Mana Crypt", baseline: 0.65, deltaAtMost: -0.05 },
    ],
  },
}));

vi.mock("@/hooks/useMetaShifts", () => ({
  useMetaShifts: () => ({
    report: metaShifts.report,
    isLoading: false,
    error: null,
    fetchShifts: vi.fn(),
  }),
}));

describe("MetaTrendsView", () => {
  it("discloses EDHREC's top-20 limit and marks unobserved endpoints as bounds", () => {
    render(
      <NextIntlClientProvider locale="en" messages={{ deck: deckMessages }} timeZone="UTC">
        <MetaTrendsView commanderName="Atraxa, Praetors' Voice" />
      </NextIntlClientProvider>
    );

    expect(screen.getByText("EDHREC top 20")).toBeInTheDocument();
    expect(
      screen.getByText(/Below the list before.*fall is an upper bound/)
    ).toBeInTheDocument();
    expect(screen.getByText("+20 pts")).toBeInTheDocument();
    expect(screen.getByText("≥ +10 pts")).toBeInTheDocument();
    expect(screen.getByText("≤ -5 pts")).toBeInTheDocument();
  });
});
