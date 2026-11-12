/**
 * `/api/decks/[id]/cards`: the owner adds one card (POST), applies a bulk
 * edit (PATCH) or removes every card (DELETE).
 *
 * All three go through the deck repository, which writes the card rows and
 * steps the deck's `version` in one transaction. They accept an optional
 * `expectedVersion` (POST and PATCH: in the JSON body; DELETE:
 * `?expectedVersion=`) and answer 409 when another write landed since the
 * client read the deck; their success bodies carry the deck's new `version`.
 * The bulk edit also answers 409 when it names a row the deck no longer
 * holds: the list was edited from an outdated copy.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import {
  addCardRequestSchema,
  deckCardChangesSchema,
} from "@/lib/validation/card";
import { requireDeckOwner } from "@/lib/auth/helpers";
import { logger } from "@/lib/logger";
import { readJsonBody } from "@/lib/api/json-body";
import {
  deckWriteResponse,
  readExpectedVersionQuery,
} from "@/lib/api/versioned-deck-write";
import {
  commandPairRefusal,
  duplicatesOtherCommandSlot,
  type CommandSlotIds,
} from "@/lib/deck/commander-pairing";
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
 * The stored slots `commandPairRefusal` would fall back on. A bulk edit
 * names every slot in `commandZone` (the schema makes each key required), so
 * no stored slot is ever read and the deck needs no extra lookup.
 */
const NO_STORED_SLOTS: CommandSlotIds = { commanderId: null, partnerId: null };

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

    const {
      expectedVersion,
      commandZone,
      removeCardIds,
      quantityChanges,
      addCards,
      clearCommandSlots,
    } = parsed.data;

    // The same pair rules as PATCH …/command-zone (CR 903.5b, CR 702.124); an
    // edit that leaves the command zone alone is not judged.
    const refusal = commandZone
      ? await commandPairRefusal(commandZone, NO_STORED_SLOTS)
      : null;
    if (refusal) return NextResponse.json({ error: refusal }, { status: 400 });

    const result = await deckRepository.applyBulkEdit(
      { deckId, expectedVersion },
      {
        removeCardIds,
        quantityChanges,
        addCards,
        clearSlots: clearCommandSlots,
        fields: commandZone ?? {},
      }
    );
    return deckWriteResponse(result, async ({ value, version }) => {
      // The body is the deck as GET answers it. The rows and the version come
      // from the write's transaction, so they agree; the deck's other columns
      // are not versioned and are read after it.
      const deck = await prisma.deck.findUnique({ where: { id: deckId } });
      return NextResponse.json({ ...deck, cards: value, version });
    });
  } catch (error) {
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
