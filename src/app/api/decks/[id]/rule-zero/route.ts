/**
 * Private Rule 0 sheet for one deck (I-15 slice 1).
 *
 * `GET/POST/PATCH /api/decks/[id]/rule-zero`. Only the deck's owner. The body
 * is declared fields; a deck list in the body is ignored. The sheet is not
 * shared from this route.
 *
 * @module api/decks/[id]/rule-zero
 */
import { NextResponse } from "next/server";
import type { RouteParams } from "@/lib/api/route-kit";
import { requireDeckOwner } from "@/lib/auth/helpers";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";
import { createPrismaSheetRepository } from "@/lib/rule-zero/prisma-sheet-repository";
import {
  createRuleZeroSheet,
  readRuleZeroSheet,
  updateRuleZeroSheet,
  type CreateSheetResult,
  type ReadSheetResult,
  type SheetClock,
  type UpdateSheetResult,
} from "@/lib/rule-zero/sheet-commands";
import type { RuleZeroSheet } from "@/lib/rule-zero/sheet";

const sheets = createPrismaSheetRepository(prisma);

const clock: SheetClock = {
  nextId: () => crypto.randomUUID(),
  now: () => new Date().toISOString(),
};

/** The owner's sheet, or `{ sheet: null }` when they have not written one. */
export async function GET(_request: Request, context: RouteParams<"id">) {
  try {
    const { id: deckId } = await context.params;
    const ownership = await requireDeckOwner(deckId);
    if (ownership.error) return ownership.error;

    const result = await readRuleZeroSheet(sheets, ownership.userId, deckId);
    return NextResponse.json(readBody(result));
  } catch (error) {
    logger.error(
      error instanceof Error ? error.message : "unknown",
      "GET /api/decks/[id]/rule-zero"
    );
    return NextResponse.json(
      { error: "Failed to load the rule 0 sheet" },
      { status: 500 }
    );
  }
}

/** Create the deck's sheet. A second create answers 409 and changes nothing. */
export async function POST(request: Request, context: RouteParams<"id">) {
  try {
    const { id: deckId } = await context.params;
    const ownership = await requireDeckOwner(deckId);
    if (ownership.error) return ownership.error;

    const body: unknown = await request.json().catch(() => null);
    const result = await createRuleZeroSheet({
      sheets,
      clock,
      ownerId: ownership.userId,
      deckId,
      input: body,
    });
    return createResponse(result);
  } catch (error) {
    logger.error(
      error instanceof Error ? error.message : "unknown",
      "POST /api/decks/[id]/rule-zero"
    );
    return NextResponse.json(
      { error: "Failed to save the rule 0 sheet" },
      { status: 500 }
    );
  }
}

/** Replace the declared fields. Someone else's sheet answers 404. */
export async function PATCH(request: Request, context: RouteParams<"id">) {
  try {
    const { id: deckId } = await context.params;
    const ownership = await requireDeckOwner(deckId);
    if (ownership.error) return ownership.error;

    const body: unknown = await request.json().catch(() => null);
    const result = await updateRuleZeroSheet({
      sheets,
      clock,
      ownerId: ownership.userId,
      deckId,
      input: body,
    });
    return updateResponse(result);
  } catch (error) {
    logger.error(
      error instanceof Error ? error.message : "unknown",
      "PATCH /api/decks/[id]/rule-zero"
    );
    return NextResponse.json(
      { error: "Failed to save the rule 0 sheet" },
      { status: 500 }
    );
  }
}

/** @returns the JSON body of a read. */
function readBody(result: ReadSheetResult): {
  sheet: ReturnType<typeof sheetBody> | null;
} {
  return { sheet: result.kind === "sheet" ? sheetBody(result.sheet) : null };
}

/** @returns the HTTP answer for a create. */
function createResponse(result: CreateSheetResult): NextResponse {
  if (result.kind === "created") {
    return NextResponse.json(
      { sheet: sheetBody(result.sheet) },
      { status: 201 }
    );
  }
  if (result.kind === "already-exists") {
    return NextResponse.json(
      { error: "A rule 0 sheet already exists for this deck" },
      { status: 409 }
    );
  }
  return NextResponse.json({ error: "Invalid rule 0 sheet" }, { status: 400 });
}

/** @returns the HTTP answer for an edit. */
function updateResponse(result: UpdateSheetResult): NextResponse {
  if (result.kind === "updated")
    return NextResponse.json({ sheet: sheetBody(result.sheet) });
  if (result.kind === "missing") {
    return NextResponse.json(
      { error: "Rule 0 sheet not found" },
      { status: 404 }
    );
  }
  return NextResponse.json({ error: "Invalid rule 0 sheet" }, { status: 400 });
}

/** The declared fields a client may show. The owner id stays on the server. */
function sheetBody(sheet: RuleZeroSheet) {
  return {
    id: sheet.id,
    deckId: sheet.deckId,
    ...sheet.draft,
    createdAt: sheet.createdAt,
    updatedAt: sheet.updatedAt,
  };
}
