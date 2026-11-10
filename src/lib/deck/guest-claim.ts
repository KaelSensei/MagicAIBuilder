import type { Deck, DeckCard } from "./types";
import { loadGuestDeck } from "./guest-deck";
import { cardsFromZoneSource } from "./zone-source";
import {
  createDeckWithCards,
  type AddCardPayload,
  type CreateDeckWithCardsBody,
} from "@/lib/db/deck-api";
import { logger } from "@/lib/logger";

/** Holds the `createdAt` of the guest deck the user chose not to save. */
export const GUEST_CLAIM_DECLINED_STORAGE_KEY =
  "magic-ai-builder:guest-claim-declined:v1";

/** Limits `POST /api/decks` applies; guest decks never passed through it. */
const MAX_NAME_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_TAGS = 20;
const MAX_TAG_LENGTH = 50;
const FALLBACK_NAME = "Guest Deck";

/** What the offer shows about the guest deck. */
export interface GuestDeckSummary {
  readonly name: string;
  /** Cards in the deck, command zone included and maybeboard left out. */
  readonly cardCount: number;
}

/** A guest deck with something worth saving, and its summary. */
export interface ClaimableGuestDeck {
  readonly deck: Deck;
  readonly summary: GuestDeckSummary;
}

/** How an attempt to save the guest deck ended. */
export type GuestClaimOutcome =
  | {
      readonly kind: "saved";
      readonly deckId: string;
      readonly deckName: string;
    }
  | { readonly kind: "failed" };

type CommandSlot = "deck" | "commander" | "partner" | "companion";

function commandZoneOf(deck: Deck): readonly DeckCard[] {
  return [deck.commander, deck.partner, deck.companion].filter(
    (card): card is DeckCard => card !== null
  );
}

/**
 * @param deck - a guest deck read from this browser
 * @returns its summary, or null when it holds no card at all
 */
export function summarizeGuestDeck(deck: Deck): GuestDeckSummary | null {
  const cards = cardsFromZoneSource(deck);
  const commandZone = commandZoneOf(deck);
  if (cards.length === 0 && commandZone.length === 0) return null;

  let cardCount = commandZone.length;
  for (const card of cards) {
    if (card.zone !== "maybeboard") cardCount += card.quantity;
  }
  return { name: deck.name, cardCount };
}

/**
 * Reads the guest deck when there is one worth offering to save.
 *
 * Storage can be unreadable (blocked site data, a private window), and this
 * runs on every page for a signed-in user, so a failed read means "nothing to
 * offer" rather than an error.
 *
 * @returns the deck and its summary, or null
 */
export function readClaimableGuestDeck(): ClaimableGuestDeck | null {
  try {
    const deck = loadGuestDeck();
    const summary = deck ? summarizeGuestDeck(deck) : null;
    return deck && summary ? { deck, summary } : null;
  } catch {
    return null;
  }
}

function scryfallIdOf(card: DeckCard): string {
  return card.scryfallId ?? card.id;
}

function toClaimCard(card: DeckCard, slot: CommandSlot): AddCardPayload {
  return {
    scryfallId: scryfallIdOf(card),
    name: card.name,
    manaCost: card.manaCost,
    cmc: card.cmc,
    typeLine: card.typeLine,
    oracleText: card.oracleText,
    power: card.power ?? null,
    toughness: card.toughness ?? null,
    colorIdentity: card.colorIdentity,
    isGameChanger: card.isGameChanger,
    isBanned: card.isBanned,
    price: card.price,
    // The server accepts a URL or nothing; an empty string is neither.
    imageUri: card.imageUri || undefined,
    artCropUri: card.artCropUri || undefined,
    // The companion is told apart from the deck by its category alone.
    category: slot === "companion" ? "companion" : card.category,
    quantity: card.quantity,
    isCommander: slot === "commander" || slot === "partner",
    isPartner: slot === "partner",
    zone: card.zone,
  };
}

function claimCards(deck: Deck): AddCardPayload[] {
  const cards = cardsFromZoneSource(deck).map((card) =>
    toClaimCard(card, "deck")
  );
  if (deck.commander) cards.push(toClaimCard(deck.commander, "commander"));
  if (deck.partner) cards.push(toClaimCard(deck.partner, "partner"));
  if (deck.companion) cards.push(toClaimCard(deck.companion, "companion"));
  return cards;
}

