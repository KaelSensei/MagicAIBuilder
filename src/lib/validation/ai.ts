import { z } from "zod";

// Sanitize user-provided strings before injecting them into AI prompts.
// Strips characters that could be used for prompt injection.
export function sanitizeForPrompt(input: string, maxLen = 100): string {
  return input
    .replaceAll(/[`'"\\{}[\]]/g, "") // strip quotes, backticks, brackets
    .replaceAll(/[\n\r]/g, " ") // no newlines
    .trim()
    .slice(0, maxLen);
}

// Schema for POST /api/ai/build
export const buildSchema = z.object({
  budget: z.number().positive().nullable().optional().default(null),
  colors: z.array(z.enum(["W", "U", "B", "R", "G", "C"])).min(1).max(6),
  strategy: z.string().min(1).max(50),
  bracket: z.number().int().min(1).max(5),
  commanderName: z.string().max(200).nullable().optional().default(null),
});

export type BuildInput = z.infer<typeof buildSchema>;
