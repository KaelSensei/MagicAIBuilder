/**
 * The line guards of a bulk file (I-67 5.1): each line must be a JSON object holding the fields
 * the loader keys on. A missing field fails the whole file. A top-level field nobody knows is
 * only a warning, so a format change surfaces on its first day without stopping the data.
 *
 * Pure: a line of text in, a verdict out.
 *
 * @module card-data/line-guards
 */
import "server-only";
import { isRecord } from "@/lib/guards";
import type { BulkFileType, BulkLineProblem, BulkObject } from "./bulk-file";

/**
 * Every top-level field of a card object in Oracle Cards and Default Cards, measured over the
 * whole of both files of 2026-11-20 (39,356 and 120,211 lines). The card fields Scryfall
 * documents (https://scryfall.com/docs/api/cards, read 2026-11-20) are a superset of these.
 */
const CARD_FIELDS: ReadonlySet<string> = new Set([
  "all_parts",
  "arena_id",
  "artist",
  "artist_ids",
  "attraction_lights",
  "booster",
  "border_color",
  "card_back_id",
  "card_faces",
  "cardmarket_id",
  "cmc",
  "collector_number",
  "color_identity",
  "color_indicator",
  "colors",
  "content_warning",
  "defense",
  "digital",
  "edhrec_rank",
  "finishes",
  "flavor_name",
  "flavor_text",
  "foil",
  "frame",
  "frame_effects",
  "full_art",
  "game_changer",
  "games",
  "hand_modifier",
  "highres_image",
  "id",
  "illustration_id",
  "image_status",
  "image_updated_at",
  "image_uris",
  "keywords",
  "lang",
  "layout",
  "legalities",
  "life_modifier",
  "loyalty",
  "mana_cost",
  "mtgo_foil_id",
  "mtgo_id",
  "multiverse_ids",
  "name",
  "nonfoil",
  "object",
  "oracle_id",
  "oracle_text",
  "oversized",
  "penny_rank",
  "power",
  "preview",
  "prices",
  "printed_name",
  "printed_text",
  "printed_type_line",
  "prints_search_uri",
  "produced_mana",
  "promo",
  "promo_types",
  "purchase_uris",
  "rarity",
  "related_uris",
  "released_at",
  "reprint",
  "reserved",
  "resource_id",
  "rulings_uri",
  "scryfall_set_uri",
  "scryfall_uri",
  "security_stamp",
  "set",
  "set_id",
  "set_name",
  "set_search_uri",
  "set_type",
  "set_uri",
  "story_spotlight",
  "tcgplayer_etched_id",
  "tcgplayer_id",
  "textless",
  "toughness",
  "type_line",
  "uri",
  "variation",
  "variation_of",
  "watermark",
]);

/** Every field of a ruling in the Rulings file of 2026-11-20 (80,928 lines). */
const RULING_FIELDS: ReadonlySet<string> = new Set([
  "comment",
  "object",
  "oracle_id",
  "published_at",
  "source",
]);

/**
 * The fields the loader keys a card on, present on every line of both card files of
 * 2026-11-20. `oracle_id` is checked on its own: see {@link hasOracleId}.
 */
const CARD_REQUIRED: readonly string[] = [
  "object",
  "id",
  "name",
  "layout",
  "lang",
  "set",
  "collector_number",
  "legalities",
];

/** Every field of a ruling is required: a ruling without one cannot be stored (I-67 3.1). */
const RULING_REQUIRED: readonly string[] = [...RULING_FIELDS];

/** The fields each file type knows and requires. */
interface FileFields {
  readonly known: ReadonlySet<string>;
  readonly required: readonly string[];
  readonly needsOracleIdOnCardOrFaces: boolean;
}

const FIELDS_BY_TYPE: Readonly<Record<BulkFileType, FileFields>> = {
  oracle_cards: {
    known: CARD_FIELDS,
    required: CARD_REQUIRED,
    needsOracleIdOnCardOrFaces: true,
  },
  default_cards: {
    known: CARD_FIELDS,
    required: CARD_REQUIRED,
    needsOracleIdOnCardOrFaces: true,
  },
  rulings: {
    known: RULING_FIELDS,
    required: RULING_REQUIRED,
    needsOracleIdOnCardOrFaces: false,
  },
};

/** A line that passed its guards: the object, and its fields the guards do not know. */
export interface ValidBulkLine {
  readonly kind: "valid";
  readonly object: BulkObject;
  readonly unknownFields: readonly string[];
}

/** One line to check, with its 1-based number and the file it belongs to. */
export interface BulkLineInput {
  readonly text: string;
  readonly line: number;
  readonly fileType: BulkFileType;
}

/** True when `value` holds `field` with a value other than null. */
function hasField(
  value: Readonly<Record<string, unknown>>,
  field: string
): boolean {
  return value[field] !== undefined && value[field] !== null;
}

/**
 * A card names its Oracle card at the top level, except a reversible card: its two faces are
 * separate Oracle cards, so each face carries its own `oracle_id` and the card carries none
 * (92 such lines in Default Cards of 2026-11-20, every face holding one).
 */
function hasOracleId(card: Readonly<Record<string, unknown>>): boolean {
  if (hasField(card, "oracle_id")) return true;
  const faces = card.card_faces;
  return (
    Array.isArray(faces) &&
    faces.length > 0 &&
    faces.every((face) => isRecord(face) && hasField(face, "oracle_id"))
  );
}

/** The first required field `object` lacks, or null. */
function missingField(
  object: Readonly<Record<string, unknown>>,
  fields: FileFields
): string | null {
  const missing = fields.required.find((field) => !hasField(object, field));
  if (missing !== undefined) return missing;
  if (fields.needsOracleIdOnCardOrFaces && !hasOracleId(object))
    return "oracle_id";
  return null;
}

/** Parses a line as JSON; undefined when it is not JSON. */
function parseLine(text: string): { readonly value: unknown } | undefined {
  try {
    return { value: JSON.parse(text) };
  } catch {
    return undefined;
  }
}

/**
 * Checks one line of a bulk file against its guards.
 *
 * @returns the object with its unknown top-level fields, or the problem that fails the file
 */
export function checkBulkLine({
  text,
  line,
  fileType,
}: BulkLineInput): ValidBulkLine | BulkLineProblem {
  const parsed = parseLine(text);
  if (parsed === undefined) return { kind: "malformed_json", line };
  const object = parsed.value;
  if (!isRecord(object)) return { kind: "not_an_object", line };

  const fields = FIELDS_BY_TYPE[fileType];
  const field = missingField(object, fields);
  if (field !== null) return { kind: "missing_field", line, field };

  const unknownFields = Object.keys(object).filter(
    (key) => !fields.known.has(key)
  );
  return { kind: "valid", object, unknownFields };
}
