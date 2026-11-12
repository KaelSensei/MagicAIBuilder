/**
 * The catalog card: one printing as the product reads it, in the product's own
 * words, translated from Scryfall.
 *
 * Card catalog context, domain side of the Scryfall anti-corruption layer
 * (ADR 0004). `toCatalogCard` (`to-catalog-card.ts`) is the only producer. No
 * code reads it yet: the deck rules, the AI and the UI still read the wire type
 * `ScryfallCard` and move over one consumer at a time
 * (docs/architecture/target-structure.md, step 8).
 *
 * The fields are the ones the app reads from `ScryfallCard` today, inventoried
 * on 2026-11-11; Scryfall fields nobody reads (colours, rarity, artist, flavour
 * text, foil and euro prices) are left out. Absence rule: a field Scryfall
 * omits, or sends as null, for some cards is `null` here; a value it sends is
 * kept as sent, empty strings included.
 *
 * @module scryfall/catalog-card
 */
import type { ImageSize } from "./images";

/** The five colours (CR 105.1), by the letter of their mana symbol. */
export const CARD_COLORS = ["W", "U", "B", "R", "G"] as const;

/** One of the five colours. Colourless is the absence of colour, not a colour. */
export type CardColor = (typeof CARD_COLORS)[number];

/** The statuses Scryfall reports for a card in one format. */
export const FORMAT_LEGALITIES = [
  "legal",
  "not_legal",
  "restricted",
  "banned",
] as const;

/** A card's status in one format, as Scryfall reports it. */
export type FormatLegality = (typeof FORMAT_LEGALITIES)[number];

/**
 * The URL of each image version the app shows, as WebP (`images.ts` lists the
 * sizes). A URL taken from card JSON cached before Scryfall served WebP is
 * already mapped to its WebP analog. `null` when Scryfall lists no image for
 * that version.
 */
export type CatalogCardImages = { readonly [Size in ImageSize]: string | null };

/**
 * One face of a card with several: a double-faced card's sides (CR 712.1), a
 * split card's halves (CR 709.1), an adventurer card's creature and its
 * adventure (CR 715.1), a reversible card's sides.
 */
export interface CatalogCardFace {
  readonly name: string;
  /** "" for a face with no mana cost, such as a land back. */
  readonly manaCost: string | null;
  readonly typeLine: string | null;
  readonly oracleText: string | null;
  /** As printed: may be "*" or "1+*", so not a number. */
  readonly power: string | null;
  readonly toughness: string | null;
  /** `null` for split and adventurer faces, whose image is the card's. */
  readonly images: CatalogCardImages | null;
  /** Text as printed on this face, when Scryfall gives it; see `CatalogCard.printedName`. */
  readonly printedName: string | null;
  readonly printedTypeLine: string | null;
  readonly printedText: string | null;
}

/**
 * One printing of a card, as the product reads it.
 *
 * Where Scryfall puts a value depends on the layout. A double-faced card keeps
 * its mana cost, rules text, power, toughness and images on its faces, so those
 * card-level fields are `null`; a split or adventurer card keeps a combined
 * "A // B" mana cost and type line on the card and its rules text on the faces.
 * A reversible card keeps every rules field on its faces.
 */
export interface CatalogCard {
  /** Scryfall's id of this printing: a lower-case UUID. */
  readonly id: string;
  /** Shared by every printing of one Oracle card; `null` on a reversible card. */
  readonly oracleId: string | null;
  /** English Oracle name; "Front // Back" for a card with several faces. */
  readonly name: string;
  /** Scryfall's layout code, such as "normal", "split", "transform", "modal_dfc". */
  readonly layout: string;
  /** Scryfall's language code of this printing, such as "en", "fr", "zhs". */
  readonly lang: string;
  /** "" for a card with no mana cost, such as a land. */
  readonly manaCost: string | null;
  /** CR 202.3; Scryfall's `cmc`. May be fractional. `null` on a reversible card. */
  readonly manaValue: number | null;
  readonly typeLine: string | null;
  readonly oracleText: string | null;
  /** CR 903.4: the card's colour identity, in the order Scryfall lists it. */
  readonly colorIdentity: readonly CardColor[];
  /** As printed: may be "*" or "1+*", so not a number. */
  readonly power: string | null;
  readonly toughness: string | null;
  /** Keyword abilities and actions Scryfall finds in the rules text. */
  readonly keywords: readonly string[];
  /** Status by Scryfall format key (`commander`, `brawl`, …); unknown statuses are left out. */
  readonly legalities: Readonly<Record<string, FormatLegality>>;
  /** Scryfall's market price of the non-foil printing, in US dollars; `null` when it has none. */
  readonly priceUsd: number | null;
  /** Scryfall's set code, such as "fdn". */
  readonly setCode: string;
  readonly setName: string;
  /** `null` when the images live on the faces (double-faced and reversible cards). */
  readonly images: CatalogCardImages | null;
  /** Empty for a single-faced card. */
  readonly faces: readonly CatalogCardFace[];
  /**
   * Text as printed, when Scryfall gives it: the translation on a non-English
   * printing, sometimes a variant wording on an English one. The fields above
   * stay English Oracle text. Whether a printing is localised is told by
   * `lang`, never by these fields.
   */
  readonly printedName: string | null;
  readonly printedTypeLine: string | null;
  readonly printedText: string | null;
}
