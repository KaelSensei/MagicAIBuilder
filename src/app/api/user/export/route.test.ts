// @vitest-environment node
/**
 * `GET /api/user/export`, sociable: the real route, guard, rate limit, reader
 * and archive builder, over an in-memory database that holds the caller's
 * rows and other players' (I-38 requirement 7, slice 4).
 *
 * Two boundaries are faked: the Auth.js session (`auth()`) and the database
 * behind `@/lib/db/prisma` (`src/test/in-memory-prisma-tables.ts`, which
 * honours `where` and `select`, so a leak through either would show here).
 * The 401 without a session is pinned by `src/app/api/route-policy.test.ts`.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { accountArchiveSchema } from "@/lib/account-export/archive-schema";
import {
  FAN_EMAIL,
  PLAYER,
  RIVAL,
  SECRETS,
  seedAccounts,
} from "@/test/account-export-seed";

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

const HOUR_MS = 60 * 60 * 1000;

/** Key names a credential travels under. */
const CREDENTIAL_KEY = /password|hash|token|secret/i;

/** Signs the caller in as `userId`, as the session cookie would. */
function signInAs(userId: string): void {
  fake.auth.mockResolvedValue({ user: { id: userId } });
}

/** @returns every key of every object in `value`, at any depth */
function keysDeep(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(keysDeep);
  if (typeof value !== "object" || value === null) return [];
  return Object.entries(value).flatMap(([key, child]) => [
    key,
    ...keysDeep(child),
  ]);
}

/** Moves the clock past the export budget's window, so each test starts fresh. */
let clock = Date.parse("2026-11-19T10:00:00.000Z");

