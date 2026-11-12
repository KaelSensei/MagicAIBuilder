/**
 * The builder's deck details panel, driven as a player would.
 *
 * Sociable: the real deck store and the real deck API client run; only `fetch`
 * is replaced, by a recorder that answers every request with 200. A control
 * counts as working when the deck in the store changes and the matching
 * `PATCH /api/decks/[id]` leaves the page.
 */
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDeckStore } from "@/lib/deck/store";
import { createEmptyDeck } from "@/lib/deck/store-factories";
import type { Deck } from "@/lib/deck/types";
import { renderWithIntl } from "@/test/render-with-intl";
import { DeckDetailsPanel } from "./DeckDetailsPanel";

const DECK_ID = "deck-1";

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
function BuilderDeckDetails() {
  const deck = useDeckStore((state) => state.decks[DECK_ID]);
  return deck ? <DeckDetailsPanel deck={deck} /> : null;
}

function renderPanel(locale: "en" | "fr" = "en") {
  renderWithIntl(<BuilderDeckDetails />, { locale });
}

beforeEach(() => {
  sent = [];
  serverStatus = 200;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
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
});
