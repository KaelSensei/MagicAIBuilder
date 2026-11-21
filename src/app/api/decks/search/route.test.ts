// @vitest-environment node
/**
 * `GET /api/decks/search`, sociable: the real route, session guard, query
 * parsing (I-75's contract), card search and listing shape, over an
 * in-memory database holding the caller's decks and another player's
 * (I-01, `docs/product/specs/i01-deck-editor-workflow.md`, the library
 * filter line of the nineteenth pass).
 *
 * Two boundaries are faked: the Auth.js session (`auth()`) and the database
 * behind `@/lib/db/prisma` (`src/test/deck-library-db-fake.ts`, which applies
 * PostgreSQL's `ILIKE` rules to the stored rows).
 */
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeckLibraryTables } from "@/test/deck-library-db-fake";
import { deckCard, type FakeDeckCard } from "@/test/playtest-db-fake";

const fake = vi.hoisted(() => {
  const tables: DeckLibraryTables = { users: [], decks: [], cards: [] };
  return { auth: vi.fn(), tables };
});

vi.mock(import("@/lib/auth/config"), () => ({
  auth: fake.auth,
  handlers: {
    GET: async () => new Response(null, { status: 200 }),
    POST: async () => new Response(null, { status: 200 }),
  },
}));

vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
  const { deckLibraryPrisma } = await import("@/test/deck-library-db-fake");
  return deckLibraryPrisma(await importOriginal(), fake.tables);
});

import { GET } from "./route";

const PLAYER = "player-1";
const RIVAL = "player-2";

/** A stored user row with the columns the session guard selects. */
function userRow(id: string) {
  return {
    id,
    name: `Name of ${id}`,
    email: `${id}@example.test`,
    image: null,
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    onboardingDone: true,
  };
}

/** A stored deck row of `userId`, last edited on `day` of November 2026. */
function deckRow(id: string, userId: string, day = 1) {
  return {
    id,
    userId,
    name: `Name of ${id}`,
    format: "commander",
    updatedAt: new Date(Date.UTC(2026, 10, day)),
  };
}

/** A stored card row of `deckId`: one copy in the main deck unless given. */
function cardIn(
  deckId: string,
  name: string,
  overrides: Partial<FakeDeckCard> = {}
): FakeDeckCard {
  return deckCard(name, { id: `${deckId}:${name}`, deckId, ...overrides });
}

/** Signs the caller in as `userId`, as the session cookie would. */
function signInAs(userId: string): void {
  fake.auth.mockResolvedValue({ user: { id: userId } });
}

/** Calls the route with a query string such as `?card=Sol+Ring`. */
function search(query: string): Promise<Response> {
  return GET(new NextRequest(`http://localhost/api/decks/search${query}`));
}

interface SearchAnswer {
  readonly decks: readonly { readonly id: string }[];
  readonly hasMore: boolean;
}

/** The ids of a 200 answer's decks, in the order they came back. */
async function deckIdsOf(response: Response): Promise<readonly string[]> {
  expect(response.status).toBe(200);
  const answer: SearchAnswer = await response.json();
  return answer.decks.map((deck) => deck.id);
}

beforeEach(() => {
  vi.stubEnv("PLAYWRIGHT_TEST", "0");
  fake.auth.mockReset();
  fake.tables.users = [userRow(PLAYER), userRow(RIVAL)];
  fake.tables.decks = [];
  fake.tables.cards = [];
});

