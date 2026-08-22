/**
 * `GET|POST /api/user/api-keys` — the signed-in user's API credentials.
 *
 * Session-authenticated, not key-authenticated. A key must never be able to
 * mint another key: that would turn a single leaked credential into permanent
 * access no revocation could catch, since the thief could keep issuing
 * replacements. Managing keys stays behind the browser session that owns them.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/helpers";
import { logger } from "@/lib/logger";
import { readJsonBody } from "@/lib/api/json-body";
import { API_SCOPES, DEFAULT_API_SCOPES, mintApiKey } from "@/lib/api/keys";

/**
 * Keys one account may hold at once.
 *
 * Bounded because every key is a standing credential and an unbounded list is
 * one nobody audits.
 */
const MAX_KEYS_PER_USER = 20;

const createSchema = z.object({
  name: z.string().trim().min(1).max(100),
  scopes: z.array(z.enum(API_SCOPES)).nonempty().optional(),
  /** Days until the key expires; omitted means valid until revoked. */
  expiresInDays: z.number().int().min(1).max(365).optional(),
});

export async function GET() {
  const result = await requireAuth();
  if (result.error) return result.error;

  try {
    const keys = await prisma.apiKey.findMany({
      where: { userId: result.session.user.id },
      orderBy: { createdAt: "desc" },
      // `tokenHash` is deliberately absent: it is the verifier, and a listing
      // has no use for it.
      select: {
        id: true,
        name: true,
        displayPrefix: true,
        scopes: true,
        revokedAt: true,
        expiresAt: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ keys });
  } catch (error) {
    const message = error instanceof Error ? error.message : "API key listing failed";
    logger.error(message, "GET /api/user/api-keys");
    return NextResponse.json({ error: "Could not list API keys" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const result = await requireAuth();
  if (result.error) return result.error;

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const parsed = createSchema.safeParse(body.value);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const userId = result.session.user.id;
  const { name, scopes, expiresInDays } = parsed.data;

  try {
    const liveKeys = await prisma.apiKey.count({ where: { userId, revokedAt: null } });
    if (liveKeys >= MAX_KEYS_PER_USER) {
      return NextResponse.json(
        { error: `At most ${MAX_KEYS_PER_USER} active keys. Revoke one first.` },
        { status: 409 }
      );
    }

    const minted = mintApiKey();
    const created = await prisma.apiKey.create({
      data: {
        name,
        tokenHash: minted.tokenHash,
        displayPrefix: minted.displayPrefix,
        scopes: scopes ?? [...DEFAULT_API_SCOPES],
        expiresAt: expiresInDays
          ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
          : null,
        userId,
      },
      select: {
        id: true,
        name: true,
        displayPrefix: true,
        scopes: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    // The one and only time the token exists outside the caller's hands. It is
    // not recoverable from the row, so the client must surface it now or the
    // key is dead on arrival.
    return NextResponse.json({ key: created, token: minted.token }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "API key creation failed";
    logger.error(message, "POST /api/user/api-keys", { userId });
    return NextResponse.json({ error: "Could not create the API key" }, { status: 500 });
  }
}
