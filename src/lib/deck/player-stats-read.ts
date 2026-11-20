/**
 * Reads one year of a player's statistics from the database (I-60 slice 2,
 * `docs/product/specs/i60-player-stats-and-year-in-review.md`).
 *
 * Deck analysis, Prisma adapter. Every query is scoped to the player: their
 * decks by `userId`, then the cards and snapshots of those decks only, so
 * another account's decks cannot come back (requirement 1.5). A deleted deck
 * has no row, so it is simply absent (3.7). Snapshot dates come from
 * `DeckSnapshot.createdAt`; the card lists they hold are not read.
 *
 * Not a snapshot read: the card and snapshot queries run concurrently, so a
 * deck saved while the read runs may show either version. A read-only page
 * needs no stronger guarantee.
 *
 * @module deck/player-stats-read
 */
import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { PlayerStatsDeck } from "./player-stats";
import {
  buildPlayerStatsReport,
  parseStatsYear,
  statsYears,
  type PlayerStatsReport,
  type StatsDeckName,
} from "./player-stats-report";
import { toPlayerStatsDeck } from "./player-stats-rows";

/** The deck columns the statistics read. */
const DECK_COLUMNS = {
  id: true,
  name: true,
  format: true,
  targetBracket: true,
  manualBracket: true,
  pairingType: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.DeckSelect;

/** Every card column the builder's mapping reads (`apiCardToDeckCard`). */
const CARD_COLUMNS = {
  id: true,
  deckId: true,
  scryfallId: true,
  name: true,
  manaCost: true,
  cmc: true,
  typeLine: true,
  oracleText: true,
  power: true,
  toughness: true,
  colorIdentity: true,
  isGameChanger: true,
  isBanned: true,
  price: true,
  imageUri: true,
  artCropUri: true,
  category: true,
  quantity: true,
  isCommander: true,
  isPartner: true,
  notes: true,
  zone: true,
} as const satisfies Prisma.DeckCardSelect;

/** What the caller asks for. */
export interface PlayerStatsQuery {
  /** The signed-in account's id, as `requireAuth` or `auth()` resolved it */
  readonly userId: string;
  /** The `year` query value, or null for the current year */
  readonly year: string | null;
  /** The request time, which sets the current year */
  readonly now: Date;
}

/** The report, or why there is none. */
export type PlayerStatsReadResult =
  | { readonly kind: "found"; readonly report: PlayerStatsReport }
  | { readonly kind: "invalid-year" }
  | { readonly kind: "no-account" };

/**
 * Reads and counts one year of the player's statistics.
 *
 * @param query - the player, the year asked for and the request time
 * @returns the report; `invalid-year` for a year outside the current one and
 *   the account's first; `no-account` when the account is gone
 * @throws When the database cannot be read
 */
export async function readPlayerStatsReport(
  query: PlayerStatsQuery
): Promise<PlayerStatsReadResult> {
  const account = await prisma.user.findUnique({
    where: { id: query.userId },
    select: { createdAt: true },
  });
  if (account === null) return { kind: "no-account" };

  const years = statsYears(account.createdAt, query.now);
  const year = parseStatsYear(query.year, years);
  if (year === null) return { kind: "invalid-year" };

  const { decks, rows } = await readStatsRows(query.userId);
  const report = buildPlayerStatsReport({ year, years, decks, rows });
  return { kind: "found", report };
}

/** The player's deck names and the rows the counting reads, every deck of theirs included. */
async function readStatsRows(userId: string): Promise<{
  readonly decks: readonly StatsDeckName[];
  readonly rows: readonly PlayerStatsDeck[];
}> {
  const decks = await prisma.deck.findMany({
    where: { userId },
    select: DECK_COLUMNS,
  });
  const deckIds = decks.map((deck) => deck.id);
  const [cards, snapshots] = await Promise.all([
    prisma.deckCard.findMany({
      where: { deckId: { in: deckIds } },
      select: CARD_COLUMNS,
    }),
    prisma.deckSnapshot.findMany({
      where: { deckId: { in: deckIds } },
      select: { deckId: true, createdAt: true },
    }),
  ]);

  const cardsByDeck = groupByDeck(cards);
  const snapshotsByDeck = groupByDeck(snapshots);
  const rows = decks.flatMap((deck) => {
    const row = toPlayerStatsDeck({
      deck,
      cards: cardsByDeck.get(deck.id) ?? [],
      snapshotDates: (snapshotsByDeck.get(deck.id) ?? []).map(
        (snapshot) => snapshot.createdAt
      ),
    });
    return row === null ? [] : [row];
  });
  return { decks: decks.map(({ id, name }) => ({ id, name })), rows };
}

/** Rows grouped by the deck they belong to, in their order. */
function groupByDeck<Row extends { readonly deckId: string }>(
  rows: readonly Row[]
): ReadonlyMap<string, readonly Row[]> {
  const byDeck = new Map<string, Row[]>();
  for (const row of rows) {
    const group = byDeck.get(row.deckId) ?? [];
    group.push(row);
    byDeck.set(row.deckId, group);
  }
  return byDeck;
}
