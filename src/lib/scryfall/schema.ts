/**
 * The Zod schema of the Scryfall card JSON the app reads: the wire side of the
 * Scryfall anti-corruption layer.
 *
 * Card catalog context, infrastructure side (ADR 0004). It declares only the
 * fields `toCatalogCard` maps (`catalog-card.ts` lists why each is there);
 * Zod drops every other key. It normalises absence: an optional field Scryfall
 * omits or sends as null comes out as `null`, an optional list as `[]`.
 *
 * Shapes and optionality follow https://scryfall.com/docs/api/cards (read
 * 2026-11-11), checked against the answers recorded in
 * `fixtures/catalog-cards-v1.ts`.
 *
 * Not responsible for: the shape checks of cached answers (`guards.ts`), which
 * the browser and the cache routes still use.
 *
 * @module scryfall/schema
 */
import { z } from "zod";
import { CARD_COLORS } from "./catalog-card";

/** A text field some cards lack: `string | null` once parsed. */
const optionalText = z
  .string()
  .nullish()
  .transform((value) => value ?? null);

/**
 * An `image_uris` object: the WebP versions Scryfall added on 2026-10-14 and
 * the JPEG-era keys that card JSON cached before then carries instead.
 */
const imageUrisSchema = z.object({
  thumb: z.string().optional(),
  grid: z.string().optional(),
  display: z.string().optional(),
  crop: z.string().optional(),
  art: z.string().optional(),
  jpeg: z.string().optional(),
  small: z.string().optional(),
  normal: z.string().optional(),
  large: z.string().optional(),
  png: z.string().optional(),
  art_crop: z.string().optional(),
  border_crop: z.string().optional(),
});

/** One entry of `card_faces`. Only `name` is always present on a face. */
const cardFaceSchema = z.object({
  name: z.string(),
  mana_cost: optionalText,
  type_line: optionalText,
  oracle_text: optionalText,
  power: optionalText,
  toughness: optionalText,
  image_uris: imageUrisSchema.nullish(),
  printed_name: optionalText,
  printed_type_line: optionalText,
  printed_text: optionalText,
});

/** A Scryfall card object, reduced to the fields the app reads. */
export const scryfallCardSchema = z.object({
  id: z.guid(),
  oracle_id: optionalText,
  name: z.string(),
  layout: z.string(),
  lang: z.string(),
  mana_cost: optionalText,
  // The documentation lists `cmc` and `type_line` as always present, but a
  // reversible card omits both and keeps them on its faces (recorded
  // 2026-11-11, `fixtures/catalog-cards-v1.ts`).
  cmc: z
    .number()
    .nullish()
    .transform((value) => value ?? null),
  type_line: optionalText,
  oracle_text: optionalText,
  color_identity: z.array(z.enum(CARD_COLORS)),
  power: optionalText,
  toughness: optionalText,
  keywords: z
    .array(z.string())
    .nullish()
    .transform((value) => value ?? []),
  // Statuses stay strings here: one Scryfall adds later must not refuse the
  // whole card. The mapper keeps the statuses it knows.
  legalities: z.record(z.string(), z.string()),
  prices: z.object({ usd: optionalText }).nullish(),
  set: z.string(),
  set_name: z.string(),
  image_uris: imageUrisSchema.nullish(),
  card_faces: z
    .array(cardFaceSchema)
    .nullish()
    .transform((value) => value ?? []),
  printed_name: optionalText,
  printed_type_line: optionalText,
  printed_text: optionalText,
});

/** A Scryfall card as `scryfallCardSchema` hands it over. */
export type ParsedScryfallCard = z.output<typeof scryfallCardSchema>;

/** A card face as `scryfallCardSchema` hands it over. */
export type ParsedScryfallCardFace = ParsedScryfallCard["card_faces"][number];

/** An `image_uris` object as `scryfallCardSchema` hands it over. */
export type ParsedImageUris = z.output<typeof imageUrisSchema>;