beforeEach(() => {
  clock += 2 * HOUR_MS;
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(clock);
  vi.stubEnv("PLAYWRIGHT_TEST", "0");
  fake.auth.mockReset();
  seedAccounts(fake.tables);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("GET /api/user/export", () => {
  it("returns the caller's decks and collection and no other player's rows", async () => {
    signInAs(PLAYER);

    const response = await GET();

    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain("Atraxa superfriends");
    expect(text).toContain("Sol Ring");
    expect(text).toContain("Arcane Signet");
    expect(text).not.toContain("Rival's secret deck");
    expect(text).not.toContain("Mana Crypt");
    expect(text).not.toContain("Jeweled Lotus");
    expect(text).not.toContain("Rival review");
    expect(text).not.toContain("Rival comment on your deck");
    expect(text).not.toContain("Rival package");
    expect(text).not.toContain(RIVAL);
  });

  it("validates against the published schema, with a row in every section the caller has", async () => {
    signInAs(PLAYER);

    const archive = accountArchiveSchema.parse(await (await GET()).json());

    expect(archive.schemaVersion).toBe(1);
    expect(archive.generatedAt).toBe(new Date(clock).toISOString());
    expect(archive.profile).toMatchObject({ id: PLAYER, username: "kael" });
    expect(archive.decks.map((deck) => deck.cards.length)).toEqual([2]);
    expect(archive.decks[0]?.snapshots.map((shot) => shot.name)).toEqual([
      "Before the cut",
    ]);
    expect(archive.cardPackages[0]?.cards.map((card) => card.name)).toEqual([
      "Command Tower",
    ]);
    expect(archive.aiUsage.monthlyCounts).toEqual([
      { key: "ai.build", periodStart: "2026-10-01T09:00:00.000Z", used: 3 },
    ]);
    const counts = {
      deckFolders: archive.deckFolders.length,
      collection: archive.collection.length,
      acquisitionIntents: archive.acquisitionIntents.length,
      ratings: archive.ratings.length,
      votes: archive.votes.length,
      comments: archive.comments.length,
      playtests: archive.playtests.length,
      following: archive.following.length,
      followers: archive.followers.length,
      savedDecks: archive.savedDecks.length,
      publicDeckFolders: archive.publicDeckFolders.length,
      apiKeys: archive.apiKeys.length,
      reportsFiled: archive.reportsFiled.length,
      aiCalls: archive.aiUsage.calls.length,
    };
    expect(Object.values(counts).every((count) => count === 1)).toBe(true);
    expect(archive.notificationPreferences?.mentions).toBe(false);
  });

  it("holds no key named like a password, hash, token or secret, and no credential value", async () => {
    signInAs(PLAYER);

    const text = await (await GET()).text();

    expect(
      keysDeep(JSON.parse(text)).filter((key) => CREDENTIAL_KEY.test(key))
    ).toEqual([]);
    expect(
      Object.values(SECRETS).filter((secret) => text.includes(secret))
    ).toEqual([]);
  });

  it("names the other player of each follow by public handle and date only", async () => {
    signInAs(PLAYER);

    const archive = accountArchiveSchema.parse(await (await GET()).json());

    expect(archive.following).toEqual([
      { username: "rival", since: "2026-10-01T09:00:00.000Z" },
    ]);
    expect(archive.followers).toEqual([
      { username: "fan", since: "2026-10-01T09:00:00.000Z" },
    ]);
    expect(JSON.stringify(archive)).not.toContain(FAN_EMAIL);
  });

  it("carries each deck as the builder's plain-text list", async () => {
    signInAs(PLAYER);

    const archive = accountArchiveSchema.parse(await (await GET()).json());

    expect(archive.decks[0]?.plainText).toBe(
      [
        "Commander",
        "1 Atraxa, Praetors' Voice",
        "",
        "Deck",
        "1 Sol Ring",
        "// Note: Turn one, always",
      ].join("\n")
    );
  });

  it("counts each snapshot's card copies as the deck list does, and keeps the stored number of a list it cannot read", async () => {
    const storedRow = (name: string, overrides: Record<string, unknown>) => ({
      scryfallId: `printing-${name}`,
      name,
      quantity: 1,
      zone: "main",
      category: "other",
      isCommander: false,
      isPartner: false,
      ...overrides,
    });
    fake.tables.set("deckSnapshot", [
      {
        id: "snapshot-rows",
        deckId: "deck-mine",
        name: "Saved when rows were counted",
        cardList: [
          storedRow("Atraxa, Praetors' Voice", { isCommander: true }),
          storedRow("Forest", { quantity: 30 }),
          storedRow("Sol Ring", {}),
          storedRow("Swords to Plowshares", { zone: "sideboard" }),
        ],
        commander: "Atraxa, Praetors' Voice",
        cardCount: 4,
        createdAt: new Date("2026-10-01T09:00:00.000Z"),
      },
      {
        id: "snapshot-unreadable",
        deckId: "deck-mine",
        name: "Unreadable",
        cardList: [{ name: "Sol Ring" }],
        commander: null,
        cardCount: 2,
        createdAt: new Date("2026-10-01T09:00:00.000Z"),
      },
    ]);
    signInAs(PLAYER);

    const archive = accountArchiveSchema.parse(await (await GET()).json());

    const counts = Object.fromEntries(
      (archive.decks[0]?.snapshots ?? []).map((shot) => [
        shot.name,
        shot.cardCount,
      ])
    );
    expect(counts).toEqual({
      "Saved when rows were counted": 32,
      Unreadable: 2,
    });
  });

  it("answers a JSON attachment with a dated file name, never cached", async () => {
    signInAs(PLAYER);

    const response = await GET();

    expect(response.headers.get("content-type")).toBe(
      "application/json; charset=utf-8"
    );
    expect(response.headers.get("content-disposition")).toBe(
      `attachment; filename="magicaibuilder-account-${new Date(clock).toISOString().slice(0, 10)}.json"`
    );
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("refuses a second export within the hour with 429 and Retry-After, and still serves another player", async () => {
    signInAs(PLAYER);
    expect((await GET()).status).toBe(200);
    vi.setSystemTime(clock + HOUR_MS / 2);

    const refused = await GET();
    signInAs(RIVAL);
    const otherPlayer = await GET();

    expect(refused.status).toBe(429);
    expect(refused.headers.get("retry-after")).toBe(String(30 * 60));
    expect(await refused.json()).toEqual({ error: expect.any(String) });
    expect(otherPlayer.status).toBe(200);
  });

  it("serves the caller again once the hour has passed", async () => {
    signInAs(PLAYER);
    expect((await GET()).status).toBe(200);
    vi.setSystemTime(clock + HOUR_MS);

    const again = await GET();

    expect(again.status).toBe(200);
  });
});
