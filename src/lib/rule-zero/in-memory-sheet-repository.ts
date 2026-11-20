/**
 * An in-memory Rule 0 sheet store for tests and for a process that has no
 * database. One sheet per deck. Insert and replace do not mutate the caller's
 * object: the store keeps its own copy.
 *
 * @module rule-zero/in-memory-sheet-repository
 */
import type { RuleZeroSheet } from "@/lib/rule-zero/sheet";
import type { RuleZeroSheetRepository } from "@/lib/rule-zero/sheet-repository";

/** @returns a repository that keeps sheets in a map for the life of the object. */
export function createInMemorySheetRepository(): RuleZeroSheetRepository {
  const byDeck = new Map<string, RuleZeroSheet>();

  return {
    async findByDeck(deckId) {
      const stored = byDeck.get(deckId);
      return stored === undefined ? undefined : copySheet(stored);
    },
    async insert(sheet) {
      if (byDeck.has(sheet.deckId)) return "already-exists";
      byDeck.set(sheet.deckId, copySheet(sheet));
      return "created";
    },
    async replace(sheet) {
      const stored = byDeck.get(sheet.deckId);
      if (
        stored === undefined ||
        stored.id !== sheet.id ||
        stored.ownerId !== sheet.ownerId
      ) {
        return "missing";
      }
      byDeck.set(sheet.deckId, copySheet(sheet));
      return "updated";
    },
  };
}

/** @returns a sheet whose draft arrays are not the caller's arrays. */
function copySheet(sheet: RuleZeroSheet): RuleZeroSheet {
  return {
    ...sheet,
    draft: {
      ...sheet.draft,
      winConditions: [...sheet.draft.winConditions],
    },
  };
}
