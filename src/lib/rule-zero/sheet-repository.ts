/**
 * Where a Rule 0 sheet is stored (I-15 slice 1).
 *
 * The port the create, read and edit use cases call. The in-memory fake and
 * the Prisma adapter both honour it. A sheet is one per deck.
 *
 * @module rule-zero/sheet-repository
 */
import type { RuleZeroSheet } from "@/lib/rule-zero/sheet";

/** Persistence for private per-deck Rule 0 sheets. */
export interface RuleZeroSheetRepository {
  /**
   * The sheet stored for a deck, whoever owns it.
   * Callers hide a sheet whose owner is not the reader.
   *
   * @param deckId - the deck
   * @returns the sheet, or undefined when the deck has none
   */
  findByDeck(deckId: string): Promise<RuleZeroSheet | undefined>;
  /**
   * Store a sheet. `already-exists` when the deck already has one; the
   * stored row is left as it was.
   *
   * @param sheet - a new sheet
   */
  insert(sheet: RuleZeroSheet): Promise<"created" | "already-exists">;
  /**
   * Replace the owner's sheet. `missing` when that id is not theirs.
   *
   * @param sheet - the sheet with its new declared fields
   */
  replace(sheet: RuleZeroSheet): Promise<"updated" | "missing">;
}
