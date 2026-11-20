/**
 * The shape of an export target's versioned fixture, `<target>/v1`, and the
 * deck every `v1` fixture exports (I-50 requirement 1.4).
 *
 * Deck interchange, test data. A fixture freezes one input deck and the exact
 * result its target gives for it, content byte for byte. A fixture is never
 * edited once a person has verified it: a change of output is a new version.
 * Each fixture stays unverified (`verifiedImport: null`) until a person
 * imports its content into the target's client and records the client
 * version and the date there.
 *
 * @module deck/exports/fixtures/export-fixture
 */
import type { ExportResult, ExportTarget } from "@/lib/deck/export";
import type { Deck, DeckCard } from "@/lib/deck/types";
import { aDeckCard } from "@/test/builders/card";
import { aDeck } from "@/test/builders/deck";

/** A person's record of a successful import of a fixture's content. */
export interface VerifiedImport {
  /** The client and its version, e.g. "TappedOut web, 2026-11-20 build". */
  readonly client: string;
  /** The import date, `YYYY-MM-DD`. */
  readonly date: string;
}

/** One target's frozen export contract. */
export interface ExportFixture {
  readonly version: `${ExportTarget}/v1`;
  readonly target: ExportTarget;
  /** `null` while unverified: no person has recorded a successful import. */
  readonly verifiedImport: VerifiedImport | null;
  readonly input: Deck;
  readonly expected: ExportResult;
}

function card(
  name: string,
  overrides: Partial<DeckCard> & Pick<DeckCard, "category">
): DeckCard {
  return aDeckCard({ id: name, name, ...overrides });
}

/**
 * The `v1` input deck, with something in every zone an exporter treats
 * differently: two partnered commanders, a companion, a card note on two
 * lines, a split card, a name with XML-special quotes, a quantity above 9, a
 * sideboard card and a Considering card. The accented, punctuated deck name
 * pins the download file name.
 */
export const EXPORT_DECK_V1: Deck = aDeck({
  name: "Lim-Dûl's Vault",
  commander: card("Sidar Kondo of Jamuraa", { category: "commander" }),
  partner: card("Vial Smasher the Fierce", { category: "commander" }),
  pairingType: "partner",
  companion: card("Lurrus of the Dream-Den", { category: "companion" }),
  cards: [
    card("Sol Ring", { category: "ramp", notes: "Turn-one play\nKeep it" }),
    card("Fire // Ice", { category: "instant" }),
    card('Kongming, "Sleeping Dragon"', { category: "creature" }),
    card("Plains", { category: "land", quantity: 10 }),
    card("Negate", { category: "instant", quantity: 2, zone: "sideboard" }),
    card("Counterspell", { category: "instant", zone: "maybeboard" }),
  ],
});
