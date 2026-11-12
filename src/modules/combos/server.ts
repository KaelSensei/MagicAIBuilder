/**
 * Combos context: the server entry point and composition root (ADR 0002).
 *
 * The combo lookup as `POST /api/combos` uses it: `lookupDeckCombos`, wired
 * with the real adapters, so the route holds HTTP concerns only. The cache
 * (hashing with `node:crypto`), the Spellbook budget and the Spellbook call are
 * marked `server-only`, and so is this file: a client import of it fails the
 * build. The browser reaches the lookup through `client.ts` and the route.
 *
 * @module combos/server
 */
import "server-only";

import { makeLookupDeckCombos } from "@/modules/combos/application/lookup-deck-combos";
import { comboCache } from "@/modules/combos/infrastructure/combo-cache";
import { spellbookComboSource } from "@/modules/combos/infrastructure/find-my-combos";
import { spellbookBudget } from "@/modules/combos/infrastructure/spellbook-budget";

export type {
  LookupDeckCombos,
  LookupDeckCombosResult,
} from "@/modules/combos/application/lookup-deck-combos";
export type { DeckCombosFailure } from "@/modules/combos/application/ports";

/**
 * The lookup over the per-instance cache, the per-instance Spellbook budget
 * and Commander Spellbook's `find-my-combos`. One instance per server process,
 * like the stores behind it.
 */
export const lookupDeckCombos = makeLookupDeckCombos({
  cache: comboCache,
  budget: spellbookBudget,
  source: spellbookComboSource,
});
