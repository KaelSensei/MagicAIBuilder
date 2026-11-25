// @vitest-environment node
/**
 * `GET /api/user/stats`, sociable: the real route, guard, rate limit, read,
 * row mapper, counting (I-60 slice 1) and bracket estimate, over an in-memory
 * database that holds the caller's decks and another player's (I-60 slice 2,
 * requirements 1.2, 1.3, 2.1 to 2.3, 3.2, 3.3).
 *
 * Two boundaries are faked: the Auth.js session (`auth()`) and the database
 * behind `@/lib/db/prisma` (`src/test/in-memory-prisma-tables.ts`, which
 * honours `where` and `select`, so a read scoped to the wrong column would
 * show here).
 */
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PlayerStatsReport } from "@/lib/deck/player-stats-report";
import type { TableRow } from "@/test/in-memory-prisma-tables";

const fake = vi.hoisted(() => ({
  auth: vi.fn(),
  tables: new Map<string, readonly Readonly<Record<string, unknown>>[]>(),
}));

vi.mock(import("@/lib/auth/config"), () => ({
  auth: fake.auth,
  handlers: {
    GET: async () => new Response(null, { status: 200 }),
    POST: async () => new Response(null, { status: 200 }),
  },
}));

vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
  const { inMemoryPrisma } = await import("@/test/in-memory-prisma-tables");
  return inMemoryPrisma(await importOriginal(), fake.tables);
});

import { GET } from "./route";

const PLAYER = "player-1";
const RIVAL = "player-2";

const ELVES = "deck-elves";
const MARWYN = "deck-marwyn";
const SHEOLDRED = "deck-sheoldred";
const MODERN = "deck-modern";
const OLD = "deck-old";
const RIVAL_DECK = "deck-rival";
const PAIR = "deck-pair";
const OLD_PAIR = "deck-old-pair";
const OLD_MODERN = "deck-old-modern";

const IN_2026 = new Date("2026-03-01T10:00:00.000Z");
const IN_2025 = new Date("2025-06-01T10:00:00.000Z");

/** A stored user row with what the session guard and the read select. */
function userRow(id: string, createdAt: Date): TableRow {
  return {
    id,
    name: `Name of ${id}`,
    email: `${id}@example.test`,
    image: null,
    username: id,
    onboardingDone: true,
    isModerator: false,
    createdAt,
  };
}

/** A stored deck row; both dates at `createdAt` unless given. */
function deckRow(
  id: string,
  userId: string,
  fields: Readonly<Record<string, unknown>> = {}
): TableRow {
  return {
    id,
    userId,
    name: `Name of ${id}`,
    format: "commander",
    targetBracket: 3,
    manualBracket: null,
    pairingType: "none",
    createdAt: IN_2026,
    updatedAt: IN_2026,
    ...fields,
  };
}

/** A stored main-deck card row of a colourless artifact, one copy. */
function cardRow(
  deckId: string,
  name: string,
  fields: Readonly<Record<string, unknown>> = {}
): TableRow {
  return {
    id: `${deckId}:${name}`,
    deckId,
    scryfallId: `scryfall:${name}`,
    name,
    manaCost: "{1}",
    cmc: 1,
    typeLine: "Artifact",
    oracleText: "",
    power: null,
    toughness: null,
    colorIdentity: [],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
    category: "artifact",
    quantity: 1,
    isCommander: false,
    isPartner: false,
    notes: null,
    zone: "main",
    ...fields,
  };
}

/** The stored row of a deck's commander of one colour. */
function commanderRow(deckId: string, name: string, color: string): TableRow {
  return cardRow(deckId, name, {
    typeLine: "Legendary Creature — Elf",
    colorIdentity: [color],
    category: "commander",
    isCommander: true,
  });
}

/** Two green decks, one black deck, a Modern deck and a 2025 deck for the player; one green deck for a rival. */
function seed(): void {
  fake.tables.set("user", [userRow(PLAYER, IN_2025), userRow(RIVAL, IN_2025)]);
  fake.tables.set("deck", [
    deckRow(ELVES, PLAYER),
    deckRow(MARWYN, PLAYER),
    deckRow(SHEOLDRED, PLAYER),
    deckRow(MODERN, PLAYER, { format: "modern" }),
    deckRow(OLD, PLAYER, { createdAt: IN_2025, updatedAt: IN_2025 }),
    deckRow(RIVAL_DECK, RIVAL),
  ]);
  fake.tables.set("deckCard", [
    commanderRow(ELVES, "Ezuri, Renegade Leader", "G"),
    cardRow(ELVES, "Sol Ring"),
    cardRow(ELVES, "Forest", { typeLine: "Basic Land — Forest", quantity: 30 }),
    commanderRow(MARWYN, "Marwyn, the Nurturer", "G"),
    cardRow(MARWYN, "Sol Ring", { quantity: 4 }),
    commanderRow(SHEOLDRED, "Sheoldred, the Apocalypse", "B"),
    cardRow(SHEOLDRED, "Sol Ring"),
    cardRow(MODERN, "Sol Ring"),
    commanderRow(OLD, "Old Commander", "W"),
    commanderRow(RIVAL_DECK, "Rival Commander", "G"),
    cardRow(RIVAL_DECK, "Sol Ring"),
  ]);
  fake.tables.set("deckSnapshot", []);
}

