/**
 * Translating Scryfall card JSON into a `CatalogCard`: the mapper of the
 * Scryfall anti-corruption layer.
 *
 * Card catalog context, infrastructure side (ADR 0004). It parses with
 * `scryfallCardSchema` (`schema.ts`), then renames into the product's words and
 * derives what Scryfall only gives raw: image URLs as WebP (through
 * `getListedImageUri`, the one home of that rule) and the price as a number.
 * No code calls it yet; consumers move over one at a time
 * (docs/architecture/target-structure.md, step 8).
 *
 * @module scryfall/to-catalog-card
 */
import type { z } from "zod";
import {
  FORMAT_LEGALITIES,
  type CatalogCard,
  type CatalogCardFace,
  type CatalogCardImages,
  type FormatLegality,
} from "./catalog-card";
import { getListedImageUri } from "./images";
import {
  scryfallCardSchema,
  type ParsedImageUris,
  type ParsedScryfallCard,
  type ParsedScryfallCardFace,
} from "./schema";

/** A mapped card, or why the JSON is not a card the app can read. */
export type CatalogCardResult =
  | { readonly ok: true; readonly card: CatalogCard }
  | { readonly ok: false; readonly reason: string };

/**
 * The catalog card a Scryfall card object describes.
 *
 * Refuses, with the failing fields in `reason`, JSON that lacks a field every
 * card has (id, name, layout, language, colour identity, legalities, set code
 * and name), carries one of the wrong type, has an id that is not a UUID or a
 * colour outside the five. Never throws.
 *
 * @param json - a parsed Scryfall card object, such as one entry of a search
 *   page's `data`, or a body read from the shared card cache
 */
export function toCatalogCard(json: unknown): CatalogCardResult {
  const parsed = scryfallCardSchema.safeParse(json);
  if (!parsed.success) {
    return { ok: false, reason: describeIssues(parsed.error) };
  }
  return { ok: true, card: toCard(parsed.data) };
}

function toCard(card: ParsedScryfallCard): CatalogCard {
  return {
    id: card.id,
    oracleId: card.oracle_id,
    name: card.name,
    layout: card.layout,
    lang: card.lang,
    manaCost: card.mana_cost,
    manaValue: card.cmc,
    typeLine: card.type_line,
    oracleText: card.oracle_text,
    colorIdentity: card.color_identity,
    power: card.power,
    toughness: card.toughness,
    keywords: card.keywords,
    legalities: knownLegalities(card.legalities),
    priceUsd: toUsd(card.prices?.usd ?? null),
    setCode: card.set,
    setName: card.set_name,
    images: toImages(card.image_uris),
    faces: card.card_faces.map(toFace),
    printedName: card.printed_name,
    printedTypeLine: card.printed_type_line,
    printedText: card.printed_text,
  };
}

function toFace(face: ParsedScryfallCardFace): CatalogCardFace {
  return {
    name: face.name,
    manaCost: face.mana_cost,
    typeLine: face.type_line,
    oracleText: face.oracle_text,
    power: face.power,
    toughness: face.toughness,
    images: toImages(face.image_uris),
    printedName: face.printed_name,
    printedTypeLine: face.printed_type_line,
    printedText: face.printed_text,
  };
}

/** Each WebP version the app shows; JPEG-era keys are mapped to it. */
function toImages(
  uris: ParsedImageUris | null | undefined
): CatalogCardImages | null {
  if (!uris) return null;
  const listed = (size: keyof CatalogCardImages) =>
    getListedImageUri(uris, size) ?? null;
  return {
    thumb: listed("thumb"),
    grid: listed("grid"),
    display: listed("display"),
    crop: listed("crop"),
    art: listed("art"),
  };
}

const KNOWN_LEGALITIES: ReadonlySet<string> = new Set(FORMAT_LEGALITIES);

function isFormatLegality(status: string): status is FormatLegality {
  return KNOWN_LEGALITIES.has(status);
}

/**
 * The formats whose status is one the app knows. A format left out reads as
 * `undefined`, which the deck legality check already reports as "unknown"
 * (`toStatus` in `lib/deck/legality.ts`).
 */
function knownLegalities(
  statuses: Readonly<Record<string, string>>
): Readonly<Record<string, FormatLegality>> {
  const known: Record<string, FormatLegality> = {};
  for (const [format, status] of Object.entries(statuses)) {
    if (isFormatLegality(status)) known[format] = status;
  }
  return known;
}

/** Scryfall sends prices as decimal strings, such as "0.28". */
function toUsd(raw: string | null): number | null {
  if (raw === null) return null;
  const usd = Number.parseFloat(raw);
  return Number.isFinite(usd) ? usd : null;
}

function describeIssues(error: z.ZodError): string {
  return error.issues
    .map(
      (issue) =>
        `${issue.path.map(String).join(".") || "card"}: ${issue.message}`
    )
    .join("; ");
}
