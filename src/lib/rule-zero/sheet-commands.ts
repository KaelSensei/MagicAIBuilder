/**
 * Create, read and edit one deck's private Rule 0 sheet (I-15 slice 1).
 *
 * The sheet stays with its owner. A caller who does not own it gets the same
 * answer as a deck with no sheet, so a read never reveals that one exists.
 * Nothing here shares the sheet or fills a field from the deck list.
 *
 * @module rule-zero/sheet-commands
 */
import type { RuleZeroSheetRepository } from "@/lib/rule-zero/sheet-repository";
import {
  parseSheetDraft,
  type RuleZeroSheet,
  type SheetDraftProblem,
} from "@/lib/rule-zero/sheet";

export type { RuleZeroSheet } from "@/lib/rule-zero/sheet";

/** How a use case learns the time and the next id. Tests pass fixed ones. */
export interface SheetClock {
  /** @returns a new sheet id */
  readonly nextId: () => string;
  /** @returns the current instant as an ISO-8601 string */
  readonly now: () => string;
}

/** Why a create or edit did not store a sheet. */
export type SheetCommandProblem = SheetDraftProblem | "owner";

/** The sheet, or the same answer a missing sheet gets. */
export type ReadSheetResult =
  | { readonly kind: "sheet"; readonly sheet: RuleZeroSheet }
  | { readonly kind: "none" };

/** A stored sheet, or why it was not created. */
export type CreateSheetResult =
  | { readonly kind: "created"; readonly sheet: RuleZeroSheet }
  | { readonly kind: "invalid"; readonly problem: SheetCommandProblem }
  | { readonly kind: "already-exists" };

/** The edited sheet, or why the edit was not stored. */
export type UpdateSheetResult =
  | { readonly kind: "updated"; readonly sheet: RuleZeroSheet }
  | { readonly kind: "invalid"; readonly problem: SheetCommandProblem }
  | { readonly kind: "missing" };

/**
 * The owner's sheet for one deck, or `none` when there is nothing that caller
 * may see.
 *
 * @param sheets - where sheets are stored
 * @param ownerId - the signed-in player
 * @param deckId - the deck the sheet is about
 */
export async function readRuleZeroSheet(
  sheets: RuleZeroSheetRepository,
  ownerId: string,
  deckId: string
): Promise<ReadSheetResult> {
  const stored = await sheets.findByDeck(deckId);
  if (stored === undefined || stored.ownerId !== ownerId)
    return { kind: "none" };
  return { kind: "sheet", sheet: stored };
}

/**
 * Store the first sheet for a deck. A second create does not overwrite it.
 *
 * @param command - the store, the clock, the owner, the deck and the untrusted fields
 */
export async function createRuleZeroSheet(command: {
  readonly sheets: RuleZeroSheetRepository;
  readonly clock: SheetClock;
  readonly ownerId: string;
  readonly deckId: string;
  readonly input: unknown;
}): Promise<CreateSheetResult> {
  const { sheets, clock, ownerId, deckId, input } = command;
  if (ownerId.length === 0 || deckId.length === 0)
    return { kind: "invalid", problem: "owner" };
  const parsed = parseSheetDraft(input);
  if (!parsed.ok) return { kind: "invalid", problem: parsed.problem };

  const existing = await sheets.findByDeck(deckId);
  if (existing !== undefined) return { kind: "already-exists" };

  const instant = clock.now();
  const sheet: RuleZeroSheet = {
    id: clock.nextId(),
    ownerId,
    deckId,
    draft: parsed.draft,
    createdAt: instant,
    updatedAt: instant,
  };
  const stored = await sheets.insert(sheet);
  if (stored === "already-exists") return { kind: "already-exists" };
  return { kind: "created", sheet };
}

/**
 * Replace the declared fields of the owner's sheet. Another player's sheet
 * and a deck with no sheet both answer `missing`, and neither is written.
 *
 * @param command - the store, the clock, the owner, the deck and the untrusted fields
 */
export async function updateRuleZeroSheet(command: {
  readonly sheets: RuleZeroSheetRepository;
  readonly clock: SheetClock;
  readonly ownerId: string;
  readonly deckId: string;
  readonly input: unknown;
}): Promise<UpdateSheetResult> {
  const { sheets, clock, ownerId, deckId, input } = command;
  if (ownerId.length === 0) return { kind: "invalid", problem: "owner" };
  const parsed = parseSheetDraft(input);
  if (!parsed.ok) return { kind: "invalid", problem: parsed.problem };

  const existing = await sheets.findByDeck(deckId);
  if (existing === undefined || existing.ownerId !== ownerId)
    return { kind: "missing" };

  const sheet: RuleZeroSheet = {
    ...existing,
    draft: parsed.draft,
    updatedAt: clock.now(),
  };
  const stored = await sheets.replace(sheet);
  if (stored === "missing") return { kind: "missing" };
  return { kind: "updated", sheet };
}
