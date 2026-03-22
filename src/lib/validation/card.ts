import { z } from "zod";

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
    .transform((v) => v.replace(/<[^>]*>/g, "").trim()),
  manaCost: z.string().max(100).optional().default(""),
  cmc: z.number().min(0).max(20).optional().default(0),
  typeLine: z.string().max(300).optional().default(""),
  oracleText: z.string().max(2000).optional().default(""),
  colorIdentity: z.array(z.enum(["W", "U", "B", "R", "G", "C"])).optional().default([]),
  isGameChanger: z.boolean().optional().default(false),
  isBanned: z.boolean().optional().default(false),
  price: z.number().min(0).max(100000).nullable().optional().default(null),
  imageUri: z.string().url().max(500).optional().default(""),
  artCropUri: z.string().url().max(500).optional().default(""),
  category: z.enum(VALID_CATEGORIES).optional().default("other"),
  quantity: z.number().int().min(1).max(99).optional().default(1),
  isCommander: z.boolean().optional().default(false),
  isPartner: z.boolean().optional().default(false),
  zone: z.enum(VALID_ZONES).optional().default("main"),
});

export type AddCardInput = z.infer<typeof addCardSchema>;

// Schema for PATCH /api/decks/[id]/cards/[cardId]
export const patchCardSchema = z.object({
  category: z.enum(VALID_CATEGORIES).optional(),
  zone: z.enum(VALID_ZONES).optional(),
});

export type PatchCardInput = z.infer<typeof patchCardSchema>;
