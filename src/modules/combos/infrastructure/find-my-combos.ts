// Server side of combo detection: one Commander Spellbook "find my combos" call per deck.
import "server-only";
import { z } from "zod";
import { USER_AGENT } from "@/lib/http";
import type { DeckComboQuery } from "@/modules/combos/domain/deck-query";
import type { SpellbookVariant } from "@/modules/combos/client/api";

/**
 * Spellbook's deck-level endpoint. It takes the whole list and sorts the combos
 * it knows into those the deck holds (`included`) and those it nearly holds.
 * Schema: https://backend.commanderspellbook.com/schema/ (`find_my_combos_create`).
 */
export const SPELLBOOK_FIND_MY_COMBOS_URL =
  "https://backend.commanderspellbook.com/find-my-combos";

/** Longest wait for Spellbook; below the browser's own 15 s so the route answers first. */
export const SPELLBOOK_TIMEOUT_MS = 10_000;

const namedSchema = z.object({ name: z.string() });

/** The fields of Spellbook's `Variant` this app reads; every one is required by its schema. */
const upstreamVariantSchema = z.object({
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

type UpstreamVariant = z.infer<typeof upstreamVariantSchema>;

const findMyCombosResponseSchema = z.object({
  results: z.object({ included: z.array(upstreamVariantSchema) }),
});

const INFINITE_KEYWORDS: readonly string[] = [
  "infinite",
  "unlimited",
  "win the game",
  "lose the game",
  "draw all",
  "kills all",
];

/** Reads infinity from effect names; bracket scoring counts two-card combos flagged here. */
function isInfiniteCombo(effects: readonly string[]): boolean {
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

function comboDescription(
  raw: UpstreamVariant,
  effects: readonly string[]
): string {
  const written = [raw.description, raw.notes].find(
    (text) => text.trim().length > 0
  );
  return written ?? effects.join(" + ");
}

function toSpellbookVariant(raw: UpstreamVariant): SpellbookVariant {
  const effects = raw.produces.map((produced) => produced.feature.name);
  const conditions = new Set([
    ...prerequisiteLines(raw.notablePrerequisites),
    ...prerequisiteLines(raw.easyPrerequisites),
  ]);
  return {
    id: raw.id,
    cards: raw.uses.map((used) => used.card.name),
    effects,
    description: comboDescription(raw, effects),
    isInfinite: isInfiniteCombo(effects),
    prerequisites: {
      otherPieces: [
        ...new Set(raw.requires.map((required) => required.template.name)),
      ],
      conditions: [...conditions],
      manaNeeded: raw.manaNeeded.trim(),
    },
  };
}

/** Infinite combos first, then the ones that need fewer cards. */
function byInfiniteThenSize(a: SpellbookVariant, b: SpellbookVariant): number {
  if (a.isInfinite !== b.isInfinite) return a.isInfinite ? -1 : 1;
  return a.cards.length - b.cards.length;
}

/**
 * Maps a `find-my-combos` response to the combos the deck holds.
 *
 * Only `included` is read: the "almost included" buckets are combos the deck
 * lacks a card for, and showing them as found would be wrong.
 *
 * @param payload - the parsed JSON body Spellbook answered with
 * @returns the deck's combos, infinite ones first, or null when the body has another shape
 */
export function parseFindMyCombos(payload: unknown): SpellbookVariant[] | null {
  const parsed = findMyCombosResponseSchema.safeParse(payload);
  if (!parsed.success) return null;
  return parsed.data.results.included
    .map(toSpellbookVariant)
    .toSorted(byInfiniteThenSize);
}

/** What one Spellbook call came to. */
export type DeckCombosResult =
  | { readonly kind: "found"; readonly combos: readonly SpellbookVariant[] }
  | { readonly kind: "timeout" }
  | { readonly kind: "unexpected-body" }
  | { readonly kind: "failed"; readonly status: number | null };

function toDeckRequest(query: DeckComboQuery) {
  return {
    commanders: query.commanders.map((card) => ({ card })),
    main: query.main.map((card) => ({ card })),
  };
}

function isTimeout(error: unknown): boolean {
  return error instanceof DOMException && error.name === "TimeoutError";
}

/**
 * Asks Commander Spellbook which combos one deck holds, in a single call.
 * Never throws: a timeout, an error status or an unexpected body is a result.
 *
 * @param query - the deck's card list, already in canonical form
 * @returns the combos found, or why there are none to show
 */
export async function requestDeckCombos(
  query: DeckComboQuery
): Promise<DeckCombosResult> {
  try {
    const response = await fetch(SPELLBOOK_FIND_MY_COMBOS_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
      },
      body: JSON.stringify(toDeckRequest(query)),
      signal: AbortSignal.timeout(SPELLBOOK_TIMEOUT_MS),
    });
    if (!response.ok) return { kind: "failed", status: response.status };

    const combos = parseFindMyCombos(await response.json());
    return combos ? { kind: "found", combos } : { kind: "unexpected-body" };
  } catch (error) {
    return isTimeout(error)
      ? { kind: "timeout" }
      : { kind: "failed", status: null };
  }
}
