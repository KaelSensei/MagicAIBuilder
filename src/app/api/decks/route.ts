import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/helpers";
import { logger } from "@/lib/logger";
import { ALL_FORMATS } from "@/lib/deck/formats";
import { readJsonBody } from "@/lib/api/json-body";
import { sharesOracleIdentity } from "@/lib/deck/commander-pairing";
import { deckCardIdSchema } from "@/lib/validation/deck";
import { addCardSchema, type AddCardInput } from "@/lib/validation/card";
import { readIdempotencyKey } from "@/lib/api/idempotency-key";
import { createOnce } from "@/lib/db/create-once";

/** Max decks per page for the listing endpoint */
const MAX_PAGE_SIZE = 50;
/** Default decks per page */
const DEFAULT_PAGE_SIZE = 20;
/** Card rows one create may carry: a full deck, a sideboard and a long maybeboard. */
const MAX_CREATE_CARDS = 500;

/**
 * Reads a whole-number query parameter, falling back when it is not one.
 *
 * `Number("abc")` is NaN and every clamp around it is NaN too — `Math.max(0,
 * NaN)` is NaN, not 0 — so `?page=abc` reached Prisma as `skip: NaN, take:
 * NaN`, which it rejects. Fractions are floored rather than
 * rejected: `?page=1.5` should mean page 1, not a skip of 30.
 *
 * @param value - the raw query parameter, or null when absent
 * @param fallback - the value to use when it is absent or not a number
 * @returns a whole number
 */
function readWholeNumber(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.floor(parsed) : fallback;
}

const createDeckFieldsSchema = z.object({
  name: z.string().min(1).max(200),
  format: z.enum(ALL_FORMATS).optional().default("commander"),
  targetBracket: z.number().int().min(1).max(5).optional().default(3),
  budget: z.number().positive().nullable().optional(),
  commanderId: deckCardIdSchema.nullable().optional(),
  commanderName: z.string().max(200).nullable().optional(),
  partnerId: deckCardIdSchema.nullable().optional(),
  companionId: z.string().nullable().optional(),
  pairingType: z
    .enum(["none", "partner", "partner_with", "friends_forever", "background", "doctor", "character_select", "father_son"])
    .optional()
    .default("none"),
  isAIGenerated: z.boolean().optional().default(false),
  manualBracket: z.number().int().min(1).max(5).nullable().optional(),
  description: z.string().max(2000).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  // A whole deck in one request — how a guest deck reaches a new account.
  cards: z.array(addCardSchema).max(MAX_CREATE_CARDS).optional().default([]),
});

const createDeckSchema = createDeckFieldsSchema.refine(
  (fields) => hasOneCommandRowPerSlot(fields.cards),
  {
    message: "A deck holds at most one commander and one partner",
    path: ["cards"],
  }
);

type CreateDeckInput = z.infer<typeof createDeckSchema>;

/**
 * @param cards - the card rows of a create request
 * @returns whether no command-zone slot is claimed by two rows
 */
function hasOneCommandRowPerSlot(cards: readonly AddCardInput[]): boolean {
  let commanders = 0;
  let partners = 0;
  for (const card of cards) {
    if (card.isPartner) partners += 1;
    else if (card.isCommander) commanders += 1;
  }
  return commanders <= 1 && partners <= 1;
}

/**
 * @param fields - the validated request
 * @param name - the request's name with markup stripped
 * @param userId - the session's user
 * @param idempotencyKey - the request's key, or null
 * @returns the Prisma create input: the deck and its cards in one write
 */
function buildCreateDeckData(
  fields: CreateDeckInput,
  name: string,
  userId: string,
  idempotencyKey: string | null
) {
  return {
    name,
    format: fields.format,
    targetBracket: fields.targetBracket,
    manualBracket: fields.manualBracket ?? null,
    budget: fields.budget ?? null,
    description: fields.description,
    tags: fields.tags,
    commanderId: fields.commanderId ?? null,
    commanderName: fields.commanderName ?? null,
    partnerId: fields.partnerId ?? null,
    companionId: fields.companionId ?? null,
    pairingType: fields.pairingType,
    isAIGenerated: fields.isAIGenerated ?? false,
    userId,
    idempotencyKey,
    cards: { create: fields.cards },
  };
}