/**
 * Adds, on top of `seed`, a 2026 Commander deck led by a partner pair, a 2025
 * Commander deck led by the same pair with a Game Changer in its main deck,
 * and a 2025 Modern deck. The partner row carries `isPartner` alone, as
 * `COMMAND_SLOT_ROWS` allows.
 */
function seedPartnerPairAndOlderDecks(): void {
  const inactive = { createdAt: IN_2025, updatedAt: IN_2025 };
  fake.tables.set("deck", [
    ...(fake.tables.get("deck") ?? []),
    deckRow(PAIR, PLAYER),
    deckRow(OLD_PAIR, PLAYER, inactive),
    deckRow(OLD_MODERN, PLAYER, { format: "modern", ...inactive }),
  ]);
  const pairRows = (deckId: string) => [
    commanderRow(deckId, "Thrasios", "U"),
    cardRow(deckId, "Tymna", {
      typeLine: "Legendary Creature — Human Cleric",
      colorIdentity: ["W"],
      category: "commander",
      isPartner: true,
    }),
  ];
  fake.tables.set("deckCard", [
    ...(fake.tables.get("deckCard") ?? []),
    ...pairRows(PAIR),
    cardRow(PAIR, "Sol Ring"),
    ...pairRows(OLD_PAIR),
    cardRow(OLD_PAIR, "Sol Ring"),
    cardRow(OLD_PAIR, "Mana Crypt", { isGameChanger: true }),
    cardRow(OLD_MODERN, "Lightning Bolt", { typeLine: "Instant" }),
  ]);
}

/** Signs the caller in as `userId`, as the session cookie would. */
function signInAs(userId: string): void {
  fake.auth.mockResolvedValue({ user: { id: userId } });
}

/** Calls the route with an optional query string. */
function getStats(query = ""): Promise<Response> {
  return GET(new NextRequest(`http://localhost/api/user/stats${query}`));
}

/** Reads a 200 answer's report. */
async function reportOf(response: Response): Promise<PlayerStatsReport> {
  expect(response.status).toBe(200);
  const report: PlayerStatsReport = await response.json();
  return report;
}

/** Moves the clock past the rate limit's window, so each test starts fresh. */
let clock = Date.parse("2026-11-20T10:00:00.000Z");

