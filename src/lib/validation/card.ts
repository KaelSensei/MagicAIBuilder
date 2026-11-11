import { z } from "zod";
import { deckCardIdSchema, pairingTypeSchema } from "./deck";

export const VALID_CATEGORIES = [
  "commander",
  "companion",
  "creature",
  "instant",
  "sorcery",
  "artifact",
  "enchantment",
  "planeswalker",
  "land",
  "ramp",
  "draw",
  "removal",
  "boardWipe",
  "winCondition",
  "protection",
  "other",
] as const;

export const VALID_ZONES = ["main", "sideboard", "maybeboard"] as const;

export const SCRYFALL_UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Schema for POST /api/decks/[id]/cards
export const addCardSchema = z.object({
  scryfallId: z.string().regex(SCRYFALL_UUID_REGEX, "Invalid Scryfall ID"),
  name: z
    .string()
    .min(1)
    .max(200)
    // Bounded quantifier prevents ReDoS: HTML tags are at most ~200 chars
    .transform((v) => v.replaceAll(/<[^>]{0,200}>/g, "").trim()),
  manaCost: z.string().max(100).optional().default(""),
  cmc: z.number().min(0).max(20).optional().default(0),
  typeLine: z.string().max(300).optional().default(""),
  oracleText: z.string().max(2000).optional().default(""),
  power: z
    .string()
    .max(20)
    .optional()
    .nullable()
    .default(null)
    .transform((v) => (v ? v.replaceAll(/<[^>]{0,200}>/g, "").trim() : null)),
  toughness: z
    .string()
    .max(20)
    .optional()
    .nullable()
    .default(null)
    .transform((v) => (v ? v.replaceAll(/<[^>]{0,200}>/g, "").trim() : null)),
  colorIdentity: z.array(z.enum(["W", "U", "B", "R", "G", "C"])).optional().default([]),
  isGameChanger: z.boolean().optional().default(false),
  isBanned: z.boolean().optional().default(false),
  price: z.number().min(0).max(100000).nullable().optional().default(null),
  imageUri: z.url().max(500).optional().default(""),
  artCropUri: z.url().max(500).optional().default(""),
  category: z.enum(VALID_CATEGORIES).optional().default("other"),
  quantity: z.number().int().min(1).max(99).optional().default(1),
  isCommander: z.boolean().optional().default(false),
  isPartner: z.boolean().optional().default(false),
  zone: z.enum(VALID_ZONES).optional().default("main"),
});

export type AddCardInput = z.infer<typeof addCardSchema>;

/**
 * Longest private note a player may keep on one deck card, in UTF-16 code
 * units. It matches the `maxLength` of the note editor's textarea
 * (`CardNoteInline`), so the server never rejects what the editor let through.
 */
export const MAX_CARD_NOTES_LENGTH = 1000;

/**
 * Body of PATCH /api/decks/[id]/cards/[cardId]. Each key is optional and the
 * route writes exactly the keys present. Zod drops unlisted keys without an
 * error, so a field the client sends must be listed here or it is silently
 * lost. `notes: null` clears the note.
 */
export const patchCardSchema = z.object({
  category: z.enum(VALID_CATEGORIES).optional(),
  zone: z.enum(VALID_ZONES).optional(),
  quantity: z.number().int().min(1).max(99).optional(),
  scryfallId: z.string().regex(SCRYFALL_UUID_REGEX, "Invalid Scryfall ID").optional(),
  imageUri: z.url().max(500).optional(),
  artCropUri: z.url().max(500).optional(),
  notes: z.string().max(MAX_CARD_NOTES_LENGTH).nullable().optional(),
});

export type PatchCardInput = z.infer<typeof patchCardSchema>;

/** Most rows one bulk edit may touch: the text parser reads at most 500 lines. */
export const MAX_BULK_CARD_CHANGES = 500;

/** A deck row id as the database generates it. */
const deckCardRowIdSchema = z.string().min(1).max(64);

// Schema for PATCH /api/decks/[id]/cards — one bulk edit, applied atomically
export const deckCardChangesSchema = z.object({
  removeCardIds: z.array(deckCardRowIdSchema).max(MAX_BULK_CARD_CHANGES),
  quantityChanges: z
    .array(
      z.object({
        cardId: deckCardRowIdSchema,
        quantity: z.number().int().min(1).max(99),
      })
    )
    .max(MAX_BULK_CARD_CHANGES),
  addCards: z.array(addCardSchema).max(MAX_BULK_CARD_CHANGES),
  /** Command-zone slots whose rows are removed, whichever rows hold them. */
  clearCommandSlots: z.array(z.enum(["commander", "partner", "companion"])).max(3).optional().default([]),
  /** The deck's command-zone fields, present only when the edit changes them. */
  commandZone: z
    .object({
      commanderId: deckCardIdSchema.nullable(),
      commanderName: z.string().max(200).nullable(),
      partnerId: deckCardIdSchema.nullable(),
      companionId: deckCardIdSchema.nullable(),
      pairingType: pairingTypeSchema,
    })
    .optional(),
});

export type DeckCardChangesInput = z.infer<typeof deckCardChangesSchema>;
