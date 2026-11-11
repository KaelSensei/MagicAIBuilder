/**
 * `/api/decks/[id]/cards`: the owner adds one card (POST), applies a bulk
 * edit (PATCH) or removes every card (DELETE).
 *
 * POST and DELETE go through the deck repository, which writes the card rows
 * and steps the deck's `version` in one transaction. They accept an optional
 * `expectedVersion` (POST: in the JSON body; DELETE: `?expectedVersion=`) and
 * answer 409 when another write landed since the client read the deck; their
 * success bodies carry the deck's new `version`. The bulk edit keeps its own
 * transaction and does not step the version yet.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  addCardRequestSchema,
  deckCardChangesSchema,
  type DeckCardChangesInput,
} from "@/lib/validation/card";
import { forEachSequential } from "@/lib/async/sequential";
import { requireDeckOwner } from "@/lib/auth/helpers";
import { logger } from "@/lib/logger";
import { readJsonBody } from "@/lib/api/json-body";
import {
  deckWriteResponse,
  readExpectedVersionQuery,
  staleDeckResponse,
} from "@/lib/api/versioned-deck-write";
import { duplicatesOtherCommandSlot } from "@/lib/deck/commander-pairing";
import { COMMAND_SLOT_ROWS } from "@/lib/deck/bulk-edit-command-zone";
import { deckRepository } from "@/lib/deck/deck-repository";

type Params = { params: Promise<{ id: string }> };

/**
 * A command-zone card must not repeat the Oracle card held by the opposite
 * slot: the partner is compared with the commander, the commander with the partner.
 */
async function duplicatesCommandPairing(
  deckId: string,
  card: { readonly scryfallId: string; readonly isCommander: boolean; readonly isPartner: boolean }
): Promise<boolean> {
  if (!card.isCommander) return false;
  const slots = await prisma.deck.findUnique({
    where: { id: deckId },
    select: { commanderId: true, partnerId: true },
  });
  const otherSlotId = card.isPartner ? slots?.commanderId : slots?.partnerId;
  return duplicatesOtherCommandSlot(card.scryfallId, otherSlotId ?? null);
}

// POST /api/decks/[id]/cards — add a card to a deck
export async function POST(request: Request, { params }: Params) {
  const { id: deckId } = await params;
  try {
    const ownership = await requireDeckOwner(deckId);
    if (ownership.error) return ownership.error;

    const jsonBody = await readJsonBody(request);

    if (!jsonBody.ok) return jsonBody.response;

    const raw = jsonBody.value;
    const parsed = addCardRequestSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: z.flattenError(parsed.error) },
        { status: 400 }
      );
    }

    // The schema is the allow-list: past `expectedVersion`, the parsed body is
    // exactly the card's columns.
    const { expectedVersion, ...card } = parsed.data;

    if (await duplicatesCommandPairing(deckId, card)) {
      return NextResponse.json(
        { error: "Commander and partner must be different cards" },
        { status: 400 }
      );
    }

    const result = await deckRepository.addCard(
      { deckId, expectedVersion },
      card
    );
    return deckWriteResponse(result, ({ value, version }) =>
      NextResponse.json({ ...value, version }, { status: 201 })
    );
  } catch (error) {
    logger.error(error instanceof Error ? error.message : "unknown", "POST /api/decks/:id/cards", { deckId: String(deckId).slice(0, 50) });
    return NextResponse.json(
      { error: "Failed to add card" },
      { status: 500 }
    );
  }
}

/**
 * The change set names a row this deck does not hold — it was edited from a
 * stale copy. Thrown inside the transaction so nothing already written stays.
 */
class StaleDeckCardsError extends Error {
  constructor() {
    super("The deck changed since it was opened");
    this.name = "StaleDeckCardsError";
  }
}

/**
 * Writes one bulk edit's row changes inside a transaction.
 *
 * @param tx - the transaction every write goes through
 * @param deckId - deck being edited
 * @param changes - validated row changes
 * @returns the deck with all its cards, as saved
 * @throws StaleDeckCardsError when a removed or resized row is not in this deck
 */
async function applyDeckCardChanges(
  tx: Prisma.TransactionClient,
  deckId: string,
  changes: DeckCardChangesInput
) {
  if (changes.removeCardIds.length > 0) {
    const removed = await tx.deckCard.deleteMany({
      where: { deckId, id: { in: [...changes.removeCardIds] } },
    });
    if (removed.count !== new Set(changes.removeCardIds).size) throw new StaleDeckCardsError();
  }
  // A slot is cleared by role: the editor may know a hand-picked commander only
  // by its printing id, and earlier picks can have left more than one row.
  await forEachSequential(changes.clearCommandSlots, (slot) =>
    tx.deckCard.deleteMany({ where: { deckId, ...COMMAND_SLOT_ROWS[slot] } })
  );
  await forEachSequential(changes.quantityChanges, async ({ cardId, quantity }) => {
    const resized = await tx.deckCard.updateMany({ where: { id: cardId, deckId }, data: { quantity } });
    if (resized.count !== 1) throw new StaleDeckCardsError();
  });
  if (changes.addCards.length > 0) {
    await tx.deckCard.createMany({
      data: changes.addCards.map((card) => ({ ...card, deckId })),
    });
  }
  return tx.deck.update({
    where: { id: deckId },
    data: { ...changes.commandZone, updatedAt: new Date() },
    include: { cards: true },
  });
}

// PATCH /api/decks/[id]/cards — apply a bulk edit: every row change or none
export async function PATCH(request: Request, { params }: Params) {
  const { id: deckId } = await params;
  try {
    const ownership = await requireDeckOwner(deckId);
    if (ownership.error) return ownership.error;

    const jsonBody = await readJsonBody(request);
    if (!jsonBody.ok) return jsonBody.response;

    const parsed = deckCardChangesSchema.safeParse(jsonBody.value);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: z.flattenError(parsed.error) },
        { status: 400 }
      );
    }

    const commandZone = parsed.data.commandZone;
    if (
      commandZone?.partnerId &&
      (await duplicatesOtherCommandSlot(commandZone.partnerId, commandZone.commanderId))
    ) {
      return NextResponse.json(
        { error: "Commander and partner must be different cards" },
        { status: 400 }
      );
    }

    const deck = await prisma.$transaction((tx) =>
      applyDeckCardChanges(tx, deckId, parsed.data)
    );
    return NextResponse.json(deck);
  } catch (error) {
    if (error instanceof StaleDeckCardsError) return staleDeckResponse();
    logger.error(error instanceof Error ? error.message : "unknown", "PATCH /api/decks/:id/cards", { deckId: String(deckId).slice(0, 50) });
    return NextResponse.json(
      { error: "Failed to save deck changes" },
      { status: 500 }
    );
  }
}

// DELETE /api/decks/[id]/cards — remove all cards from a deck
export async function DELETE(request: Request, { params }: Params) {
  const { id: deckId } = await params;
  try {
    const ownership = await requireDeckOwner(deckId);
    if (ownership.error) return ownership.error;

    const query = readExpectedVersionQuery(request);
    if (!query.ok) return query.response;

    const result = await deckRepository.removeAllCards({
      deckId,
      expectedVersion: query.expectedVersion,
    });
    return deckWriteResponse(result, ({ version }) =>
      NextResponse.json({ success: true, version })
    );
  } catch (error) {
    logger.error(error instanceof Error ? error.message : "unknown", "DELETE /api/decks/:id/cards", { deckId: String(deckId).slice(0, 50) });
    return NextResponse.json(
      { error: "Failed to remove cards" },
      { status: 500 }
    );
  }
}
