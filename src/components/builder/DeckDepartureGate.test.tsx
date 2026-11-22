/**
 * The builder's missing-deck area while it leaves a deck it deleted (`DeckDepartureGate`), and
 * the page state behind it (`useDeckDeparture`).
 *
 * Sociable: the real hook drives the real gate inside next-intl with the English and French
 * catalogues; a small harness stands in for the builder page, which holds the hook.
 */
import { act, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderHookWithProviders, renderWithProviders } from "@/test/render";
import { DeckDepartureGate } from "./DeckDepartureGate";
import { useDeckDeparture } from "./useDeckDeparture";

const MISSING = "Deck not found";

describe("DeckDepartureGate", () => {
  it("shows what the page has for a missing deck while the page is staying", () => {
    renderWithProviders(
      <DeckDepartureGate isLeaving={false}>
        <p>{MISSING}</p>
      </DeckDepartureGate>
    );

    expect(screen.getByText(MISSING)).toBeInTheDocument();
  });

  it("says the library is opening, and not that the deck is missing, while the page is leaving", () => {
    renderWithProviders(
      <DeckDepartureGate isLeaving>
        <p>{MISSING}</p>
      </DeckDepartureGate>
    );

    expect(
      screen.getByText("Deck deleted. Opening your decks…")
    ).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByText(MISSING)).not.toBeInTheDocument();
  });

  it("says it in French for a French player", () => {
    renderWithProviders(
      <DeckDepartureGate isLeaving>
        <p>{MISSING}</p>
      </DeckDepartureGate>,
      { locale: "fr" }
    );

    expect(
      screen.getByText("Deck supprimé. Ouverture de vos decks…")
    ).toBeInTheDocument();
  });
});

describe("useDeckDeparture", () => {
  it("starts staying, leaves on a confirmed delete and stays again when the delete fails", () => {
    const { result } = renderHookWithProviders(() => useDeckDeparture());
    expect(result.current.isLeaving).toBe(false);

    act(() => result.current.leave());
    expect(result.current.isLeaving).toBe(true);

    act(() => result.current.stay());
    expect(result.current.isLeaving).toBe(false);
  });
});