beforeEach(() => {
  clock += 2 * 60 * 1000;
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(clock);
  vi.stubEnv("PLAYWRIGHT_TEST", "0");
  fake.auth.mockReset();
  seed();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("GET /api/user/stats", () => {
  it("counts a card once per deck and names the decks behind each colour", async () => {
    signInAs(PLAYER);

    const report = await reportOf(await getStats());

    const { stats } = report;
    expect(stats.commanderDeckIds).toEqual([ELVES, MARWYN, SHEOLDRED]);
    expect(stats.colors.find((entry) => entry.color === "G")?.deckIds).toEqual([
      ELVES,
      MARWYN,
    ]);
    expect(stats.cardsUsedMost).toEqual([
      { name: "Sol Ring", deckIds: [ELVES, MARWYN, SHEOLDRED] },
    ]);
    expect(stats.formats).toEqual([
      { format: "commander", deckIds: [ELVES, MARWYN, SHEOLDRED] },
      { format: "modern", deckIds: [MODERN] },
    ]);
    expect(report.decks).toContainEqual({
      id: ELVES,
      name: `Name of ${ELVES}`,
    });
  });

  it("a signed-out request gets 401 and another account's decks never appear", async () => {
    fake.auth.mockResolvedValue(null);
    expect((await getStats()).status).toBe(401);

    signInAs(PLAYER);
    const body = JSON.stringify(await reportOf(await getStats()));

    expect(body).not.toContain(RIVAL_DECK);
    expect(body).not.toContain("Rival Commander");
  });

  it("counts the year asked for, offers every year back to the account's first, and refuses another year", async () => {
    signInAs(PLAYER);

    const report = await reportOf(await getStats("?year=2025"));

    expect(report.year).toBe(2025);
    expect(report.years).toEqual([2026, 2025]);
    expect(report.stats.activeDeckIds).toEqual([OLD]);
    expect(report.stats.commanders).toEqual([
      { names: ["Old Commander"], deckIds: [OLD], isNew: true },
    ]);
    expect((await getStats("?year=2024")).status).toBe(400);
    expect((await getStats("?year=twenty")).status).toBe(400);
  });

  it("answers the whole year from the active Commander decks' cards, inactive and Modern decks only adding to the deck figures", async () => {
    signInAs(PLAYER);
    seedPartnerPairAndOlderDecks();

    const report = await reportOf(await getStats());

    const active = [ELVES, MARWYN, SHEOLDRED, MODERN, PAIR];
    const commanderDecks = [ELVES, MARWYN, SHEOLDRED, PAIR];
    expect(report).toEqual({
      year: 2026,
      years: [2026, 2025],
      decks: [
        ELVES,
        MARWYN,
        SHEOLDRED,
        MODERN,
        OLD,
        PAIR,
        OLD_PAIR,
        OLD_MODERN,
      ].map((id) => ({ id, name: `Name of ${id}` })),
      stats: {
        activeDeckIds: active,
        addedDeckIds: active,
        changedDeckIds: [],
        formats: [
          { format: "commander", deckIds: commanderDecks },
          { format: "modern", deckIds: [MODERN] },
        ],
        commanderDeckIds: commanderDecks,
        colors: [
          { color: "W", deckIds: [PAIR] },
          { color: "U", deckIds: [PAIR] },
          { color: "B", deckIds: [SHEOLDRED] },
          { color: "R", deckIds: [] },
          { color: "G", deckIds: [ELVES, MARWYN] },
        ],
        colorIdentities: [
          { identity: ["G"], deckIds: [ELVES, MARWYN] },
          { identity: ["B"], deckIds: [SHEOLDRED] },
          { identity: ["W", "U"], deckIds: [PAIR] },
        ],
        commanders: [
          { names: ["Ezuri, Renegade Leader"], deckIds: [ELVES], isNew: true },
          { names: ["Marwyn, the Nurturer"], deckIds: [MARWYN], isNew: true },
          {
            names: ["Sheoldred, the Apocalypse"],
            deckIds: [SHEOLDRED],
            isNew: true,
          },
          { names: ["Thrasios", "Tymna"], deckIds: [PAIR], isNew: false },
        ],
        cardsUsedMost: [{ name: "Sol Ring", deckIds: commanderDecks }],
        sharedCards: {
          count: 1,
          mostShared: [{ name: "Sol Ring", deckIds: commanderDecks }],
        },
        brackets: [1, 2, 3, 4, 5].map((bracket) => ({
          bracket,
          computedDeckIds: bracket === 1 ? commanderDecks : [],
          targetDeckIds: bracket === 3 ? commanderDecks : [],
        })),
      },
      comboFloorChecked: false,
    });
  });

  it("counts the cards of a deck active in an earlier year when that year is asked for", async () => {
    signInAs(PLAYER);
    seedPartnerPairAndOlderDecks();

    const report = await reportOf(await getStats("?year=2025"));

    expect(report.stats.commanderDeckIds).toEqual([OLD, OLD_PAIR]);
    expect(report.stats.cardsUsedMost).toEqual([
      { name: "Mana Crypt", deckIds: [OLD_PAIR] },
      { name: "Sol Ring", deckIds: [OLD_PAIR] },
    ]);
    expect(report.stats.brackets[2]?.computedDeckIds).toEqual([OLD_PAIR]);
  });

  it("estimates each Commander deck's bracket without combo data and says the combo floor was not checked", async () => {
    signInAs(PLAYER);
    fake.tables.set("deckCard", [
      commanderRow(ELVES, "Ezuri, Renegade Leader", "G"),
      cardRow(ELVES, "Cyclonic Rift", { isGameChanger: true }),
      commanderRow(MARWYN, "Marwyn, the Nurturer", "G"),
    ]);

    const report = await reportOf(await getStats());

    const atBracket = (level: number) =>
      report.stats.brackets.find((entry) => entry.bracket === level);
    expect(atBracket(3)?.computedDeckIds).toEqual([ELVES]);
    expect(atBracket(1)?.computedDeckIds).toEqual([MARWYN, SHEOLDRED]);
    expect(atBracket(3)?.targetDeckIds).toEqual([ELVES, MARWYN, SHEOLDRED]);
    expect(report.comboFloorChecked).toBe(false);
  });
});
