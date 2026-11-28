/**
 * `POST /api/decks/[id]/duplicate`: writes a private copy of a deck the caller
 * owns, with all its cards.
 *
 * The copy takes the name the request sends, `{ name }`, which the page words
 * in the player's language (I-04) and the route checks with the rename's rule
 * (`deckNameSchema`); an invalid name is refused with 400, as a rename refuses
 * it. A request without a name, from a client that predates it, gets
 * `${name} (Copy)` as before.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireDeckOwner } from "@/lib/auth/helpers";
import { readOptionalJsonBody } from "@/lib/api/json-body";
import { logger } from "@/lib/logger";
import type { RouteParams } from "@/lib/api/route-kit";
import { duplicateDeckSchema } from "@/lib/validation/deck";

/** The copy's name the request asked for, `undefined` when it sent none, or the 400 to answer. */
type RequestedCopyName =
  | { readonly ok: true; readonly name: string | undefined }
  | { readonly ok: false; readonly response: NextResponse };

/**
 * Reads the copy's name from the request's optional body.
 *
 * @param request - the duplicate request; its body may be empty
 * @returns the name, or the 400 for a body that is not JSON or a name that
 *   breaks the rename's rule
 */
async function requestedCopyName(request: Request): Promise<RequestedCopyName> {
  const body = await readOptionalJsonBody(request);
  if (!body.ok) return body;
  const parsed = duplicateDeckSchema.safeParse(body.value ?? {});
  if (!parsed.success) {
    const details = z.flattenError(parsed.error);
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Invalid request body", details },
        { status: 400 }
      ),
    };
  }
  return { ok: true, name: parsed.data.name };
}

/** Duplicates a deck with all its cards; see the module header for the copy's name. */
export async function POST(request: Request, { params }: RouteParams<"id">) {
  const { id } = await params;
  try {
    const ownership = await requireDeckOwner(id);
    if (ownership.error) return ownership.error;

    const copyName = await requestedCopyName(request);
    if (!copyName.ok) return copyName.response;

    const original = await prisma.deck.findUnique({
      where: { id },
      include: { cards: true },
    });

    if (!original) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    const copy = await prisma.deck.create({
      data: {
        name: copyName.name ?? `${original.name} (Copy)`,
        format: original.format,
        targetBracket: original.targetBracket,
        manualBracket: original.manualBracket,
        budget: original.budget,
        commanderId: original.commanderId,
        commanderName: original.commanderName,
        partnerId: original.partnerId,
        companionId: original.companionId,
        pairingType: original.pairingType,
        userId: ownership.userId,
        // Don't copy share settings — new deck starts private
        cards: {
          create: original.cards.map((card) => ({
            scryfallId: card.scryfallId,
            name: card.name,
            manaCost: card.manaCost,
            cmc: card.cmc,
            typeLine: card.typeLine,
            oracleText: card.oracleText,
            power: card.power,
            toughness: card.toughness,
            colorIdentity: card.colorIdentity,
            isGameChanger: card.isGameChanger,
            isBanned: card.isBanned,
            price: card.price,
            imageUri: card.imageUri,
            artCropUri: card.artCropUri,
            category: card.category,
            quantity: card.quantity,
            isCommander: card.isCommander,
            isPartner: card.isPartner,
            zone: card.zone,
          })),
        },
      },
      include: { cards: true },
    });

    return NextResponse.json(copy, { status: 201 });
  } catch (error) {
    logger.error(error instanceof Error ? error.message : "unknown", "POST /api/decks/:id/duplicate");
    return NextResponse.json({ error: "Failed to duplicate deck" }, { status: 500 });
  }
}