/**
 * Turns a guest deck into the body `POST /api/decks` accepts.
 *
 * The deck's own fields were never checked by the server while it lived in the
 * browser, so they are fitted to the route's limits here: a request the route
 * rejects would leave the user unable to save their deck at all.
 *
 * @param deck - the guest deck
 * @returns the request body
 */
export function buildGuestClaimBody(deck: Deck): CreateDeckWithCardsBody {
  return {
    name: deck.name.trim().slice(0, MAX_NAME_LENGTH) || FALLBACK_NAME,
    format: deck.format,
    targetBracket: deck.targetBracket,
    manualBracket: deck.manualBracket,
    budget: deck.budget !== null && deck.budget > 0 ? deck.budget : null,
    description: deck.description.slice(0, MAX_DESCRIPTION_LENGTH),
    tags: deck.tags
      .slice(0, MAX_TAGS)
      .map((tag) => tag.slice(0, MAX_TAG_LENGTH)),
    commanderId: deck.commander ? scryfallIdOf(deck.commander) : null,
    commanderName: deck.commander?.name ?? null,
    partnerId: deck.partner ? scryfallIdOf(deck.partner) : null,
    companionId: deck.companion ? scryfallIdOf(deck.companion) : null,
    pairingType: deck.pairingType,
    cards: claimCards(deck),
  };
}

/**
 * 53-bit string hash (cyrb53). Not cryptographic: it only has to tell two
 * versions of one user's guest deck apart.
 */
function hash53(text: string): number {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let index = 0; index < text.length; index++) {
    const code = text.charCodeAt(index);
    h1 = Math.imul(h1 ^ code, 2654435761);
    h2 = Math.imul(h2 ^ code, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

/**
 * The idempotency key for saving this exact deck.
 *
 * It is derived from the body, so it needs no storage: a double click, a retry
 * or a reload sends the same key and gets back the deck the first request
 * wrote. Once the deck changes, the key changes too, so a retry never returns
 * an older copy in place of newer work.
 *
 * @param body - the request body
 * @returns the key to send as `Idempotency-Key`
 */
export function guestClaimKey(body: CreateDeckWithCardsBody): string {
  return `guest-claim-${hash53(JSON.stringify(body)).toString(36).padStart(11, "0")}`;
}

function declineMarker(deck: Deck): string {
  return String(deck.createdAt.getTime());
}

/**
 * @param deck - the guest deck
 * @returns whether the user already declined to save this guest deck
 */
export function hasDeclinedGuestClaim(deck: Deck): boolean {
  try {
    return (
      window.localStorage.getItem(GUEST_CLAIM_DECLINED_STORAGE_KEY) ===
      declineMarker(deck)
    );
  } catch {
    return false;
  }
}

/**
 * Remembers that the user chose to keep this guest deck in the browser, so
 * the offer does not follow them from page to page. A later guest deck has
 * its own `createdAt` and is offered again.
 *
 * @param deck - the guest deck the user declined to save
 */
export function declineGuestClaim(deck: Deck): void {
  try {
    window.localStorage.setItem(
      GUEST_CLAIM_DECLINED_STORAGE_KEY,
      declineMarker(deck)
    );
  } catch {
    // Unwritable storage: the offer may show again, which loses nothing.
  }
}

async function forgetClaimedGuestDeck(): Promise<void> {
  // Loaded on demand: the deck store is large, and this code runs on every page.
  const { useDeckStore } = await import("./store");
  useDeckStore.getState().forgetGuestDeck();
  window.localStorage.removeItem(GUEST_CLAIM_DECLINED_STORAGE_KEY);
}

/**
 * Saves the guest deck to the signed-in account, then removes the browser copy.
 *
 * The browser copy is removed only after the server has answered with the
 * saved deck. Any failure — the request, or removing the copy — leaves the
 * deck in the browser, and trying again is safe because the idempotency key
 * returns the deck already written.
 *
 * @param deck - the guest deck to save
 * @returns the saved deck, or a failure
 */
export async function claimGuestDeck(deck: Deck): Promise<GuestClaimOutcome> {
  const body = buildGuestClaimBody(deck);
  try {
    const saved = await createDeckWithCards(body, guestClaimKey(body));
    await forgetClaimedGuestDeck();
    return { kind: "saved", deckId: saved.id, deckName: saved.name };
  } catch (error) {
    logger.error("Could not save the guest deck", "claimGuestDeck", error);
    return { kind: "failed" };
  }
}
