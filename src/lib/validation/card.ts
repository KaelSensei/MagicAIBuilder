/**
 * Zod schemas for the deck card routes: add, patch and delete one card, the bulk edit and the
 * command-zone change, with the deck version the writer read. Card categories come from the deck
 * domain's tuple.
 */
import { z } from "zod";
import { SCRYFALL_ID_PATTERN } from "@/lib/scryfall/scryfall-id";
import { deckCardIdSchema, pairingTypeSchema } from "./deck";
import { CARD_CATEGORIES } from "@/lib/deck/types";
import { COLOR_SYMBOLS } from "@/lib/mana/colors";

export const VALID_ZONES = ["main", "sideboard", "maybeboard"] as const;

// Schema for POST /api/decks/[id]/cards
export const addCardSchema = z.object({
  scryfallId: z.string().regex(SCRYFALL_ID_PATTERN, "Invalid Scryfall ID"),
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
  colorIdentity: z.array(z.enum(COLOR_SYMBOLS)).optional().default([]),
  isGameChanger: z.boolean().optional().default(false),
  isBanned: z.boolean().optional().default(false),
  price: z.number().min(0).max(100000).nullable().optional().default(null),
  imageUri: z.url().max(500).optional().default(""),
  artCropUri: z.url().max(500).optional().default(""),
  category: z.enum(CARD_CATEGORIES).optional().default("other"),
  quantity: z.number().int().min(1).max(99).optional().default(1),
  isCommander: z.boolean().optional().default(false),
  isPartner: z.boolean().optional().default(false),
  zone: z.enum(VALID_ZONES).optional().default("main"),
});

export type AddCardInput = z.infer<typeof addCardSchema>;

/**
 * A deck version as a writer read it (`Deck.version`). The upper bound is
 * PostgreSQL's INTEGER maximum, the column's type: a larger number could
 * never match and would make Prisma throw instead of answering 409.
 */
export const deckVersionSchema = z.number().int().min(0).max(2_147_483_647);

/**
 * The optimistic-lock field of a card write's JSON body. Optional, so clients
 * that predate the lock keep working: without it the write is not checked.
 */
const expectedVersionField = { expectedVersion: deckVersionSchema.optional() };

/** Body of POST /api/decks/[id]/cards: one card, and the version the writer read. */
export const addCardRequestSchema = addCardSchema.extend(expectedVersionField);

/**
 * Query string of the card DELETE routes: `?expectedVersion=<n>`, optional.
 *
 * Why the query and not a body: a DELETE body "has no generally defined
 * semantics" and some intermediaries reject it (RFC 9110 §9.3.5,
 * https://www.rfc-editor.org/rfc/rfc9110#section-9.3.5, read 2026-11-11).
 * Only plain decimal digits are accepted: `Number("")` is 0 and
 * `Number("1e3")` is 1000, neither of which a client meant.
 */
export const cardDeleteQuerySchema = z.object({
  expectedVersion: z
    .string()
    .regex(/^\d{1,10}$/, "Expected a non-negative whole number")
    .transform(Number)
    .pipe(deckVersionSchema)
    .optional(),
});

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
  category: z.enum(CARD_CATEGORIES).optional(),
  zone: z.enum(VALID_ZONES).optional(),
  quantity: z.number().int().min(1).max(99).optional(),
  scryfallId: z.string().regex(SCRYFALL_ID_PATTERN, "Invalid Scryfall ID").optional(),
  imageUri: z.url().max(500).optional(),
  artCropUri: z.url().max(500).optional(),
  notes: z.string().max(MAX_CARD_NOTES_LENGTH).nullable().optional(),
});

export type PatchCardInput = z.infer<typeof patchCardSchema>;

/** Body of PATCH /api/decks/[id]/cards/[cardId]: the columns, and the version the writer read. */
export const patchCardRequestSchema =
  patchCardSchema.extend(expectedVersionField);

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

/** The three command-zone slots, as the routes name them. */
export const commandSlotSchema = z.enum(["commander", "partner", "companion"]);

/**
 * Most rows one command-zone change may remove by id or add: one per slot.
 * A change clears whole slots by role, so it never needs more.
 */
export const MAX_COMMAND_ZONE_ROWS = 3;

/**
 * Body of PATCH /api/decks/[id]/command-zone: one command-zone change, applied atomically.
 * Every `commandZone` key is optional and the route writes exactly the keys present; `null`
 * empties a slot.
 */
export const commandZoneChangeSchema = z.object({
  /** Main-deck rows that leave with the change, such as a promoted card's row. */
  removeCardIds: z.array(deckCardRowIdSchema).max(MAX_COMMAND_ZONE_ROWS),
  /** Slots whose rows are removed, whichever rows hold them. */
  clearCommandSlots: z.array(commandSlotSchema).max(MAX_COMMAND_ZONE_ROWS),
  addCards: z.array(addCardSchema).max(MAX_COMMAND_ZONE_ROWS),
  commandZone: z.object({
    commanderId: deckCardIdSchema.nullable().optional(),
    commanderName: z.string().max(200).nullable().optional(),
    partnerId: deckCardIdSchema.nullable().optional(),
    companionId: deckCardIdSchema.nullable().optional(),
    pairingType: pairingTypeSchema.optional(),
  }),
  ...expectedVersionField,
});

export type CommandZoneChangeInput = z.infer<typeof commandZoneChangeSchema>;
