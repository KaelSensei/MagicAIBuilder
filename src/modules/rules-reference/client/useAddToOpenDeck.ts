/**
 * What the Game Changers and banlist page's zoom needs to add its card to the deck the player
 * has open in this session: the deck's name, how many copies of the card its main deck holds,
 * and the add itself.
 *
 * Rules reference context, `client/`. The deck lives in the deck-building store
 * (`lib/deck/store`), which this hook reads through fine-grained selectors and writes through its
 * `addCard` action only, the one the builder's search calls. Every deck-building rule (the copy
 * limit, the owned-first printing, the Game Changer and legality flags, the save and its failure
 * toast) stays in that action; this hook adds none (I-37, "Add to the open deck from card, rules
 * and public-deck pages").
 *
 * @module rules-reference/client/useAddToOpenDeck
 */
import { useCallback, useState } from "react";
import { useDeckStore } from "@/lib/deck/store";
import type { Deck } from "@/lib/deck/types";
import { isBasicLand } from "@/lib/scryfall/type-line";
import type { ScryfallCard } from "@/lib/scryfall/types";

/**
 * The zoom's add-to-deck state.
 *
 * - `no-open-deck`: no deck is open in this session (a full page load, or a visitor who never
 *   opened one), so there is nothing to add to.
 * - `open-deck`: the open deck's name, the copies of the zoomed card its main deck holds (read
 *   back from the store, so a press that added nothing shows nothing new), whether the last
 *   press on this card raised that count, whether that press is still saving, and the add.
 */
export type OpenDeckAddition =
  | { readonly kind: "no-open-deck" }
  | {
      readonly kind: "open-deck";
      readonly deckName: string;
      readonly copies: number;
      /** Whether the count is worth naming: a basic land, or more than one copy. */
      readonly showCount: boolean;
      readonly justAdded: boolean;
      readonly isAdding: boolean;
      readonly onAdd: () => void;
    };

/** The last press on the add button: which card, the count before it, and whether it settled. */
interface Press {
  readonly cardId: string;
  readonly copiesBefore: number;
  readonly settled: boolean;
}

/** The deck the player has open, or null when none is held. */
function openDeck(state: {
  readonly activeDeckId: string | null;
  readonly decks: Readonly<Record<string, Deck>>;
}): Deck | null {
  return state.activeDeckId ? (state.decks[state.activeDeckId] ?? null) : null;
}

/**
 * The copies of `name` in `deck`'s main deck, the zone the add puts a card in. The name match is
 * the one `addCard` uses to find a card already in the zone.
 */
function mainDeckCopies(deck: Deck | null, name: string | undefined): number {
  if (!deck || name === undefined) return 0;
  return deck.cards.reduce(
    (total, card) =>
      card.name === name && card.zone === "main" ? total + card.quantity : total,
    0
  );
}

/**
 * The add-to-open-deck state of `card`, the card the zoom shows (null while no card is zoomed).
 *
 * The press does what a search add in the builder does: one copy to the main deck, through the
 * store's `addCard`. `justAdded` is true only while the main deck holds more copies than before
 * the press, so a press refused at the copy limit, or rolled back after a failed save, never
 * reads as added.
 *
 * @param card - the zoomed card, or null when the zoom is closed
 * @returns the state the zoom renders
 */
export function useAddToOpenDeck(card: ScryfallCard | null): OpenDeckAddition {
  const deckName = useDeckStore((state) => openDeck(state)?.name);
  const copies = useDeckStore((state) => mainDeckCopies(openDeck(state), card?.name));
  const addCard = useDeckStore((state) => state.addCard);
  const [press, setPress] = useState<Press | null>(null);

  const onAdd = useCallback(() => {
    if (!card) return;
    const cardId = card.id;
    setPress({ cardId, copiesBefore: copies, settled: false });
    void addCard(card).finally(() =>
      setPress((last) => (last?.cardId === cardId ? { ...last, settled: true } : last))
    );
  }, [addCard, card, copies]);

  if (deckName === undefined || !card) return { kind: "no-open-deck" };
  const pressOnCard = press?.cardId === card.id ? press : null;
  return {
    kind: "open-deck",
    deckName,
    copies,
    showCount: copies > 1 || isBasicLand(card.type_line),
    justAdded: pressOnCard !== null && copies > pressOnCard.copiesBefore,
    isAdding: pressOnCard !== null && !pressOnCard.settled,
    onAdd,
  };
}
