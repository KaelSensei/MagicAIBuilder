/**
 * Prisma adapter for private Rule 0 sheets (I-15 slice 1).
 *
 * One row per deck. A unique violation on insert means the deck already has
 * a sheet; the row is left as it was. A stored row that is no longer a
 * declared sheet is a corrupt record and is refused rather than shown.
 *
 * @module rule-zero/prisma-sheet-repository
 */
import type { PrismaClient } from "@prisma/client";
import { isUniqueViolation } from "@/lib/db/prisma-errors";
import { parseSheetDraft, type RuleZeroSheet } from "@/lib/rule-zero/sheet";
import type { RuleZeroSheetRepository } from "@/lib/rule-zero/sheet-repository";

/** The Prisma client methods this adapter uses. */
type SheetClient = Pick<PrismaClient, "ruleZeroSheet">;

/** A row as Prisma returns it. */
type SheetRow = NonNullable<
  Awaited<ReturnType<SheetClient["ruleZeroSheet"]["findUnique"]>>
>;

/**
 * @param client - the application Prisma client
 * @returns the sheet repository backed by `RuleZeroSheet`
 */
export function createPrismaSheetRepository(
  client: SheetClient
): RuleZeroSheetRepository {
  return {
    async findByDeck(deckId) {
      const row = await client.ruleZeroSheet.findUnique({ where: { deckId } });
      return row === null ? undefined : sheetFromRow(row);
    },
    async insert(sheet) {
      try {
        await client.ruleZeroSheet.create({ data: rowFromSheet(sheet) });
        return "created";
      } catch (error) {
        if (isUniqueViolation(error)) return "already-exists";
        throw error;
      }
    },
    async replace(sheet) {
      const result = await client.ruleZeroSheet.updateMany({
        where: { id: sheet.id, deckId: sheet.deckId, ownerId: sheet.ownerId },
        data: rowFromSheet(sheet),
      });
      return result.count === 1 ? "updated" : "missing";
    },
  };
}

/** @returns the domain sheet, or throws when the row is not a declared sheet. */
function sheetFromRow(row: SheetRow): RuleZeroSheet {
  const parsed = parseSheetDraft({
    speed: row.speed,
    winConditions: row.winConditions,
    combos: { present: row.hasCombos, note: row.combosNote },
    extraTurns: { present: row.hasExtraTurns, note: row.extraTurnsNote },
    resourceDenial: {
      present: row.hasResourceDenial,
      note: row.resourceDenialNote,
    },
    proxyCount: row.proxyCount,
    houseRules: row.houseRules,
  });
  if (!parsed.ok) {
    throw new Error("Stored rule 0 sheet is not a declared sheet");
  }
  return {
    id: row.id,
    ownerId: row.ownerId,
    deckId: row.deckId,
    draft: parsed.draft,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** @returns the columns of a sheet, including the clock's timestamps. */
function rowFromSheet(sheet: RuleZeroSheet): {
  id: string;
  ownerId: string;
  deckId: string;
  speed: string;
  winConditions: string[];
  hasCombos: boolean;
  combosNote: string;
  hasExtraTurns: boolean;
  extraTurnsNote: string;
  hasResourceDenial: boolean;
  resourceDenialNote: string;
  proxyCount: number;
  houseRules: string;
  createdAt: Date;
  updatedAt: Date;
} {
  return {
    id: sheet.id,
    ownerId: sheet.ownerId,
    deckId: sheet.deckId,
    speed: sheet.draft.speed,
    winConditions: [...sheet.draft.winConditions],
    hasCombos: sheet.draft.combos.present,
    combosNote: sheet.draft.combos.note,
    hasExtraTurns: sheet.draft.extraTurns.present,
    extraTurnsNote: sheet.draft.extraTurns.note,
    hasResourceDenial: sheet.draft.resourceDenial.present,
    resourceDenialNote: sheet.draft.resourceDenial.note,
    proxyCount: sheet.draft.proxyCount,
    houseRules: sheet.draft.houseRules,
    createdAt: new Date(sheet.createdAt),
    updatedAt: new Date(sheet.updatedAt),
  };
}
