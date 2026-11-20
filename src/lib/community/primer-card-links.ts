/**
 * Resolving a primer's `[[Card Name]]` mentions against the deck's cards.
 *
 * Community context, pure. A mention resolves to the deck row it names, and links to that row's
 * stored printing on Scryfall. The destination is built from the row's Scryfall id only after
 * {@link isScryfallId} accepts it, so nothing the author typed inside the brackets, and no
 * malformed stored value, reaches an `href`. Names outside the deck resolve to nothing: the
 * renderer shows them as plain text and the owner's editor preview lists them.
 * Not responsible for: parsing (`primer-markdown`), resolving names through Scryfall (I-36
 * requirement 4.1's "then Scryfall", a later part of slice 6), or rendering.
 *
 * @module community/primer-card-links
 */
import { isScryfallId } from "@/lib/scryfall/scryfall-id";
import {
  primerCardMentions,
  type PrimerBlock,
  type PrimerCardMention,
} from "./primer-markdown";

/**
 * The fields of a deck row a mention reads. A public deck's `PublicCard` and the builder's
 * `DeckCard` both have them.
 */
export interface PrimerDeckCard {
  readonly name: string;
  readonly scryfallId?: string | null;
  readonly imageUri: string;
}

/** Where a resolved mention leads, and what its preview shows. */
export interface PrimerCardTarget {
  /** The deck row's name, as the card is printed: the link's accessible name. */
  readonly name: string;
  /** The stored printing's page on Scryfall. */
  readonly href: string;
  /** The stored printing's image; empty when the row has none. */
  readonly imageUri: string;
}

/** The deck's linkable cards by lower-case name, front-face name included. */
export type PrimerCardIndex = ReadonlyMap<string, PrimerCardTarget>;

/**
 * Scryfall answers `/card/<id>` with a permanent redirect to the printing's page
 * (`/card/<set>/<number>/<slug>`), so a row's id is enough to link it. Checked on 2026-11-20:
 * `https://scryfall.com/card/fc817e07-c1f3-469f-9cf7-0945dea7400f` → 301
 * `https://scryfall.com/card/trc/499/sol-ring`.
 */
const SCRYFALL_CARD_PAGE = "https://scryfall.com/card/";

/** Scryfall joins the faces of a double-faced card's name with ` // `. */
const FACE_SEPARATOR = " // ";

/**
 * Indexes the deck's cards for {@link resolvePrimerCard}.
 *
 * A row is indexed under its full name and, for a double-faced card, its front face's name, both
 * lower-cased. A row without a valid Scryfall id is left out, since no link can be built for it.
 * When two rows share a name, the first one wins: deck rows store no set code to tell them apart.
 *
 * @param cards - the deck's rows, in the deck's order
 */
export function primerCardIndex(
  cards: readonly PrimerDeckCard[]
): PrimerCardIndex {
  const index = new Map<string, PrimerCardTarget>();
  for (const card of cards) {
    const target = cardTarget(card);
    if (target === null) continue;
    for (const key of nameKeys(card.name)) {
      if (!index.has(key)) index.set(key, target);
    }
  }
  return index;
}

/**
 * The deck card a mention names, or `null` when the deck holds none.
 *
 * Names match case-insensitively, by the full name or a double-faced card's front-face name.
 * The set code of `[[Name|SET]]` does not narrow the match yet: deck rows store no set code, so
 * the mention resolves to the deck's row of that name.
 *
 * @param index - from {@link primerCardIndex}
 * @param mention - a card node of the parsed primer
 */
export function resolvePrimerCard(
  index: PrimerCardIndex,
  mention: PrimerCardMention
): PrimerCardTarget | null {
  return index.get(nameKey(mention.name)) ?? null;
}

/**
 * The mentioned names the deck does not hold: what the owner's editor preview lists under
 * "Not in this deck". Each name appears once, compared case-insensitively, in document order and
 * spelled as first written.
 *
 * @param blocks - a parsed primer
 * @param index - from {@link primerCardIndex}
 */
export function unresolvedPrimerCardNames(
  blocks: readonly PrimerBlock[],
  index: PrimerCardIndex
): readonly string[] {
  const unresolved = new Map<string, string>();
  for (const mention of primerCardMentions(blocks)) {
    const key = nameKey(mention.name);
    if (!index.has(key) && !unresolved.has(key)) {
      unresolved.set(key, mention.name);
    }
  }
  return [...unresolved.values()];
}

function cardTarget(card: PrimerDeckCard): PrimerCardTarget | null {
  const id = card.scryfallId ?? "";
  if (!isScryfallId(id)) return null;
  return {
    name: card.name,
    href: `${SCRYFALL_CARD_PAGE}${id.toLowerCase()}`,
    imageUri: card.imageUri,
  };
}

function nameKeys(name: string): readonly string[] {
  const frontFace = name.split(FACE_SEPARATOR)[0];
  return [nameKey(name), nameKey(frontFace)];
}

function nameKey(name: string): string {
  return name.trim().toLowerCase();
}
