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
 * Cards are read only where a figure counts them (#1856): every card of the
 * active Commander-family decks, and the commander rows of the others. A
 * request makes five queries whatever the number of decks: the account, the
 * decks, the snapshot dates, then the two card reads.
 *
 * Not a snapshot read: the queries run in separate steps, so a deck saved
 * while the read runs may show either version. A read-only page needs no
 * stronger guarantee.
 *
 * @module deck/player-stats-read
 */
import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { isDeckFormat } from "./formats";
import {
  countsDeckCards,
  type PlayerStatsDeck,
  type StatsWindow,
} from "./player-stats";
import {
  buildPlayerStatsReport,
  parseStatsYear,
  statsWindowOf,
  statsYears,
  type PlayerStatsReport,
  type StatsDeckName,
} from "./player-stats-report";
import {
  toPlayerStatsDeck,
  type StoredStatsCard,
  type StoredStatsDeck,
} from "./player-stats-rows";

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

/**
 * The rows that fill the commander and partner slots: the same rows
 * `isCommanderRow` and `commandSlotOf` place there, so the commanders read
 * from them match a read of every card. CR 702.124a: a partner ability lets
 * a deck have two commanders, so both rows name the commander.
 */
const COMMANDER_ROWS = {
  OR: [{ isCommander: true }, { isPartner: true }],
} as const satisfies Prisma.DeckCardWhereInput;

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

  const { decks, rows } = await readStatsRows(
    query.userId,
    statsWindowOf(year)
  );
  const report = buildPlayerStatsReport({ year, years, decks, rows });
  return { kind: "found", report };
}

/**
 * The player's deck names and the rows the counting reads, every deck of
 * theirs included. A deck whose cards no figure counts (`countsDeckCards`)
 * comes with its commander and partner rows only: its row names its
 * commanders exactly, and its main cards, colour identity and bracket
 * estimate stay partial, which no figure reads.
 */
async function readStatsRows(
  userId: string,
  window: StatsWindow
): Promise<{
  readonly decks: readonly StatsDeckName[];
  readonly rows: readonly PlayerStatsDeck[];
}> {
  const decks = await prisma.deck.findMany({
    where: { userId },
    select: DECK_COLUMNS,
  });
  const snapshotDates = await readSnapshotDates(decks.map((deck) => deck.id));
  const datesOf = (deckId: string) => snapshotDates.get(deckId) ?? [];
  const countedIds = new Set(
    decks
      .filter((deck) => countsCardsOf(deck, datesOf(deck.id), window))
      .map((deck) => deck.id)
  );
  const cardsByDeck = groupByDeck(
    await readStatsCards({
      everyCard: decks.filter((deck) => countedIds.has(deck.id)),
      commandersOnly: decks.filter((deck) => !countedIds.has(deck.id)),
    })
  );

  const rows = decks.flatMap((deck) => {
    const row = toPlayerStatsDeck({
      deck,
      cards: cardsByDeck.get(deck.id) ?? [],
      snapshotDates: datesOf(deck.id),
    });
    return row === null ? [] : [row];
  });
  return { decks: decks.map(({ id, name }) => ({ id, name })), rows };
}

/** When each snapshot of the decks was taken, by deck. */
async function readSnapshotDates(
  deckIds: readonly string[]
): Promise<ReadonlyMap<string, readonly Date[]>> {
  const snapshots = await prisma.deckSnapshot.findMany({
    where: { deckId: { in: [...deckIds] } },
    select: { deckId: true, createdAt: true },
  });
  return new Map(
    [...groupByDeck(snapshots)].map(([deckId, rows]) => [
      deckId,
      rows.map((snapshot) => snapshot.createdAt),
    ])
  );
}

/** Whether a figure counts the stored deck's cards; never for a format this build does not know. */
function countsCardsOf(
  deck: StoredStatsDeck,
  snapshotDates: readonly Date[],
  window: StatsWindow
): boolean {
  if (!isDeckFormat(deck.format)) return false;
  return countsDeckCards(
    { ...deck, format: deck.format, snapshotDates },
    window
  );
}

/** The decks whose every card is read, and the decks whose commanders alone are. */
interface StatsCardScopes {
  readonly everyCard: readonly StoredStatsDeck[];
  readonly commandersOnly: readonly StoredStatsDeck[];
}

/**
 * The card rows the counting needs, in two queries whatever the number of
 * decks: every card of the decks a figure counts, and the commander and
 * partner rows of the others, which say whether a commander is new.
 */
async function readStatsCards(
  scopes: StatsCardScopes
): Promise<readonly StoredStatsCard[]> {
  const idsOf = (decks: readonly StoredStatsDeck[]) =>
    decks.map((deck) => deck.id);
  const [everyCard, commanders] = await Promise.all([
    prisma.deckCard.findMany({
      where: { deckId: { in: idsOf(scopes.everyCard) } },
      select: CARD_COLUMNS,
    }),
    prisma.deckCard.findMany({
      where: {
        deckId: { in: idsOf(scopes.commandersOnly) },
        ...COMMANDER_ROWS,
      },
      select: CARD_COLUMNS,
    }),
  ]);
  return [...everyCard, ...commanders];
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
