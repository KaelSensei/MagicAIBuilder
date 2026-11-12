/**
 * `PATCH /api/decks/[id]/command-zone`: the owner changes the command zone
 * (commander, partner, companion) in one request.
 *
 * The browser used to send such a change as separate writes (the deck fields,
 * the new row, the old row's delete); a failure between them left the deck
 * half-changed. This route hands the whole change to the deck repository,
 * which writes the rows and the fields in one transaction and steps the
 * deck's `version`. It accepts an optional `expectedVersion` and answers 409
 * when another write landed since the client read the deck. The success body
 * is `{ cards, version }`: the rows the change added, and the deck's new
 * version.
 *
 * A pair the rules refuse (the same card twice, CR 903.5b; no shared partner
 * ability, CR 702.124) answers 400, as `PATCH /api/decks/[id]` does.
 */
import { NextResponse } from "next/server";
import { z } from "zod";

import { readJsonBody } from "@/lib/api/json-body";
import type { RouteParams } from "@/lib/api/route-kit";
import { deckWriteResponse } from "@/lib/api/versioned-deck-write";
import { requireDeckOwner } from "@/lib/auth/helpers";
import { prisma } from "@/lib/db/prisma";
import { commandPairRefusal } from "@/lib/deck/commander-pairing";
import { deckRepository } from "@/lib/deck/deck-repository";
import { logger } from "@/lib/logger";
import { commandZoneChangeSchema } from "@/lib/validation/card";

/** The slots the deck holds now, for the pair check. */
async function storedCommandSlots(deckId: string) {
  const slots = await prisma.deck.findUnique({
    where: { id: deckId },
    select: { commanderId: true, partnerId: true },
  });
  return {
    commanderId: slots?.commanderId ?? null,
    partnerId: slots?.partnerId ?? null,
  };
}

// PATCH /api/decks/[id]/command-zone — change the command zone: every row and field, or none
export async function PATCH(request: Request, { params }: RouteParams<"id">) {
  const { id: deckId } = await params;
  try {
    const ownership = await requireDeckOwner(deckId);
    if (ownership.error) return ownership.error;

    const jsonBody = await readJsonBody(request);
    if (!jsonBody.ok) return jsonBody.response;

    const parsed = commandZoneChangeSchema.safeParse(jsonBody.value);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: z.flattenError(parsed.error),
        },
        { status: 400 }
      );
    }
    const {
      expectedVersion,
      commandZone,
      removeCardIds,
      clearCommandSlots,
      addCards,
    } = parsed.data;

    const refusal = await commandPairRefusal(
      commandZone,
      await storedCommandSlots(deckId)
    );
    if (refusal) return NextResponse.json({ error: refusal }, { status: 400 });

    const result = await deckRepository.writeCommandZone(
      { deckId, expectedVersion },
      {
        removeCardIds,
        clearSlots: clearCommandSlots,
        addCards,
        fields: commandZone,
      }
    );
    return deckWriteResponse(result, ({ value, version }) =>
      NextResponse.json({ cards: value, version })
    );
  } catch (error) {
    logger.error(
      error instanceof Error ? error.message : "unknown",
      "PATCH /api/decks/:id/command-zone",
      { deckId: String(deckId).slice(0, 50) }
    );
    return NextResponse.json(
      { error: "Failed to save the command zone" },
      { status: 500 }
    );
  }
}
