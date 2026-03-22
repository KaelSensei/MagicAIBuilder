import { z } from "zod";

// Schema for PATCH /api/decks/[id]
export const patchDeckSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  format: z.enum(["commander", "brawl"]).optional(),
  targetBracket: z.number().int().min(1).max(4).optional(),
  manualBracket: z.number().int().min(1).max(4).nullable().optional(),
  budget: z.number().positive().nullable().optional(),
  commanderId: z.string().nullable().optional(),
  partnerId: z.string().nullable().optional(),
  companionId: z.string().nullable().optional(),
  pairingType: z
    .enum(["none", "partner", "partner_with", "friends_forever", "background", "doctor"])
    .optional(),
  isAIGenerated: z.boolean().optional(),
  description: z.string().max(2000).nullable().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  shareEnabled: z.boolean().optional(),
  shareToken: z.string().nullable().optional(),
});

export type PatchDeckInput = z.infer<typeof patchDeckSchema>;

// Schema for POST /api/decks (create)
export const createDeckSchema = z.object({
  name: z.string().min(1).max(200),
  format: z.enum(["commander", "brawl"]).optional().default("commander"),
});

export type CreateDeckInput = z.infer<typeof createDeckSchema>;
