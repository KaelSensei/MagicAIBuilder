/**
 * The builder's deck details panel, driven as a player would.
 *
 * Sociable: the real deck store, the real deck API client and the real
 * Scryfall client run; only `fetch` is replaced, by a recorder that answers
 * every deck request with 200 and a Scryfall ban-list search with the cards
 * `bannedIn` names for that format. A control counts as working when the deck
 * in the store changes and the matching `PATCH /api/decks/[id]` leaves the page.
 */
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DeckFormat } from "@/lib/deck/formats";
import {
  createGuestDeck,
  GUEST_DECK_ID,
  loadGuestDeck,
} from "@/lib/deck/guest-deck";
import { useDeckStore } from "@/lib/deck/store";
import { createEmptyDeck } from "@/lib/deck/store-factories";
import type { Deck } from "@/lib/deck/types";
import { aDeckCard } from "@/test/builders/card";
import { aScryfallCard } from "@/test/builders/scryfall";
import { renderWithProviders } from "@/test/render";
import { DeckDetailsPanel } from "./DeckDetailsPanel";

const DECK_ID = "deck-1";

/** The cards Scryfall lists as banned in each format, for this test. */
let bannedIn: Partial<Record<DeckFormat, readonly string[]>> = {};

/**
 * Scryfall's answer to a `banned:<format>` search: the cards `bannedIn` names,
 * or its 404 for a search that matches nothing.
 */
function scryfallBanListAnswer(url: URL): Response {
  const format = /banned:(\w+)/.exec(url.searchParams.get("q") ?? "")?.[1];
  const names = Object.entries(bannedIn).find(([key]) => key === format)?.[1];
  if (!names || names.length === 0) {
    return Response.json({ object: "error" }, { status: 404 });
  }
  return Response.json({
    object: "list",
    has_more: false,
    data: names.map((name, index) =>
      aScryfallCard({ id: `banned-${index}`, name })
    ),
  });
}

/** A request the deck API client sent, with its JSON body parsed. */
interface SentRequest {
  readonly method: string;
  readonly url: string;
  readonly body: unknown;
}

let sent: SentRequest[] = [];
/** The status the fake server answers every request with. */
let serverStatus = 200;

/** Bodies of the deck metadata saves, in the order they were sent. */
function deckPatches(): readonly unknown[] {
  return sent
    .filter(
      ({ method, url }) => method === "PATCH" && url === `/api/decks/${DECK_ID}`
    )
    .map(({ body }) => body);
}

/** The deck as the store holds it now. */
function storedDeck(): Deck | undefined {
  return useDeckStore.getState().decks[DECK_ID];
}

/** Opens the builder's deck as the active deck, with optional saved details. */
function openDeck(details: Partial<Deck> = {}): void {
  useDeckStore.setState({
    decks: { [DECK_ID]: { ...createEmptyDeck(DECK_ID, "Tokens"), ...details } },
    activeDeckId: DECK_ID,
  });
}

/** Mounts the panel the way the builder page does: fed from the store's deck. */
function BuilderDeckDetails({
  deckId = DECK_ID,
}: {
  readonly deckId?: string;
}) {
  const deck = useDeckStore((state) => state.decks[deckId]);
  return deck ? <DeckDetailsPanel deck={deck} /> : null;
}

function renderPanel(locale: "en" | "fr" = "en") {
  renderWithProviders(<BuilderDeckDetails />, { locale });
}

beforeEach(() => {
  sent = [];
  serverStatus = 200;
  bannedIn = {};
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input), "http://localhost");
      if (url.pathname === "/cards/search") return scryfallBanListAnswer(url);
      sent.push({
        method: init?.method ?? "GET",
        url: String(input),
        body:
          typeof init?.body === "string" ? JSON.parse(init.body) : undefined,
      });
      return new Response("{}", {
        status: serverStatus,
        headers: { "Content-Type": "application/json" },
      });
    })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  useDeckStore.setState({ decks: {}, activeDeckId: null });
  localStorage.clear();
});