// GET /api/decks — paginated lightweight listing (commander/partner/companion only + card count)
export async function GET(request: NextRequest) {
  const startedAt = performance.now();
  let status = 500;
  try {
    const result = await requireAuth();
    if (result.error) {
      status = result.error.status;
      return result.error;
    }

    const { searchParams } = request.nextUrl;
    const page = Math.max(0, readWholeNumber(searchParams.get("page"), 0));
    const limit = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, readWholeNumber(searchParams.get("limit"), DEFAULT_PAGE_SIZE))
    );
    const userId = result.session.user.id;

    const [decks, total] = await Promise.all([
      prisma.deck.findMany({
        where: { userId },
        include: {
          cards: {
            where: {
              OR: [
                { isCommander: true },
                { isPartner: true },
                { category: "companion" },
              ],
            },
            select: {
              id: true,
              scryfallId: true,
              name: true,
              manaCost: true,
              cmc: true,
              typeLine: true,
              oracleText: true,
              colorIdentity: true,
              isGameChanger: true,
              isBanned: true,
              price: true,
              imageUri: true,
              artCropUri: true,
              category: true,
              isCommander: true,
              isPartner: true,
              power: true,
              toughness: true,
              quantity: true,
              notes: true,
              zone: true,
            },
            distinct: ["scryfallId", "isCommander", "isPartner"],
            take: 3,
          },
          _count: { select: { cards: true } },
        },
        orderBy: { updatedAt: "desc" },
        skip: page * limit,
        take: limit,
      }),
      prisma.deck.count({ where: { userId } }),
    ]);

    status = 200;
    return NextResponse.json({ decks, total, page, limit });
  } catch (error) {
    logger.error(error instanceof Error ? error.message : "unknown", "GET /api/decks");
    return NextResponse.json(
      { error: "Failed to fetch decks" },
      { status: 500 }
    );
  } finally {
    logger.info("Deck list request completed", "GET /api/decks", {
      status,
      durationMs: Math.round(performance.now() - startedAt),
    });
  }
}

// POST /api/decks — create a new deck, optionally with its cards. A request
// carrying an Idempotency-Key that already created a deck returns that deck (200).
export async function POST(request: Request) {
  try {
    const result = await requireAuth();
    if (result.error) return result.error;

    const idempotency = readIdempotencyKey(request);
    if (!idempotency.ok) return idempotency.response;

    const jsonBody = await readJsonBody(request);

    if (!jsonBody.ok) return jsonBody.response;

    const body = jsonBody.value;
    const parsed = createDeckSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.issues.map((i) => i.message) }, { status: 400 });
    }
    const { name: rawName, commanderId, partnerId } = parsed.data;
    if (commanderId && commanderId === partnerId) {
      return NextResponse.json({ error: "Commander and partner must be different cards" }, { status: 400 });
    }
    if (commanderId && partnerId && await sharesOracleIdentity(commanderId, partnerId)) {
      return NextResponse.json({ error: "Commander and partner must be different cards" }, { status: 400 });
    }
    // Bounded quantifier prevents ReDoS on HTML tag stripping
    const sanitizedName = rawName.replaceAll(/<[^>]{0,200}>/g, "").trim();
    if (!sanitizedName) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    const userId = result.session.user.id;
    const key = idempotency.key;
    const create = () =>
      prisma.deck.create({
        data: buildCreateDeckData(parsed.data, sanitizedName, userId, key),
        include: { cards: true },
      });
    if (key === null) {
      return NextResponse.json(await create(), { status: 201 });
    }

    const { row, created } = await createOnce({
      findExisting: () =>
        prisma.deck.findFirst({
          where: { userId, idempotencyKey: key },
          include: { cards: true },
        }),
      create,
    });
    return NextResponse.json(row, { status: created ? 201 : 200 });
  } catch (error) {
    logger.error(error instanceof Error ? error.message : "unknown", "POST /api/decks");
    return NextResponse.json(
      { error: "Failed to create deck" },
      { status: 500 }
    );
  }
}
