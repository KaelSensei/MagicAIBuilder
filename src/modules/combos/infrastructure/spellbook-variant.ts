/**
 * The anti-corruption boundary with Commander Spellbook: the fields of its
 * `Variant` this app reads, and the mapping to the context's `Combo`.
 *
 * `find-my-combos.ts` parses Spellbook's answer with `spellbookVariantSchema`
 * and maps each included variant with `toCombo`; nothing outside
 * `infrastructure/` sees the wire shape (ADR 0004). The recorded answer in
 * `fixtures/find-my-combos-v1.ts` is the contract these fields are checked
 * against. Schema: https://backend.commanderspellbook.com/schema/ (`Variant`,
 * API 7.3.6, read 2026-11-09).
 *
 * @module combos/infrastructure/spellbook-variant
 */
import "server-only";
import { z } from "zod";
import type { Combo } from "@/modules/combos/domain/combo";

const namedSchema = z.object({ name: z.string() });

/** The fields of Spellbook's `Variant` this app reads; every one is required by its schema. */
export const spellbookVariantSchema = z.object({
  id: z.string(),
  uses: z.array(z.object({ card: namedSchema })),
  requires: z.array(z.object({ template: namedSchema })),
  produces: z.array(z.object({ feature: namedSchema })),
  description: z.string(),
  notes: z.string(),
  easyPrerequisites: z.string(),
  notablePrerequisites: z.string(),
  manaNeeded: z.string(),
});

/** Spellbook's wire shape for one combo variant. It stays inside `infrastructure/`. */
export type SpellbookVariant = z.infer<typeof spellbookVariantSchema>;

const INFINITE_KEYWORDS: readonly string[] = [
  "infinite",
  "unlimited",
  "win the game",
  "lose the game",
  "draw all",
  "kills all",
];

/**
 * Reads infinity from the names of the effects Spellbook says the combo
 * produces. A product heuristic (CONTEXT.md, "Infinite combo"): Spellbook's
 * features carry no infinite flag, so their names are matched, case
 * insensitively, against keywords for loops, game wins and board-wide results.
 * Bracket scoring counts the two-card combos flagged here
 * (`isTwoCardInfiniteCombo`), so a keyword change moves bracket estimates.
 */
function readsAsInfinite(effects: readonly string[]): boolean {
  return effects.some((effect) => {
    const lower = effect.toLowerCase();
    return INFINITE_KEYWORDS.some((keyword) => lower.includes(keyword));
  });
}

/** Spellbook writes one prerequisite per line. */
function prerequisiteLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/** Spellbook's steps when it wrote any, else its notes, else the effects joined. */
function comboDescription(
  variant: SpellbookVariant,
  effects: readonly string[]
): string {
  const written = [variant.description, variant.notes].find(
    (text) => text.trim().length > 0
  );
  return written ?? effects.join(" + ");
}

/**
 * Maps one Spellbook variant to the combo the app shows and scores.
 *
 * - `cards`: the named cards, in Spellbook's order.
 * - `prerequisites.otherPieces`: the generic templates Spellbook `requires`,
 *   each once.
 * - `prerequisites.conditions`: the notable prerequisites, then the easy ones,
 *   one per non-blank line, each once.
 * - `isInfinite`: see `readsAsInfinite`.
 *
 * @param variant - a variant Spellbook sent, already validated by `spellbookVariantSchema`
 */
export function toCombo(variant: SpellbookVariant): Combo {
  const effects = variant.produces.map((produced) => produced.feature.name);
  const conditions = new Set([
    ...prerequisiteLines(variant.notablePrerequisites),
    ...prerequisiteLines(variant.easyPrerequisites),
  ]);
  return {
    id: variant.id,
    cards: variant.uses.map((used) => used.card.name),
    effects,
    description: comboDescription(variant, effects),
    isInfinite: readsAsInfinite(effects),
    prerequisites: {
      otherPieces: [
        ...new Set(variant.requires.map((required) => required.template.name)),
      ],
      conditions: [...conditions],
      manaNeeded: variant.manaNeeded.trim(),
    },
  };
}
