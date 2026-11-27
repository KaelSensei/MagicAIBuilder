/**
 * The deck store's notices read in the player's language: the Game Changer
 * warnings, the undo notices, the forced save's confirmation and the
 * command-zone refusals. The store has no locale of its own, so it raises each
 * one by its catalogue key, with card names and counts as values, and the
 * toast container translates it (I-04). They used to be hard-coded in
 * English; English still reads word for word as it did.
 *
 * Each notice keeps its tone (warning, error, success, info): the test pins the
 * toast's type beside its words.
 *
 * Sociable: the real deck store, the real deck client over the in-memory deck
 * API, the real toast store, the real toast container and the real catalogs.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, screen } from "@testing-library/react";
import { ToastContainer } from "@/components/ui/Toast";
import { useToastStore, type ToastType } from "@/hooks/useToast";
import { aDeck } from "@/test/builders/deck";
import { aDeckCard } from "@/test/builders/card";
import { aScryfallCard } from "@/test/builders/scryfall";
import { emptyApiDeck, installFakeDeckClient } from "@/test/fake-deck-client";
import { renderWithIntl, type TestLocale } from "@/test/render-with-intl";

import { useDeckStore, type DeckAction } from "./store";
import type { Deck, DeckCard } from "./types";

const api = installFakeDeckClient();

const DECK_ID = "deck-1";

const CYCLONIC_RIFT = aScryfallCard({
  id: "00000000-0000-4000-8000-0000000c1c11",
  name: "Cyclonic Rift",
  type_line: "Instant",
  color_identity: ["U"],
});

const URZA = aScryfallCard({
  id: "00000000-0000-4000-8000-00000000a12a",
  name: "Urza, Lord High Artificer",
  type_line: "Legendary Creature — Human Artificer",
  color_identity: ["U"],
});

const KENRITH_ROW = aDeckCard({
  id: "row-kenrith",
  name: "Kenrith, the Returned King",
  typeLine: "Legendary Creature — Human Noble",
  colorIdentity: ["W", "U", "B", "R", "G"],
  category: "commander",
});

/** Has Partner, which Kenrith does not: the two cannot pair (CR 702.124a). */
const TYMNA = aScryfallCard({
  id: "00000000-0000-4000-8000-0000000071a1",
  name: "Tymna the Weaver",
  type_line: "Legendary Creature — Human Cleric",
  oracle_text:
    "Lifelink\nPartner (You can have two commanders if both have partner.)",
  keywords: ["Lifelink", "Partner"],
  color_identity: ["W", "B"],
});

const JEGANTHA = aScryfallCard({
  id: "00000000-0000-4000-8000-00000000e1c0",
  name: "Jegantha, the Wellspring",
  type_line: "Legendary Creature — Elemental Elk",
  oracle_text:
    "Companion — No card in your starting deck has more than one of the same mana symbol in its mana cost.",
  keywords: ["Companion"],
  color_identity: ["R"],
});

const LUTRI = aScryfallCard({
  id: "00000000-0000-4000-8000-0000000017a1",
  name: "Lutri, the Spellchaser",
  type_line: "Legendary Creature — Otter",
  oracle_text:
    "Companion — Each nonland card in your starting deck has a different name.\nFlash",
  keywords: ["Companion", "Flash"],
  color_identity: ["U", "R"],
});

const SOL_RING = aScryfallCard({
  id: "00000000-0000-4000-8000-0000000050c1",
  name: "Sol Ring",
  type_line: "Artifact",
  oracle_text: "{T}: Add {C}{C}.",
});

const ARCANE_SIGNET_ROW = aDeckCard({
  id: "row-signet",
  name: "Arcane Signet",
  typeLine: "Artifact",
});

/** A Game Changer the deck already holds. */
function aGameChangerRow(name: string): DeckCard {
  return aDeckCard({ id: `row-${name}`, name, isGameChanger: true });
}

/** Two printings of Sol Ring in the deck list, as two rows. */
const TWO_SOL_RING_PRINTINGS = [
  aDeckCard({ id: "row-sol-ring-c21", name: "Sol Ring" }),
  aDeckCard({ id: "row-sol-ring-cmm", name: "Sol Ring" }),
];

/** The deck store's actions. */
function store() {
  return useDeckStore.getState();
}

/** Opens `deck` in the builder, with the Game Changers list loaded. */
function holdOpenDeck(deck: Partial<Deck> = {}): void {
  useDeckStore.setState({
    decks: { [DECK_ID]: aDeck({ id: DECK_ID, ...deck }) },
    activeDeckId: DECK_ID,
    gameChangerNames: new Set([CYCLONIC_RIFT.name, URZA.name]),
    bannedNames: new Set(),
  });
}

/** Undoes `change`, the last change made to the open deck. */
function undoChange(change: DeckAction): Promise<void> {
  useDeckStore.setState({ undoStack: [change] });
  return store().undo();
}

/** Runs a store action, with React's updates flushed. */
async function perform(action: () => Promise<unknown>): Promise<void> {
  await act(async () => {
    await action();
  });
}

/** One notice the store raises: how to raise it, its tone and its words. */
interface Notice {
  readonly notice: string;
  readonly run: () => Promise<unknown>;
  readonly type: ToastType;
  readonly en: string;
  readonly fr: string;
}

