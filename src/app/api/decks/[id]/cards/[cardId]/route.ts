/**
 * `/api/decks/[id]/cards/[cardId]`: the owner edits (PATCH) or removes
 * (DELETE) one card row of their deck.
 *
 * Both go through the deck repository, which writes the row and steps the
 * deck's `version` in one transaction. Both accept an optional
 * `expectedVersion` (PATCH: in the JSON body; DELETE: `?expectedVersion=`)
 * and answer 409 when another write landed since the client read the deck;
 * their success bodies carry the deck's new `version`.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { patchCardRequestSchema } from "@/lib/validation/card";
import { requireDeckOwner } from "@/lib/auth/helpers";
import { logger } from "@/lib/logger";
import { readJsonBody } from "@/lib/api/json-body";
import {
  deckWriteResponse,
  readExpectedVersionQuery,
} from "@/lib/api/versioned-deck-write";
import { deckRepository } from "@/lib/deck/deck-repository";

type Params = { params: Promise<{ id: string; cardId: string }> };

// DELETE /api/decks/[id]/cards/[cardId] — remove a single card
export async function DELETE(request: Request, { params }: Params) {
  const { id: deckId, cardId } = await params;
  try {
    const ownership = await requireDeckOwner(deckId);
    if (ownership.error) return ownership.error;

    const card = await prisma.deckCard.findFirst({
      where: { id: cardId, deckId },
    });

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const query = readExpectedVersionQuery(request);
    if (!query.ok) return query.response;

    const result = await deckRepository.removeCard(
      { deckId, expectedVersion: query.expectedVersion },
      cardId
    );
    return deckWriteResponse(result, ({ version }) =>
      NextResponse.json({ success: true, version })
    );
  } catch (error) {
    logger.error(error instanceof Error ? error.message : "unknown", "DELETE /api/decks/:id/cards/:cardId", { deckId: String(deckId).slice(0, 50), cardId: String(cardId).slice(0, 50) });
    return NextResponse.json(
      { error: "Failed to remove card" },
      { status: 500 }
    );
  }
}

// PATCH /api/decks/[id]/cards/[cardId] — edit one row: category, zone, quantity, printing or note
export async function PATCH(request: Request, { params }: Params) {
  const { id: deckId, cardId } = await params;
  try {
    const ownership = await requireDeckOwner(deckId);
    if (ownership.error) return ownership.error;

    const card = await prisma.deckCard.findFirst({
      where: { id: cardId, deckId },
    });

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const jsonBody = await readJsonBody(request);

    if (!jsonBody.ok) return jsonBody.response;

    const raw = jsonBody.value;
    const parsed = patchCardRequestSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: z.flattenError(parsed.error) },
        { status: 400 }
      );
    }

    // The schema is the allow-list: it drops unknown keys and leaves absent
    // ones out, so past `expectedVersion` the parsed body is exactly the
    // columns to write.
    const { expectedVersion, ...edit } = parsed.data;
    const result = await deckRepository.editCard(
      { deckId, expectedVersion },
      cardId,
      edit
    );
    return deckWriteResponse(result, ({ value, version }) =>
      NextResponse.json({ ...value, version })
    );
  } catch (error) {
    logger.error(error instanceof Error ? error.message : "unknown", "PATCH /api/decks/:id/cards/:cardId", { deckId: String(deckId).slice(0, 50), cardId: String(cardId).slice(0, 50) });
    return NextResponse.json(
      { error: "Failed to update card" },
      { status: 500 }
    );
  }
}
