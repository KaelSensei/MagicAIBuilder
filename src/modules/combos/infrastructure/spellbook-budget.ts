/**
 * The Spellbook budget: the `ComboSourceBudget` port over the shared in-memory
 * rate limiter, counting this server instance's calls to Commander Spellbook.
 *
 * An adapter of the combos context. The window and the limit come from
 * `domain/lookup-policy.ts`; the counter is per instance, like the cache, so
 * a cold instance starts with a full budget.
 *
 * @module combos/infrastructure/spellbook-budget
 */
import "server-only";
import { checkRateLimit } from "@/lib/rate-limit";
import type { ComboSourceBudget } from "@/modules/combos/application/ports";
import {
  COMBO_LOOKUP_WINDOW_MS,
  SPELLBOOK_CALLS_PER_WINDOW,
} from "@/modules/combos/domain/lookup-policy";

/**
 * Not under the route's `combos:` prefix, so no client address can share this
 * bucket with the per-client limit.
 */
const SPELLBOOK_BUDGET_KEY = "spellbook-upstream";

/** The budget `server.ts` wires into the lookup. */
export const spellbookBudget: ComboSourceBudget = {
  take: () =>
    checkRateLimit(
      SPELLBOOK_BUDGET_KEY,
      SPELLBOOK_CALLS_PER_WINDOW,
      COMBO_LOOKUP_WINDOW_MS
    ),
};
