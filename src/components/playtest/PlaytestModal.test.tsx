import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PlaytestModal } from "./PlaytestModal";
import { usePlaytestStore } from "@/lib/playtest/store";
import messages from "@/messages/en/playtest.json";
<<<<<<< HEAD
import evidenceMessages from "@/messages/en/playtest-evidence.json";
=======
import builderMessages from "@/messages/en/builder.json";
>>>>>>> origin/staging
import type { Deck, DeckCard } from "@/lib/deck/types";

// next/image and framer-motion are noise here; the zones under test are DOM only.
vi.mock("next/image", () => ({
  default: ({ alt }: { readonly alt: string }) => <span>{alt}</span>,
}));

function makeCard(id: string): DeckCard {
  return {
    id,
    scryfallId: id,
    name: `Card ${id}`,
    quantity: 1,
    category: "creature",
    zone: "main",
    manaCost: "",
    cmc: 1,
    typeLine: "Creature",
    oracleText: "",
    colorIdentity: [],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
  };
}

function makeDeck(format: Deck["format"] = "commander"): Deck {
  return {
    id: "deck-1",
    name: "Kenrith Goodstuff",
    format,
    commander: makeCard("cmd"),
    partner: null,
    companion: null,
    pairingType: "none",
    cards: Array.from({ length: 40 }, (_, i) => makeCard(`c${i}`)),
    maybeboard: [],
    cardCount: 41,
    targetBracket: 3,
    manualBracket: null,
    budget: null,
    tags: [],
    description: "",
    shareToken: null,
    shareEnabled: false,
    isPublic: false,
    isAIGenerated: false,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  };
}

function renderModal(deck = makeDeck(), onClose = vi.fn()) {
  // The header bar and history panel both query, so the modal needs a client.
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider
        locale="en"
<<<<<<< HEAD
        messages={{ playtest: messages, playtestEvidence: evidenceMessages }}
=======
        messages={{ playtest: messages, builder: builderMessages }}
>>>>>>> origin/staging
      >
        <PlaytestModal deck={deck} onClose={onClose} />
      </NextIntlClientProvider>
    </QueryClientProvider>
  );
}

/** Deals the opening hand, as the user does before anything else is possible. */
function start() {
  fireEvent.click(screen.getByRole("button", { name: /draw opening hand/i }));
}

describe("PlaytestModal", () => {
  beforeEach(() => {
    usePlaytestStore.setState({ engine: null, isActive: false, setup: null });
  });

  it("shows the deck name in the header", () => {
    renderModal();
    expect(screen.getByText(/Kenrith Goodstuff/)).toBeDefined();
  });

  it("offers the opening hand before a game exists", () => {
    renderModal();
    expect(
      screen.getByRole("button", { name: /draw opening hand/i })
    ).toBeDefined();
  });

  it("deals seven cards and starts on turn 1", () => {
    renderModal();
    start();

    const engine = usePlaytestStore.getState().engine;
    expect(engine?.hand).toHaveLength(7);
    expect(engine?.turn).toBe(1);
    // Shown twice on purpose: the header badge and the phase tracker heading.
    expect(screen.getAllByText("Turn 1")).toHaveLength(2);
  });

  it("renders the phase, life, battlefield and hand zones once started", () => {
    renderModal();
    start();

    expect(screen.getByTestId("phase-Draw")).toBeDefined();
    expect(screen.getByText("40")).toBeDefined(); // life total
    expect(screen.getByText(/No permanents in play/i)).toBeDefined();
    expect(screen.getByText(/Hand: 7 cards/i)).toBeDefined();
  });

  it("uses the format life total rather than Commander's 40", () => {
    renderModal(makeDeck("modern"));
    start();

    expect(usePlaytestStore.getState().engine?.lifeTotal).toBe(20);
  });

  it("advances the phase from the tracker", () => {
    renderModal();
    start();

    fireEvent.click(screen.getByRole("button", { name: /next phase/i }));

    expect(usePlaytestStore.getState().engine?.phase).toBe("Main1");
  });

  it("applies damage from the life tracker", () => {
    renderModal();
    start();

    fireEvent.click(screen.getByRole("button", { name: "-5" }));

    expect(usePlaytestStore.getState().engine?.lifeTotal).toBe(35);
  });

  it("draws a card into hand", () => {
    renderModal();
    start();

    fireEvent.click(screen.getByRole("button", { name: /draw card/i }));

    expect(usePlaytestStore.getState().engine?.hand).toHaveLength(8);
  });

  // The pre-store modal had a mulligan; wiring the engine in must not lose it.
  it("mulligans down to six cards and reports the count", () => {
    renderModal();
    start();

    fireEvent.click(screen.getByRole("button", { name: /mulligan/i }));

    expect(usePlaytestStore.getState().engine?.hand).toHaveLength(6);
    expect(screen.getByText(/1 mulligan/)).toBeDefined();
  });

  it("stops offering a mulligan once a turn has passed", () => {
    renderModal();
    start();

    fireEvent.click(screen.getByRole("button", { name: /next turn/i }));

    expect(screen.getByRole("button", { name: /mulligan/i })).toHaveProperty(
      "disabled",
      true
    );
  });

  it("restarts with a fresh seven-card hand", () => {
    renderModal();
    start();
    fireEvent.click(screen.getByRole("button", { name: /mulligan/i }));

    fireEvent.click(screen.getByRole("button", { name: /restart/i }));

    expect(usePlaytestStore.getState().engine?.hand).toHaveLength(7);
    expect(usePlaytestStore.getState().engine?.mulliganCount).toBe(0);
  });

  it("clears the session when closed, so it does not reappear later", () => {
    const onClose = vi.fn();
    renderModal(makeDeck(), onClose);
    start();

    fireEvent.click(screen.getByRole("button", { name: /close playtest/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(usePlaytestStore.getState().engine).toBeNull();
  });
});
