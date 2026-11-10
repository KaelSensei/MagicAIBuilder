import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PlaytestModal } from "./PlaytestModal";
import { usePlaytestStore } from "@/lib/playtest/store";
import messages from "@/messages/en/playtest.json";
import evidenceMessages from "@/messages/en/playtest-evidence.json";
import builderMessages from "@/messages/en/builder.json";
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
        messages={{ playtest: messages, playtestEvidence: evidenceMessages, builder: builderMessages }}
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

/** Settles a pending one-card bottom choice with the first card offered. */
function bottomFirstCard() {
  const choice = screen.getByRole("group", {
    name: /choose 1 card to put on the bottom/i,
  });
  fireEvent.click(within(choice).getAllByRole("button", { pressed: false })[0]);
  fireEvent.click(
    screen.getByRole("button", { name: "Put 1 card on the bottom" })
  );
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

  it.each(["light", "dark"])(
    "uses theme tokens for readable panels in the %s theme",
    (theme) => {
      document.documentElement.dataset.theme = theme;
      renderModal();

      const dialog = screen.getByRole("dialog", { name: /playtest/i });
      const title = screen.getByRole("heading", { name: /kenrith goodstuff/i });

      expect(dialog).toHaveClass("bg-[var(--background)]");
      expect(dialog).toHaveClass("text-[var(--text-primary)]");
      expect(title).toHaveClass("text-[var(--text-primary)]");

      delete document.documentElement.dataset.theme;
    }
  );

  it("stacks header feedback controls until there is desktop room", () => {
    renderModal();
    start();

    expect(screen.getByTestId("playtest-header")).toHaveClass(
      "flex-col",
      "lg:flex-row"
    );
    expect(screen.getByTestId("playtest-result-bar")).toHaveClass(
      "flex-col",
      "sm:flex-row"
    );
    expect(screen.getByLabelText("Playtest note")).toHaveClass("w-full");
    expect(screen.getByLabelText("Change to try")).toHaveClass("w-full");
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
  // It used to go down to six: in Commander the first mulligan is free (CR 103.5c).
  it("takes a free first mulligan in Commander: a new seven, no bottom step", () => {
    renderModal();
    start();

    fireEvent.click(screen.getByRole("button", { name: /mulligan.*free: new seven/i }));

    expect(usePlaytestStore.getState().engine?.hand).toHaveLength(7);
    expect(screen.getByText(/1 mulligan/)).toBeDefined();
    expect(screen.queryByText(/to put on the bottom/)).toBeNull();
    expect(
      screen.getByRole("button", { name: /mulligan.*new seven, 1 to the bottom/i })
    ).toBeEnabled();
  });

  describe("choosing whether the game is multiplayer", () => {
    const multiplayer = () =>
      screen.queryByRole("checkbox", { name: /multiplayer game/i });

    it("lets a one-on-one Commander game bottom a card on the first mulligan", () => {
      renderModal();
      expect(multiplayer()).toBeChecked();

      fireEvent.click(
        screen.getByRole("checkbox", { name: /multiplayer game/i })
      );
      start();
      fireEvent.click(
        screen.getByRole("button", {
          name: /mulligan.*new seven, 1 to the bottom/i,
        })
      );
      bottomFirstCard();

      expect(usePlaytestStore.getState().engine?.hand).toHaveLength(6);
      expect(screen.getByText(/Hand: 6 cards/i)).toBeDefined();
    });

    // Every Brawl game has the free mulligan; the constructed formats are duels.
    it.each(["brawl", "modern"] as const)(
      "does not ask for a %s deck",
      (format) => {
        renderModal(makeDeck(format));

        expect(multiplayer()).toBeNull();
      }
    );

    // Bracket 1 has a figure for a hand of no lands and no cheap ramp, read
    // against a fresh seven or, without the free mulligan, against a six.
    it.each([
      { table: "multiplayer", isMultiplayer: true, against: /a fresh seven/ },
      { table: "one-on-one", isMultiplayer: false, against: /going to six/ },
    ])(
      "judges the first seven of a $table game against the right next hand",
      ({ isMultiplayer, against }) => {
        renderModal({ ...makeDeck(), targetBracket: 1 });

        if (!isMultiplayer) {
          fireEvent.click(
            screen.getByRole("checkbox", { name: /multiplayer game/i })
          );
        }
        start();

        expect(screen.getByText(/^Bracket 1, first seven:/)).toHaveTextContent(
          against
        );
      }
    );
  });

  it("asks a Modern player which card to bottom, holding the game until then", () => {
    renderModal(makeDeck("modern"));
    start();

    fireEvent.click(screen.getByRole("button", { name: /mulligan/i }));

    const choice = screen.getByRole("group", { name: /choose 1 card to put on the bottom/i });
    expect(screen.getByRole("button", { name: /next phase/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /mulligan/i })).toBeDisabled();

    fireEvent.click(within(choice).getAllByRole("button", { pressed: false })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Put 1 card on the bottom" }));

    expect(usePlaytestStore.getState().engine?.hand).toHaveLength(6);
    expect(screen.getByText(/Hand: 6 cards/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /next phase/i })).toBeEnabled();
  });

  // The guide's keep rules model Commander decks; other formats keep the land hint.
  it("gives a Commander hand the guide's keep advice instead of the land-only hint", () => {
    renderModal();
    start();

    expect(screen.getByText(/\(mana value 2 or less\)$/)).toBeDefined();
    expect(screen.getByText(/goldfish model/)).toBeDefined();
    expect(screen.queryByText(/^(Balanced start|Land-light|Land-heavy)/)).toBeNull();
  });

  it("keeps the land-balance hint for a Modern hand", () => {
    renderModal(makeDeck("modern"));
    start();

    expect(screen.getByText(/lands? in opening hand/)).toBeDefined();
    expect(screen.queryByText(/goldfish model/)).toBeNull();
  });

  it("shows what to bottom during a Commander bottom choice", () => {
    renderModal();
    start();

    fireEvent.click(screen.getByRole("button", { name: /mulligan/i }));
    fireEvent.click(screen.getByRole("button", { name: /mulligan/i }));

    expect(screen.getByText(/^What to bottom:/)).toBeDefined();
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

  it("starts the commander in the command zone and casts it onto the battlefield", () => {
    renderModal();
    start();

    expect(screen.getByRole("heading", { name: /command zone/i })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Cast Card cmd" }));

    const engine = usePlaytestStore.getState().engine;
    expect(engine?.commandZone).toEqual([]);
    expect(engine?.battlefield.map((card) => card.id)).toEqual(["cmd"]);
  });

  describe("recording a game", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    // During the choice the hand still holds seven cards, so a result recorded
    // then would count the cards still to bottom as extra cards seen.
    it("blocks recording a result until the mulligan's bottom choice is made", () => {
      renderModal(makeDeck("modern"));
      start();
      const results = () =>
        ["Win", "Loss", "Draw"].map((name) =>
          screen.getByRole("button", { name })
        );

      fireEvent.click(screen.getByRole("button", { name: /mulligan/i }));

      for (const button of results()) {
        expect(button).toBeDisabled();
        expect(button).toHaveAccessibleDescription(
          "Finish your mulligan first."
        );
      }
      expect(screen.getByRole("button", { name: "Skip" })).toBeEnabled();

      bottomFirstCard();

      for (const button of results()) expect(button).toBeEnabled();
      expect(screen.queryByText("Finish your mulligan first.")).toBeNull();
    });

    // Casting the commander takes it from the command zone, not from the library.
    it("does not record a cast commander as a card seen", async () => {
      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValue(new Response(JSON.stringify({}), { status: 201 }));
      renderModal();
      start();
      fireEvent.click(screen.getByRole("button", { name: "Cast Card cmd" }));
      fireEvent.click(screen.getByRole("button", { name: /next turn/i }));

      fireEvent.click(screen.getByRole("button", { name: "Win" }));

      const postedSession = () =>
        fetchSpy.mock.calls.find(([, init]) => init?.method === "POST")?.[1]?.body;
      await waitFor(() => expect(postedSession()).toBeDefined());
      expect(JSON.parse(String(postedSession()))).toMatchObject({
        cardsSeen: 8,
        additionalCardsSeen: 0,
      });
    });
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
