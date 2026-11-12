/**
 * Recorded playtest sessions for a deck.
 *
 * GET  — the caller's own sessions plus the aggregate summary
 * POST — record one session
 *
 * Mounted under /api/decks rather than /api/community: a playtest record is
 * private practice data, not something other viewers of a public deck should
 * read. Both verbs therefore require a session and scope every query to the
 * caller, so two players practising the same public deck never see each other's
 * results.
 *
 * Every recorded run is filed under a deck snapshot, so the before/after
 * comparison can group runs by deck version. The server picks that snapshot
 * from the deck as saved when the run is recorded, rather than trusting a card
 * list from the client. The builder saves each edit as it is made and the
 * fullscreen playtest blocks the builder during a run, so the saved deck is the
 * deck that was played. The exceptions are an edit made in another tab during
 * the run, or one whose save had not finished or failed; those runs are filed
 * under the saved version.
 */

import type {
  Prisma,
  PlaytestSession as StoredPlaytestSession,
} from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/helpers";
import { logRouteFailure, type RouteParams } from "@/lib/api/route-kit";
import { logger } from "@/lib/logger";
import type { PlaytestSession } from "@/lib/playtest/analytics";
import {
  isSessionDifficulty,
  isSessionResult,
} from "@/lib/playtest/session-enums";
import { parseSessionInput, summarizeSessions } from "@/lib/playtest/session-input";
import { readJsonBody } from "@/lib/api/json-body";
import { compareSessionGroups } from "@/lib/playtest/comparison";
import { findSnapshotOfVersion, snapshotContent } from "@/lib/deck/deck-version";

/** Rows are capped so one enthusiastic tester cannot make the panel unbounded. */
const MAX_SESSIONS = 500;

/**
 * How many recent snapshots a recorded run is matched against. Each one is a
 * full card list, so the read stays bounded however long the deck's history
 * grows; a version older than this window gets a fresh snapshot.
 */
const VERSION_MATCH_WINDOW = 20;

/**
 * Confirms the caller owns the deck.
 *
 * Ownership rather than visibility: you may read a public deck, but you may
 * only record playtests against your own.
 *
 * @param deckId Deck identifier from the route.
 * @param userId Signed-in user id.
 * @returns The deck when the caller owns it, otherwise null.
 */
async function findOwnedDeck(deckId: string, userId: string) {
  const deck = await prisma.deck.findUnique({
    where: { id: deckId },
    select: { id: true, userId: true, commanderId: true },
  });

  if (deck?.userId !== userId) return null;
  return deck;
}

/**
 * Narrows one stored row to the session the aggregates read.
 *
 * `result` and `difficulty` are plain strings in Postgres, written only
 * through `parseSessionInput`, so a value outside the known sets means a row
 * edited behind the API. A row whose result no aggregate can count is skipped
 * and logged rather than inflating the totals; a difficulty nobody knows is
 * read as not recorded.
 *
 * @param row - the row as Prisma returns it
 * @returns the session, or null when its result is not one the app records
 */
function toPlaytestSession(row: StoredPlaytestSession): PlaytestSession | null {
  if (!isSessionResult(row.result)) {
    logger.warn(
      "Skipping a playtest session with an unknown result",
      "GET /api/decks/:id/playtest-sessions",
      { sessionId: row.id, result: row.result }
    );
    return null;
  }
  return {
    id: row.id,
    deckId: row.deckId,
    userId: row.userId,
    result: row.result,
    turns: row.turns,
    mulliganCount: row.mulliganCount,
    difficulty: isSessionDifficulty(row.difficulty)
      ? row.difficulty
      : undefined,
    notes: row.notes ?? undefined,
    proposedChange: row.proposedChange ?? undefined,
    snapshotId: row.snapshotId ?? undefined,
    cardsSeen: row.cardsSeen ?? undefined,
    additionalCardsSeen: row.additionalCardsSeen ?? undefined,
    createdAt: row.createdAt,
  };
}

/**
 * Loads the caller's sessions for a deck, newest first.
 *
 * @param deckId Deck identifier.
 * @param userId Signed-in user id.
 * @returns The sessions, capped at MAX_SESSIONS.
 */
async function loadSessions(deckId: string, userId: string): Promise<PlaytestSession[]> {
  const rows = await prisma.playtestSession.findMany({
    where: { deckId, userId },
    orderBy: { createdAt: "desc" },
    take: MAX_SESSIONS,
  });

  return rows.flatMap((row) => {
    const session = toPlaytestSession(row);
    return session === null ? [] : [session];
  });
}

/**
 * Names a snapshot created to hold a recorded run's deck version.
 *
 * The name is stored, not translated, so it uses the app's untranslated
 * "Playtest" label and a UTC timestamp that reads the same in every locale.
 *
 * @param recordedAt - When the run was recorded.
 * @returns e.g. "Playtest · 2026-11-09 14:32 UTC".
 */