describe("GET /api/decks/search", () => {
  it("returns the owner's decks that run the card in the main deck or the command zone, never one holding it only in Considering or the sideboard", async () => {
    fake.tables.decks = [
      deckRow("main", PLAYER, 3),
      deckRow("commander", PLAYER, 2),
      deckRow("considering", PLAYER, 4),
      deckRow("sideboard", PLAYER, 5),
      deckRow("without", PLAYER, 6),
    ];
    fake.tables.cards = [
      cardIn("main", "Sol Ring"),
      cardIn("commander", "Sol Ring", { isCommander: true }),
      cardIn("considering", "Sol Ring", { zone: "maybeboard" }),
      cardIn("sideboard", "Sol Ring", { zone: "sideboard" }),
      cardIn("without", "Arcane Signet"),
    ];
    signInAs(PLAYER);

    const ids = await deckIdsOf(await search("?card=Sol+Ring"));

    expect(ids).toEqual(["main", "commander"]);
  });

  it("returns the owner's other decks when a card is left out", async () => {
    fake.tables.decks = [
      deckRow("ring", PLAYER, 3),
      deckRow("signet", PLAYER, 2),
      deckRow("ring-in-considering", PLAYER, 1),
    ];
    fake.tables.cards = [
      cardIn("ring", "Sol Ring"),
      cardIn("signet", "Arcane Signet"),
      cardIn("ring-in-considering", "Sol Ring", { zone: "maybeboard" }),
    ];
    signInAs(PLAYER);

    const ids = await deckIdsOf(await search("?no-card=Sol+Ring"));

    expect(ids).toEqual(["signet", "ring-in-considering"]);
  });

  it("reads two included cards as both", async () => {
    fake.tables.decks = [
      deckRow("both", PLAYER, 3),
      deckRow("ring-only", PLAYER, 2),
    ];
    fake.tables.cards = [
      cardIn("both", "Sol Ring"),
      cardIn("both", "Arcane Signet"),
      cardIn("ring-only", "Sol Ring"),
    ];
    signInAs(PLAYER);

    const ids = await deckIdsOf(
      await search("?card=Sol+Ring&card=Arcane+Signet")
    );

    expect(ids).toEqual(["both"]);
  });

  it("matches a name whole and in any case, or the front face of a double-faced card, never a partial name", async () => {
    fake.tables.decks = [
      deckRow("fable", PLAYER, 3),
      deckRow("kiki", PLAYER, 2),
      deckRow("fable-of-the-sea", PLAYER, 1),
    ];
    fake.tables.cards = [
      cardIn("fable", "Fable of the Mirror-Breaker // Reflection of Kiki-Jiki"),
      cardIn("kiki", "Kiki-Jiki, Mirror Breaker"),
      cardIn("fable-of-the-sea", "Fable of the Mirror-Breakers"),
    ];
    signInAs(PLAYER);

    const frontFace = await deckIdsOf(
      await search("?card=fable+of+the+mirror-breaker")
    );
    const fullName = await deckIdsOf(
      await search(
        `?card=${encodeURIComponent("FABLE OF THE MIRROR-BREAKER // REFLECTION OF KIKI-JIKI")}`
      )
    );
    const partial = await deckIdsOf(await search("?card=Fable"));
    const backFace = await deckIdsOf(
      await search("?card=Reflection+of+Kiki-Jiki")
    );

    expect(frontFace).toEqual(["fable"]);
    expect(fullName).toEqual(["fable"]);
    expect(partial).toEqual([]);
    expect(backFace).toEqual([]);
  });

  it("reads a percent sign or an underscore in a name as that character, not a wildcard", async () => {
    fake.tables.decks = [
      deckRow("blank", PLAYER, 2),
      deckRow("goblin", PLAYER, 1),
    ];
    fake.tables.cards = [cardIn("blank", "_____"), cardIn("goblin", "Goblin")];
    signInAs(PLAYER);

    const blanks = await deckIdsOf(await search("?card=_____"));
    const percent = await deckIdsOf(await search("?card=%25"));

    expect(blanks).toEqual(["blank"]);
    expect(percent).toEqual([]);
  });

  it("never returns another account's deck, and reads the caller's private decks", async () => {
    fake.tables.decks = [
      { ...deckRow("mine", PLAYER, 2), isPublic: false },
      { ...deckRow("theirs", RIVAL, 3), isPublic: true },
    ];
    fake.tables.cards = [
      cardIn("mine", "Sol Ring"),
      cardIn("theirs", "Sol Ring"),
    ];
    signInAs(PLAYER);

    const included = await deckIdsOf(await search("?card=Sol+Ring"));
    const excluded = await deckIdsOf(await search("?no-card=Arcane+Signet"));

    expect(included).toEqual(["mine"]);
    expect(excluded).toEqual(["mine"]);
  });

  it("answers a deck in the library's listing shape: its command zone and its card count", async () => {
    fake.tables.decks = [deckRow("talrand", PLAYER)];
    fake.tables.cards = [
      cardIn("talrand", "Talrand, Sky Summoner", {
        isCommander: true,
        category: "commander",
      }),
      cardIn("talrand", "Sol Ring"),
      cardIn("talrand", "Island", { quantity: 30, category: "land" }),
    ];
    signInAs(PLAYER);

    const response = await search("?card=Sol+Ring");

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(await response.json()).toMatchObject({
      decks: [
        {
          id: "talrand",
          name: "Name of talrand",
          cards: [{ name: "Talrand, Sky Summoner", isCommander: true }],
          _count: { cards: 3 },
          cardCopyCount: 32,
        },
      ],
      hasMore: false,
    });
  });

  it("returns the 50 most recently edited matching decks and says more passed", async () => {
    const ids = Array.from({ length: 51 }, (_, index) => `deck-${index + 1}`);
    fake.tables.decks = ids.map((id, index) => deckRow(id, PLAYER, index + 1));
    fake.tables.cards = ids.map((id) => cardIn(id, "Sol Ring"));
    signInAs(PLAYER);

    const response = await search("?card=Sol+Ring");
    const answer: SearchAnswer = await response.json();

    expect(answer.decks).toHaveLength(50);
    expect(answer.decks[0]?.id).toBe("deck-51");
    expect(answer.decks.map((deck) => deck.id)).not.toContain("deck-1");
    expect(answer.hasMore).toBe(true);
  });

  it("answers 400 when no card is named", async () => {
    signInAs(PLAYER);

    const response = await search("?card=++&q=Sol+Ring");

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Name at least one card" });
  });

  it("answers 401 to a signed-out request and reads no deck", async () => {
    fake.tables.decks = [deckRow("mine", PLAYER)];
    fake.tables.cards = [cardIn("mine", "Sol Ring")];
    fake.auth.mockResolvedValue(null);

    const response = await search("?card=Sol+Ring");

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
  });

  it("answers 401 when the session's account no longer exists", async () => {
    signInAs("deleted-player");

    const response = await search("?card=Sol+Ring");

    expect(response.status).toBe(401);
  });
});
