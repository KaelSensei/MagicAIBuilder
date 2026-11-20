/**
 * Deck legality from Scryfall card data: the pure policy.
 *
 * The verdict reads each card's status in the deck's format from Scryfall
 * `legalities`. It never reads the `isBanned` flag stored on a deck row: the
 * browser sets that flag, so it records what the client believed, not what the
 * format's list says.
 */
import { releaseDayAhead } from "@/lib/releases/release-status";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { FORMAT_CONFIG, type DeckFormat } from "./formats";

/** The deck row fields the legality check reads. */
export interface LegalityDeckCard {
  readonly scryfallId: string;
  readonly name: string;
  readonly quantity: number;
  /** "main" | "sideboard" | "maybeboard", as stored */
  readonly zone: string;
}

/** A card's status in one format; `unknown` when Scryfall returned no data for it. */
export type CardLegalityStatus =
  "legal" | "not_legal" | "banned" | "restricted" | "unknown";

/** One printing's status in the deck's format. */
export interface CardLegality {
  readonly scryfallId: string;
  readonly name: string;
  readonly status: CardLegalityStatus;
}

/**
 * Why a card makes the deck illegal. `preview` is Scryfall's `not_legal` for a card whose set is
 * not out yet (I-73 3.2): the verdict is the same, only the words change.
 */
export type LegalityViolationReason =
  "banned" | "not_legal" | "preview" | "restricted_over_limit" | "unverified";

/** The reasons a card's status gives with no release date to read: every reason but `preview`. */
type StatusViolationReason = Exclude<LegalityViolationReason, "preview">;

/**
 * A card that makes the deck illegal, once per card name and reason. A `preview` names the day
 * its set releases, "YYYY-MM-DD", so no surface says "not legal" alone (I-73 3.4).
 */
export type LegalityViolation =
  | {
      readonly name: string;
      readonly reason: StatusViolationReason;
    }
  | {
      readonly name: string;
      readonly reason: "preview";
      readonly releasesOn: string;
    };

/** Where the card data behind a verdict came from, and when. */
export interface LegalitySource {
  readonly provider: "scryfall";
  /** The Scryfall `legalities` key read for the format */
  readonly legalityKey: string;
  /** ISO 8601 time at which the server fetched the card data */
  readonly fetchedAt: string;
}

/** A verdict for a format this build supports. */
export interface CheckedDeckLegality {
  readonly kind: "checked";
  readonly format: DeckFormat;
  readonly legal: boolean;
  readonly cards: readonly CardLegality[];
  readonly violations: readonly LegalityViolation[];
  readonly source: LegalitySource;
}

/** A deck stored with a format this build does not support: no rules are applied to it. */
export interface UnsupportedFormatVerdict {
  readonly kind: "unsupported_format";
  readonly format: string;
}

/** The legality verdict for a stored deck. */
export type DeckLegalityVerdict =
  CheckedDeckLegality | UnsupportedFormatVerdict;

/**
 * Keep the rows that are part of the deck: the maybeboard holds ideas, not cards in play.
 * @param cards - Every stored row of the deck
 * @returns The main deck and sideboard rows
 */
export function cardsCountedForLegality(
  cards: readonly LegalityDeckCard[]
): readonly LegalityDeckCard[] {
  return cards.filter((card) => card.zone !== "maybeboard");
}

function toStatus(value: string | undefined): CardLegalityStatus {
  switch (value) {
    case "legal":
    case "not_legal":
    case "banned":
    case "restricted":
      return value;
    default:
      return "unknown";
  }
}

/**
 * The violation a status causes on its own. A restricted card is legal at one
 * copy: in the formats this build supports, Scryfall marks cards restricted only
 * in Vintage, where the limit counts the sideboard too. Duel Commander's
 * "banned as commander" (I-42 slice 3) will need its own meaning.
 */
function violationReason(
  status: CardLegalityStatus
): StatusViolationReason | null {
  switch (status) {
    case "legal":
    case "restricted":
      return null;
    case "banned":
      return "banned";
    case "not_legal":
      return "not_legal";
    case "unknown":
      return "unverified";
    default: {
      const unreachable: never = status;
      return unreachable;
    }
  }
}

/**
 * The violation a card's status causes, read on the day the card data was fetched: a card not
 * legal only because its set is not out yet is a `preview`, with its release day.
 */
function violationFor(
  card: { readonly name: string; readonly status: CardLegalityStatus },
  scryfallCard: ScryfallCard | undefined,
  fetchedAt: Date
): LegalityViolation | null {
  const reason = violationReason(card.status);
  if (reason !== "not_legal" || !scryfallCard) {
    return reason ? { name: card.name, reason } : null;
  }
  const releasesOn = releaseDayAhead(scryfallCard, fetchedAt);
  return releasesOn
    ? { name: card.name, reason: "preview", releasesOn }
    : { name: card.name, reason };
}

function compareViolations(
  left: LegalityViolation,
  right: LegalityViolation
): number {
  return (
    left.name.localeCompare(right.name, "en", { sensitivity: "base" }) ||
    left.reason.localeCompare(right.reason)
  );
}

/**
 * Judge a deck against its format from Scryfall card data the server fetched.
 *
 * A card Scryfall did not return is `unknown`, and the deck is then not called
 * legal: an unverified card cannot be vouched for. A card Scryfall marks not
 * legal because its set is not out on the fetch day is named a `preview`, with
 * its release day; the deck is still not legal (I-73 3.2).
 *
 * @param input.format - The deck's format, already known to be supported
 * @param input.cards - The deck rows; maybeboard rows are ignored
 * @param input.scryfallCards - Scryfall card objects for the rows' printings
 * @param input.fetchedAt - When the server fetched `scryfallCards`
 * @returns The verdict, with every violation sorted by card name
 */
export function judgeDeckLegality(input: {
  readonly format: DeckFormat;
  readonly cards: readonly LegalityDeckCard[];
  readonly scryfallCards: readonly ScryfallCard[];
  readonly fetchedAt: Date;
}): CheckedDeckLegality {
  const legalityKey = FORMAT_CONFIG[input.format].scryfallLegality;
  const scryfallById = new Map(
    input.scryfallCards.map((card) => [card.id, card])
  );
  const cards = new Map<string, CardLegality>();
  const restrictedCopies = new Map<string, number>();
  const violations = new Map<string, LegalityViolation>();

  for (const row of cardsCountedForLegality(input.cards)) {
    const scryfallCard = scryfallById.get(row.scryfallId);
    const status = scryfallCard
      ? toStatus(scryfallCard.legalities?.[legalityKey])
      : "unknown";
    const name = scryfallCard?.name ?? row.name;
    cards.set(row.scryfallId, { scryfallId: row.scryfallId, name, status });
    if (status === "restricted") {
      restrictedCopies.set(
        name,
        (restrictedCopies.get(name) ?? 0) + row.quantity
      );
    }
    const violation = violationFor(
      { name, status },
      scryfallCard,
      input.fetchedAt
    );
    if (violation) violations.set(`${violation.reason}:${name}`, violation);
  }

  for (const [name, copies] of restrictedCopies) {
    if (copies > 1) {
      violations.set(`restricted_over_limit:${name}`, {
        name,
        reason: "restricted_over_limit",
      });
    }
  }

  const sortedViolations = [...violations.values()].toSorted(compareViolations);
  return {
    kind: "checked",
    format: input.format,
    legal: sortedViolations.length === 0,
    cards: [...cards.values()],
    violations: sortedViolations,
    source: {
      provider: "scryfall",
      legalityKey,
      fetchedAt: input.fetchedAt.toISOString(),
    },
  };
}
