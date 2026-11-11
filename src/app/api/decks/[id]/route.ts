/**
 * GET, PATCH and DELETE of one deck the signed-in user owns. PATCH refuses a
 * command zone that holds one card twice or a pair CR 702.124 does not allow.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { patchDeckSchema, PatchDeckInput } from "@/lib/validation/deck";
import { requireAuth } from "@/lib/auth/helpers";
import { logger } from "@/lib/logger";
import { readJsonBody } from "@/lib/api/json-body";
import { commandPairProblem } from "@/lib/deck/commander-pairing";

type Params = { params: Promise<{ id: string }> };

// GET /api/decks/[id] — get a single deck (must own it)
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const result = await requireAuth();
    if (result.error) return result.error;

    const deck = await prisma.deck.findUnique({
      where: { id },
      include: { cards: true },
    });

    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    if (deck.userId !== result.session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(deck);
  } catch (error) {
    logger.error(error instanceof Error ? error.message : "unknown", "GET /api/decks/:id", { id: String(id).slice(0, 50) });
    return NextResponse.json(
      { error: "Failed to fetch deck" },
      { status: 500 }
    );
  }
}

function buildDeckPatchData(fields: PatchDeckInput) {
  const data: Record<string, unknown> = {};
  const keys = [
    "name", "format", "targetBracket", "manualBracket", "budget",
    "commanderId", "commanderName", "partnerId", "companionId", "pairingType",
    "isAIGenerated", "description", "tags", "isPublic", "seekingFeedback",
    "feedbackQuestion",
  ] as const;
  for (const key of keys) {
    if (fields[key] !== undefined) data[key] = fields[key];
  }
  return data;
}

function hasDuplicatePairing(
  fields: PatchDeckInput,
  existing: { commanderId: string | null; partnerId: string | null }
): boolean {
  if (fields.commanderId === undefined && fields.partnerId === undefined) return false;
  const commanderId = fields.commanderId !== undefined ? fields.commanderId : existing.commanderId;
  const partnerId = fields.partnerId !== undefined ? fields.partnerId : existing.partnerId;
  return Boolean(commanderId && commanderId === partnerId);
}

const PAIR_PROBLEM_MESSAGES = {
  sameCard: "Commander and partner must be different cards",
  unpairable: "Commander and partner cannot share the command zone",
} as const;

/**
 * Checks the command slots a patch leaves, when it changes either one.
 *
 * @param fields - the validated patch
 * @param existing - the slots the deck holds now
 * @returns the error to answer with, or null when the pair can be saved
 */
async function commandPairError(
  fields: PatchDeckInput,
  existing: { commanderId: string | null; partnerId: string | null }
): Promise<string | null> {
  if (fields.commanderId === undefined && fields.partnerId === undefined)
    return null;
  const commanderId =
    fields.commanderId !== undefined
      ? fields.commanderId
      : existing.commanderId;
  const partnerId =
    fields.partnerId !== undefined ? fields.partnerId : existing.partnerId;
  if (!commanderId || !partnerId) return null;
  const problem = await commandPairProblem(commanderId, partnerId);
  return problem ? PAIR_PROBLEM_MESSAGES[problem] : null;
}

// PATCH /api/decks/[id] — update deck metadata (must own it)
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const result = await requireAuth();
    if (result.error) return result.error;

    const jsonBody = await readJsonBody(request);

    if (!jsonBody.ok) return jsonBody.response;

    const raw = jsonBody.value;
    const parsed = patchDeckSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: z.flattenError(parsed.error) },
        { status: 400 }
      );
    }

    const existing = await prisma.deck.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    if (existing.userId !== result.session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (hasDuplicatePairing(parsed.data, existing)) {
      return NextResponse.json({ error: "Commander and partner must be different cards" }, { status: 400 });
    }
    const pairError = await commandPairError(parsed.data, existing);
    if (pairError) {
      return NextResponse.json({ error: pairError }, { status: 400 });
    }

    const updated = await prisma.deck.update({
      where: { id },
      data: buildDeckPatchData(parsed.data),
      include: { cards: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    logger.error(error instanceof Error ? error.message : "unknown", "PATCH /api/decks/:id", { id: String(id).slice(0, 50) });
    return NextResponse.json(
      { error: "Failed to update deck" },
      { status: 500 }
    );
  }
}

// DELETE /api/decks/[id] — delete a deck and all its cards (must own it)
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const result = await requireAuth();
    if (result.error) return result.error;

    const existing = await prisma.deck.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    if (existing.userId !== result.session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.deck.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error(error instanceof Error ? error.message : "unknown", "DELETE /api/decks/:id", { id: String(id).slice(0, 50) });
    return NextResponse.json(
      { error: "Failed to delete deck" },
      { status: 500 }
    );
  }
}