describe("DeckDetailsPanel", () => {
  describe("tags", () => {
    it("adds the tag the player types and saves the deck's tags", async () => {
      const user = userEvent.setup();
      openDeck();
      renderPanel();
      const details = screen.getByRole("region", { name: "Deck details" });

      await user.click(
        within(details).getByRole("button", { name: "Add tag" })
      );
      await user.type(
        within(details).getByPlaceholderText("tag name…"),
        "Tokens{Enter}"
      );

      expect(
        within(details).getByRole("button", { name: "Remove tag Tokens" })
      ).toBeInTheDocument();
      expect(storedDeck()?.tags).toEqual(["Tokens"]);
      expect(deckPatches()).toEqual([{ tags: ["Tokens"] }]);
    });

    it("keeps the add-tag control named once the deck has tags", async () => {
      const user = userEvent.setup();
      openDeck({ tags: ["casual"] });
      renderPanel();
      const details = screen.getByRole("region", { name: "Deck details" });

      await user.click(
        within(details).getByRole("button", { name: "Add tag" })
      );
      await user.type(
        within(details).getByPlaceholderText("tag name…"),
        "WIP{Enter}"
      );

      expect(deckPatches()).toEqual([{ tags: ["casual", "WIP"] }]);
    });
  });

  describe("description", () => {
    it("saves the description the player writes", async () => {
      const user = userEvent.setup();
      openDeck();
      renderPanel();
      const details = screen.getByRole("region", { name: "Deck details" });

      await user.click(
        within(details).getByRole("button", { name: "Edit description" })
      );
      await user.type(
        within(details).getByRole("textbox"),
        "Go wide, then sacrifice the tokens."
      );
      await user.keyboard("{Control>}{Enter}{/Control}");

      expect(storedDeck()?.description).toBe(
        "Go wide, then sacrifice the tokens."
      );
      expect(deckPatches()).toEqual([
        { description: "Go wide, then sacrifice the tokens." },
      ]);
    });

    it("saves the description once when the player clicks Save", async () => {
      const user = userEvent.setup();
      openDeck();
      renderPanel();
      const details = screen.getByRole("region", { name: "Deck details" });

      await user.click(
        within(details).getByRole("button", { name: "Edit description" })
      );
      await user.type(within(details).getByRole("textbox"), "Aristocrats.");
      await user.click(within(details).getByRole("button", { name: "Save" }));

      expect(deckPatches()).toEqual([{ description: "Aristocrats." }]);
    });
  });

  describe("target bracket", () => {
    it("offers the five official brackets with the target pressed, and saves the one picked", async () => {
      const user = userEvent.setup();
      openDeck({ targetBracket: 3 });
      renderPanel();
      const details = screen.getByRole("region", { name: "Deck details" });
      const target = within(details).getByRole("group", {
        name: "Target bracket",
      });

      const brackets = within(target).getAllByRole("button");
      expect(brackets).toHaveLength(5);
      [
        "Bracket 1: Exhibition",
        "Bracket 2: Core",
        "Bracket 3: Upgraded",
        "Bracket 4: Optimized",
        "Bracket 5: cEDH",
      ].forEach((name, index) =>
        expect(brackets[index]).toHaveAccessibleName(name)
      );
      expect(
        within(target).getByRole("button", { pressed: true })
      ).toHaveAccessibleName("Bracket 3: Upgraded");

      await user.click(
        within(target).getByRole("button", { name: "Bracket 4: Optimized" })
      );

      expect(
        within(target).getByRole("button", { pressed: true })
      ).toHaveAccessibleName("Bracket 4: Optimized");
      expect(storedDeck()?.targetBracket).toBe(4);
      expect(deckPatches()).toEqual([{ targetBracket: 4 }]);
    });

    it("names the target bracket and each bracket in French", () => {
      openDeck({ targetBracket: 2 });
      renderPanel("fr");
      const details = screen.getByRole("region", { name: "Détails du deck" });
      const target = within(details).getByRole("group", {
        name: "Bracket cible",
      });

      expect(
        within(target).getByRole("button", { pressed: true })
      ).toHaveAccessibleName("Bracket 2 : Basique");
      expect(
        within(target).getByRole("button", { name: "Bracket 3 : Amélioré" })
      ).toBeInTheDocument();
    });

    // Sonar S6819: a native fieldset carries the group role, named as before.
    it("groups the brackets in a native fieldset named by its label", () => {
      openDeck({ targetBracket: 3 });
      renderPanel();
      const details = screen.getByRole("region", { name: "Deck details" });

      const target = within(details).getByRole("group", {
        name: "Target bracket",
      });
      expect(target).toBeInstanceOf(HTMLFieldSetElement);
      expect(target).not.toHaveAttribute("role");
    });

    it("leaves the target bracket out of a format without brackets", () => {
      openDeck({ format: "modern" });
      renderPanel();
      const details = screen.getByRole("region", { name: "Deck details" });

      expect(
        within(details).queryByRole("group", { name: "Target bracket" })
      ).toBeNull();
    });
  });

  describe("budget", () => {
    it("saves the budget per card the player types", async () => {
      const user = userEvent.setup();
      openDeck();
      renderPanel();
      const details = screen.getByRole("region", { name: "Deck details" });

      await user.type(
        within(details).getByRole("spinbutton", { name: "Budget per card" }),
        "2.5{Enter}"
      );

      expect(storedDeck()?.budget).toBe(2.5);
      expect(deckPatches()).toEqual([{ budget: 2.5 }]);
    });

    it("saves no limit when the player clears the budget", async () => {
      const user = userEvent.setup();
      openDeck({ budget: 5 });
      renderPanel();
      const details = screen.getByRole("region", { name: "Deck details" });

      await user.clear(
        within(details).getByRole("spinbutton", { name: "Budget per card" })
      );
      await user.tab();

      expect(storedDeck()?.budget).toBeNull();
      expect(deckPatches()).toEqual([{ budget: null }]);
    });

    it("sends nothing when the player leaves the budget as it was", async () => {
      const user = userEvent.setup();
      openDeck({ budget: 5 });
      renderPanel();
      const details = screen.getByRole("region", { name: "Deck details" });

      await user.click(
        within(details).getByRole("spinbutton", { name: "Budget per card" })
      );
      await user.keyboard("{Enter}");
      await user.tab();

      expect(deckPatches()).toEqual([]);
    });

    it("refuses a budget of zero, says why and saves nothing", async () => {
      const user = userEvent.setup();
      openDeck({ budget: 5 });
      renderPanel();
      const details = screen.getByRole("region", { name: "Deck details" });
      const budget = within(details).getByRole("spinbutton", {
        name: "Budget per card",
      });

      await user.clear(budget);
      await user.type(budget, "0{Enter}");

      expect(within(details).getByRole("alert")).toHaveTextContent(
        "Enter an amount above zero, or leave the field empty for no limit."
      );
      expect(budget).toBeInvalid();
      expect(storedDeck()?.budget).toBe(5);
      expect(deckPatches()).toEqual([]);
    });

    it("labels the budget, its unit and its error in French", async () => {
      const user = userEvent.setup();
      openDeck();
      renderPanel("fr");
      const details = screen.getByRole("region", { name: "Détails du deck" });
      const budget = within(details).getByRole("spinbutton", {
        name: "Budget par carte",
      });

      expect(budget).toHaveAccessibleDescription(
        "En dollars US. Laissez le champ vide pour ne fixer aucune limite."
      );
      await user.type(budget, "-3{Enter}");
      expect(within(details).getByRole("alert")).toHaveTextContent(
        "Saisissez un montant supérieur à zéro, ou laissez le champ vide pour ne fixer aucune limite."
      );
    });

    it("shows the saved budget again when the save fails", async () => {
      const user = userEvent.setup();
      serverStatus = 500;
      openDeck({ budget: 5 });
      renderPanel();
      const details = screen.getByRole("region", { name: "Deck details" });
      const budget = within(details).getByRole("spinbutton", {
        name: "Budget per card",
      });

      await user.clear(budget);
      await user.type(budget, "2.5{Enter}");

      await waitFor(() => expect(deckPatches()).toEqual([{ budget: 2.5 }]));
      await waitFor(() => expect(storedDeck()?.budget).toBe(5));
      expect(budget).toHaveValue(5);
    });
  });

  describe("format", () => {
    const ATRAXA = aDeckCard({
      id: "atraxa",
      name: "Atraxa, Praetors' Voice",
      typeLine: "Legendary Creature — Phyrexian Angel Horror",
      colorIdentity: ["W", "U", "B", "G"],
      category: "commander",
    });
    const SOL_RING = aDeckCard({
      id: "sol-ring",
      name: "Sol Ring",
      typeLine: "Artifact",
    });
    const LIGHTNING_BOLT = aDeckCard({
      id: "lightning-bolt",
      name: "Lightning Bolt",
      typeLine: "Instant",
      colorIdentity: ["R"],
    });
    const FORESTS = aDeckCard({
      id: "forest",
      name: "Forest",
      typeLine: "Basic Land — Forest",
      category: "land",
      quantity: 97,
    });

    /** A complete 100-card Commander deck: Atraxa and 99 cards. */
    function openCommanderDeck(): void {
      openDeck({
        commander: ATRAXA,
        cards: [SOL_RING, LIGHTNING_BOLT, FORESTS],
      });
    }

    /** The problems the switch preview lists, in order, as the player reads them. */
    function listedProblems(preview: HTMLElement): readonly string[] {
      return within(preview)
        .getAllByRole("listitem")
        .map((item) => item.textContent ?? "");
    }

    it("switching a Commander deck to Brawl lists what breaks and removes no card", async () => {
      const user = userEvent.setup();
      bannedIn = { brawl: ["Sol Ring"] };
      openCommanderDeck();
      renderPanel();
      const details = screen.getByRole("region", { name: "Deck details" });

      await user.selectOptions(
        within(details).getByRole("combobox", { name: "Format" }),
        "Brawl"
      );
      const preview = within(details).getByRole("region", {
        name: "Switch to Brawl?",
      });

      await within(preview).findByText("Banned in Brawl: Sol Ring");
      expect(listedProblems(preview)).toEqual([
        "Deck size: 100/60, 40 cards over",
        "Outside the commander's color identity: Lightning Bolt",
        "Banned in Brawl: Sol Ring",
      ]);
      expect(storedDeck()?.format).toBe("commander");
      expect(deckPatches()).toEqual([]);

      await user.click(
        within(preview).getByRole("button", { name: "Switch to Brawl" })
      );

      expect(storedDeck()?.format).toBe("brawl");
      expect(storedDeck()?.cards).toEqual([SOL_RING, LIGHTNING_BOLT, FORESTS]);
      expect(storedDeck()?.commander).toEqual(ATRAXA);
      expect(deckPatches()).toEqual([{ format: "brawl" }]);
      expect(
        within(details).getByRole("combobox", { name: "Format" })
      ).toHaveDisplayValue("Brawl");
    });

    it("saves nothing and shows the deck's format again when the player cancels", async () => {
      const user = userEvent.setup();
      openCommanderDeck();
      renderPanel();
      const details = screen.getByRole("region", { name: "Deck details" });
      const format = within(details).getByRole("combobox", { name: "Format" });

      await user.selectOptions(format, "Modern");
      await user.click(within(details).getByRole("button", { name: "Cancel" }));

      expect(
        within(details).queryByRole("region", { name: "Switch to Modern?" })
      ).toBeNull();
      expect(format).toHaveDisplayValue("Commander");
      expect(format).toHaveFocus();
      expect(storedDeck()?.format).toBe("commander");
      expect(deckPatches()).toEqual([]);
    });

    it("puts the previous format back and says so when the save fails", async () => {
      const user = userEvent.setup();
      serverStatus = 500;
      openCommanderDeck();
      renderPanel();
      const details = screen.getByRole("region", { name: "Deck details" });
      const format = within(details).getByRole("combobox", { name: "Format" });

      await user.selectOptions(format, "Brawl");
      await user.click(
        within(details).getByRole("button", { name: "Switch to Brawl" })
      );

      expect(await within(details).findByRole("alert")).toHaveTextContent(
        "The format could not be saved. The deck is back to Commander."
      );
      expect(deckPatches()).toEqual([{ format: "brawl" }]);
      expect(storedDeck()?.format).toBe("commander");
      expect(storedDeck()?.cards).toEqual([SOL_RING, LIGHTNING_BOLT, FORESTS]);
      expect(format).toHaveDisplayValue("Commander");
    });

    it("lists the cards over the copy limit when a Modern deck switches to Commander", async () => {
      const user = userEvent.setup();
      const bolts = { ...LIGHTNING_BOLT, quantity: 4 };
      const mountains = aDeckCard({
        id: "mountain",
        name: "Mountain",
        typeLine: "Basic Land — Mountain",
        category: "land",
        quantity: 56,
      });
      openDeck({ format: "modern", cards: [bolts, mountains] });
      renderPanel();
      const details = screen.getByRole("region", { name: "Deck details" });

      await user.selectOptions(
        within(details).getByRole("combobox", { name: "Format" }),
        "Commander"
      );
      const preview = within(details).getByRole("region", {
        name: "Switch to Commander?",
      });

      await waitFor(() =>
        expect(within(preview).queryByRole("status")).toBeNull()
      );
      expect(listedProblems(preview)).toEqual([
        "Deck size: 60/100, 40 cards short",
        "More copies than Commander allows: Lightning Bolt (4, 1 allowed)",
      ]);
      expect(
        within(preview).getByText(
          "No card is removed. The editor keeps reporting these problems until you fix them."
        )
      ).toBeInTheDocument();
    });

    it("says nothing breaks when the deck already follows the new format", async () => {
      const user = userEvent.setup();
      openDeck({
        format: "modern",
        cards: [
          aDeckCard({
            id: "island",
            name: "Island",
            typeLine: "Basic Land — Island",
            quantity: 60,
          }),
        ],
      });
      renderPanel();
      const details = screen.getByRole("region", { name: "Deck details" });

      await user.selectOptions(
        within(details).getByRole("combobox", { name: "Format" }),
        "Pioneer"
      );
      const preview = within(details).getByRole("region", {
        name: "Switch to Pioneer?",
      });

      expect(
        await within(preview).findByText(
          "Nothing breaks: the deck already follows the rules of Pioneer."
        )
      ).toBeInTheDocument();
      expect(within(preview).queryAllByRole("listitem")).toHaveLength(0);
    });

    it("says the ban list could not be loaded and still lists what it can check", async () => {
      const user = userEvent.setup();
      openCommanderDeck();
      renderPanel();
      vi.mocked(fetch).mockImplementation(async (input) => {
        const url = new URL(String(input), "http://localhost");
        return url.pathname === "/cards/search"
          ? Response.json({ object: "error" }, { status: 500 })
          : Response.json({});
      });
      const details = screen.getByRole("region", { name: "Deck details" });

      await user.selectOptions(
        within(details).getByRole("combobox", { name: "Format" }),
        "Brawl"
      );
      const preview = within(details).getByRole("region", {
        name: "Switch to Brawl?",
      });

      await waitFor(() =>
        expect(within(preview).getByRole("status")).toHaveTextContent(
          "The Brawl ban list could not be loaded, so banned cards are not listed."
        )
      );
      expect(listedProblems(preview)).toEqual([
        "Deck size: 100/60, 40 cards over",
        "Outside the commander's color identity: Lightning Bolt",
      ]);
    });

    it("groups the Commander variants apart from the constructed formats, named from the French catalogue", () => {
      openDeck();
      renderPanel("fr");
      const details = screen.getByRole("region", { name: "Détails du deck" });
      const format = within(details).getByRole("combobox", { name: "Format" });

      const optionsIn = (group: string) =>
        within(within(format).getByRole("group", { name: group }))
          .getAllByRole("option")
          .map((option) => option.textContent);
      expect(
        within(format)
          .getAllByRole("group")
          .map((group) => group.getAttribute("label"))
      ).toEqual(["Variantes de Commander", "Formats construits"]);
      expect(optionsIn("Variantes de Commander")).toEqual([
        "Commander",
        "Brawl",
        "Oathbreaker",
      ]);
      expect(optionsIn("Formats construits")).toEqual([
        "Standard",
        "Pioneer",
        "Modern",
        "Legacy",
        "Vintage",
        "Pauper",
      ]);
      expect(format).toHaveDisplayValue("Commander");
    });

    it("keeps a guest deck's new format in this browser and sends nothing", async () => {
      const user = userEvent.setup();
      useDeckStore.setState({
        decks: {
          [GUEST_DECK_ID]: {
            ...createGuestDeck(),
            commander: ATRAXA,
            cards: [SOL_RING, LIGHTNING_BOLT, FORESTS],
          },
        },
        activeDeckId: GUEST_DECK_ID,
      });
      renderWithProviders(<BuilderDeckDetails deckId={GUEST_DECK_ID} />);
      const details = screen.getByRole("region", { name: "Deck details" });

      await user.selectOptions(
        within(details).getByRole("combobox", { name: "Format" }),
        "Oathbreaker"
      );
      await user.click(
        within(details).getByRole("button", { name: "Switch to Oathbreaker" })
      );

      expect(useDeckStore.getState().decks[GUEST_DECK_ID]?.format).toBe(
        "oathbreaker"
      );
      expect(loadGuestDeck()?.format).toBe("oathbreaker");
      expect(loadGuestDeck()?.cards).toHaveLength(3);
      expect(sent.filter(({ method }) => method === "PATCH")).toEqual([]);
    });
  });
});