const NOTICES: readonly Notice[] = [
  {
    notice: "the first Game Changer, which makes the deck Bracket 3 at least",
    run: () => {
      holdOpenDeck();
      return store().addCard(CYCLONIC_RIFT);
    },
    type: "warning",
    en: "⚡ Cyclonic Rift is a Game Changer — your deck is now Bracket 3 minimum.",
    fr: "⚡ Cyclonic Rift est un Game Changer — votre deck est désormais au moins en Bracket 3.",
  },
  {
    notice: "a second Game Changer, counted against Bracket 3's three",
    run: () => {
      holdOpenDeck({ cards: [aGameChangerRow("Rhystic Study")] });
      return store().addCard(CYCLONIC_RIFT);
    },
    type: "warning",
    en: "⚡ Cyclonic Rift is a Game Changer (2/3). Bracket 3 minimum applies.",
    fr: "⚡ Cyclonic Rift est un Game Changer (2/3). Le deck reste au moins en Bracket 3.",
  },
  {
    notice: "a fourth Game Changer, which pushes the deck to Bracket 4",
    run: () => {
      holdOpenDeck({
        cards: ["Rhystic Study", "Smothering Tithe", "The One Ring"].map(
          aGameChangerRow
        ),
      });
      return store().addCard(CYCLONIC_RIFT);
    },
    type: "warning",
    en: "⚡ Cyclonic Rift is a Game Changer — you now have 4 Game Changers, pushing the deck to Bracket 4.",
    fr: "⚡ Cyclonic Rift est un Game Changer — vous avez désormais 4 Game Changers, ce qui place le deck en Bracket 4.",
  },
  {
    notice: "a Game Changer chosen as commander",
    run: () => {
      holdOpenDeck();
      return store().setCommander(URZA);
    },
    type: "warning",
    en: "⚡ Urza, Lord High Artificer is a Game Changer — your deck is automatically Bracket 3 minimum.",
    fr: "⚡ Urza, Lord High Artificer est un Game Changer — votre deck est automatiquement au moins en Bracket 3.",
  },
  {
    notice: "an undo the server saved",
    run: () => {
      holdOpenDeck();
      return undoChange({
        type: "REMOVE_CARD",
        deckId: DECK_ID,
        card: ARCANE_SIGNET_ROW,
      });
    },
    type: "info",
    en: "↩ Undo applied",
    fr: "↩ Annulation effectuée",
  },
  {
    notice: "an undo that cannot tell which printing to remove",
    run: () => {
      holdOpenDeck({ cards: TWO_SOL_RING_PRINTINGS });
      return undoChange({
        type: "ADD_CARD",
        deckId: DECK_ID,
        card: aDeckCard({ id: "row-sol-ring-unsaved", name: "Sol Ring" }),
      });
    },
    type: "error",
    en: "Could not identify the card to undo: multiple printings match.",
    fr: "Impossible de savoir quelle carte annuler : plusieurs éditions correspondent.",
  },
  {
    notice: "a forced save",
    run: () => {
      holdOpenDeck();
      return store().forceSave();
    },
    type: "success",
    en: "✓ Deck saved",
    fr: "✓ Deck enregistré",
  },
  {
    notice: "a companion before the deck has a commander",
    run: () => {
      holdOpenDeck();
      return store().setCompanion(JEGANTHA);
    },
    type: "warning",
    en: "Choose a commander before setting a companion.",
    fr: "Choisissez un commandant avant de définir un compagnon.",
  },
  {
    notice: "a companion without Companion",
    run: () => {
      holdOpenDeck({ commander: KENRITH_ROW });
      return store().setCompanion(SOL_RING);
    },
    type: "warning",
    en: "That card does not have Companion.",
    fr: "Cette carte n’a pas la capacité Compagnon.",
  },
  {
    notice: "Lutri as a companion",
    run: () => {
      holdOpenDeck({ commander: KENRITH_ROW });
      return store().setCompanion(LUTRI);
    },
    type: "warning",
    en: "Lutri cannot be your companion in Commander.",
    fr: "Lutri ne peut pas être votre compagnon en Commander.",
  },
  {
    notice: "a partner that cannot pair with the commander",
    run: () => {
      holdOpenDeck({ commander: KENRITH_ROW });
      return store().setPartner(TYMNA);
    },
    type: "warning",
    en: "Tymna the Weaver cannot share the command zone with Kenrith, the Returned King.",
    fr: "Tymna the Weaver ne peut pas partager la zone de commandement avec Kenrith, the Returned King.",
  },
];

const LOCALES: readonly TestLocale[] = ["fr", "en"];

beforeEach(() => {
  // The server holds the deck, so the saves behind a notice succeed.
  api.seedDeck(emptyApiDeck(DECK_ID));
});

afterEach(() => {
  const { toasts, remove } = useToastStore.getState();
  for (const toast of toasts) remove(toast.id);
  useDeckStore.setState({
    decks: {},
    activeDeckId: null,
    undoStack: [],
    gameChangerNames: new Set(),
  });
});

describe("a deck store notice", () => {
  it.each(
    NOTICES.flatMap((notice) =>
      LOCALES.map((locale) => ({ ...notice, locale, text: notice[locale] }))
    )
  )(
    "tells the player about $notice in their language ($locale)",
    async ({ run, type, locale, text }) => {
      renderWithIntl(<ToastContainer />, { locale });

      await perform(run);

      expect(screen.getByText(text)).toBeInTheDocument();
      expect(
        useToastStore.getState().toasts.map((toast) => toast.type)
      ).toEqual([type]);
    }
  );
});