function playtestSnapshotName(recordedAt: Date): string {
  const iso = recordedAt.toISOString();
  return `Playtest · ${iso.slice(0, 10)} ${iso.slice(11, 16)} UTC`;
}

/**
 * Finds the snapshot holding the deck as saved now, or creates one.
 *
 * Repeated runs on an unchanged deck therefore share one snapshot instead of
 * adding a new one to the deck's history each time.
 *
 * @param tx - The recording transaction.
 * @param deck - The owned deck.
 * @param recordedAt - When the run is being recorded, for a new snapshot's name.
 * @returns The id of the snapshot to file the run under.
 */
async function snapshotOfSavedDeck(
  tx: Prisma.TransactionClient,
  deck: { readonly id: string; readonly commanderId: string | null },
  recordedAt: Date
): Promise<string> {
  const cards = await tx.deckCard.findMany({ where: { deckId: deck.id } });
  const recent = await tx.deckSnapshot.findMany({
    where: { deckId: deck.id },
    orderBy: { createdAt: "desc" },
    take: VERSION_MATCH_WINDOW,
    select: { id: true, cardList: true },
  });
  const existing = findSnapshotOfVersion(deck.id, cards, recent);
  if (existing) return existing;

  const created = await tx.deckSnapshot.create({
    data: {
      deckId: deck.id,
      name: playtestSnapshotName(recordedAt),
      ...snapshotContent({ commanderId: deck.commanderId, cards }),
    },
    select: { id: true },
  });
  return created.id;
}

// GET /api/decks/[id]/playtest-sessions
export async function GET(request: Request, { params }: RouteParams<"id">) {
  const { id } = await params;

  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const userId = authResult.session.user.id;
    const searchParams = new URL(request.url).searchParams;
    const beforeSnapshotId = searchParams.get("beforeSnapshotId")?.trim() ?? "";
    const afterSnapshotId = searchParams.get("afterSnapshotId")?.trim() ?? "";
    const hasBeforeSnapshot = beforeSnapshotId.length > 0;
    const hasAfterSnapshot = afterSnapshotId.length > 0;

    if (hasBeforeSnapshot !== hasAfterSnapshot) {
      return NextResponse.json(
        { error: "Both beforeSnapshotId and afterSnapshotId are required" },
        { status: 400 }
      );
    }
    if (hasBeforeSnapshot && beforeSnapshotId === afterSnapshotId) {
      return NextResponse.json(
        { error: "Choose two different snapshots" },
        { status: 400 }
      );
    }

    const deck = await findOwnedDeck(id, userId);
    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    const sessions = await loadSessions(id, userId);
    const summary = summarizeSessions(sessions);
    if (!hasBeforeSnapshot) return NextResponse.json({ sessions, summary });

    const before = sessions.filter((session) => session.snapshotId === beforeSnapshotId);
    const after = sessions.filter((session) => session.snapshotId === afterSnapshotId);
    return NextResponse.json({
      sessions,
      summary,
      comparison: compareSessionGroups(before, after),
    });
  } catch (error) {
    logRouteFailure(error, "GET /api/decks/:id/playtest-sessions");
    return NextResponse.json({ error: "Failed to fetch playtest sessions" }, { status: 500 });
  }
}

// POST /api/decks/[id]/playtest-sessions
export async function POST(request: Request, { params }: RouteParams<"id">) {
  const { id } = await params;

  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const userId = authResult.session.user.id;

    const jsonBody = await readJsonBody(request);
    if (!jsonBody.ok) return jsonBody.response;
    const parsed = parseSessionInput(jsonBody.value);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const deck = await findOwnedDeck(id, userId);
    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    if (parsed.value.snapshotId) {
      const snapshot = await prisma.deckSnapshot.findFirst({
        where: { id: parsed.value.snapshotId, deckId: id },
        select: { id: true },
      });
      if (!snapshot) {
        return NextResponse.json({ error: "Snapshot not found for this deck" }, { status: 400 });
      }
    }

    // One transaction, so a snapshot created for a run is never left behind
    // without it. An explicit snapshotId, validated above, is still honoured for
    // older clients; the result bar no longer sends one.
    const explicitSnapshotId = parsed.value.snapshotId;
    await prisma.$transaction(async (tx) => {
      const snapshotId = explicitSnapshotId ?? (await snapshotOfSavedDeck(tx, deck, new Date()));
      // No upsert: every run is its own row, which is the whole point of a trend.
      await tx.playtestSession.create({
        data: { ...parsed.value, snapshotId, deckId: id, userId },
      });
    });

    const sessions = await loadSessions(id, userId);
    return NextResponse.json(
      { sessions, summary: summarizeSessions(sessions) },
      { status: 201 }
    );
  } catch (error) {
    logRouteFailure(error, "POST /api/decks/:id/playtest-sessions");
    return NextResponse.json({ error: "Failed to record playtest session" }, { status: 500 });
  }
}
