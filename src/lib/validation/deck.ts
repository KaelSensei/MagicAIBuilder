/** Zod schemas for deck requests: card ids, pairing types, and the patch body. */
import { z } from "zod";
import { ALL_FORMATS } from "@/lib/deck/formats";
import { PAIRING_TYPES } from "@/lib/deck/types";

/**
 * Card ID accepted for commander and partner slots: any non-blank string.
 * Callers add `.nullable()` so `null` still clears a slot.
 */
export const deckCardIdSchema = z
  .string()
  .refine((id) => id.trim().length > 0, { message: "Card ID must not be blank" });

/**
 * How the commander pairs with a second command-zone card: one of the deck domain's
 * `PAIRING_TYPES` (CR 702.124). The OpenAPI document lists its options in the same order.
 */
export const pairingTypeSchema = z.enum(PAIRING_TYPES);

/**
 * The deck fields that make up the command zone. They change only through
 * `PATCH /api/decks/[id]/command-zone`, which writes them with their card rows
 * in one versioned transaction (#1444); the deck metadata PATCH refuses them.
 */
export const COMMAND_ZONE_FIELDS = [
  "commanderId",
  "commanderName",
  "partnerId",
  "companionId",
  "pairingType",
] as const;

/** The route that owns the command zone, as the refusal names it. */
const COMMAND_ZONE_ROUTE = "PATCH /api/decks/[id]/command-zone";

/**
 * The command-zone fields a deck metadata PATCH body carries, in the order of
 * `COMMAND_ZONE_FIELDS`. A key set to `null` counts: it would clear a slot.
 *
 * @param body - The parsed JSON body, before validation.
 * @returns The field names present; empty when the body stays on metadata.
 */
export function commandZoneFieldsIn(body: unknown): readonly string[] {
  if (typeof body !== "object" || body === null) return [];
  return COMMAND_ZONE_FIELDS.filter((field) => field in body);
}

/**
 * The 400 `error` text for a deck metadata PATCH that carries command-zone
 * fields. It names the fields and the route to use, so a stale client learns
 * why its save was refused instead of seeing the keys silently dropped.
 *
 * @param fields - The command-zone fields found, from {@link commandZoneFieldsIn}; at least one.
 */
export function commandZoneFieldsRefusal(fields: readonly string[]): string {
  const verb = fields.length === 1 ? "is" : "are";
  return `${fields.join(", ")} ${verb} not accepted here: change the command zone through ${COMMAND_ZONE_ROUTE}`;
}

/**
 * Body of `PATCH /api/decks/[id]`: the deck's metadata. The command-zone
 * fields are not part of it (see {@link COMMAND_ZONE_FIELDS}); a body that
 * carries one is refused before parsing, and an unknown key is dropped.
 */
export const patchDeckSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  format: z.enum(ALL_FORMATS).optional(),
  targetBracket: z.number().int().min(1).max(5).optional(),
  manualBracket: z.number().int().min(1).max(5).nullable().optional(),
  budget: z.number().positive().nullable().optional(),
  isAIGenerated: z.boolean().optional(),
  description: z.string().max(2000).nullable().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  isPublic: z.boolean().optional(),
  seekingFeedback: z.boolean().optional(),
  feedbackQuestion: z.string().max(240).nullable().optional(),
}).refine(
  (fields) =>
    fields.seekingFeedback !== true || Boolean(fields.feedbackQuestion?.trim()),
  { message: "A feedback question is required when seeking feedback", path: ["feedbackQuestion"] }
);

export type PatchDeckInput = z.infer<typeof patchDeckSchema>;
