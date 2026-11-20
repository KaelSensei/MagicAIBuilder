import { beforeEach, describe, expect, it, vi } from "vitest";

const { auth, findUser, findDeck, findSheet, createSheet, updateSheets } =
  vi.hoisted(() => ({
    auth: vi.fn(),
    findUser: vi.fn(),
    findDeck: vi.fn(),
    findSheet: vi.fn(),
    createSheet: vi.fn(),
    updateSheets: vi.fn(),
  }));

vi.mock(import("@/lib/auth/config"), () => ({
  auth,
  handlers: {
    GET: async () => new Response(null, { status: 200 }),
    POST: async () => new Response(null, { status: 200 }),
  },
  signIn: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
  const { stubPrisma } = await import("@/test/prisma-stub");
  return stubPrisma(await importOriginal(), {
    user: { findUnique: findUser },
    deck: { findUnique: findDeck },
    ruleZeroSheet: {
      findUnique: findSheet,
      create: createSheet,
      updateMany: updateSheets,
    },
  });
});

import { GET, PATCH, POST } from "./route";

const DECLARED = {
  speed: "core",
  winConditions: ["Combat damage"],
  combos: { present: false, note: "" },
  extraTurns: { present: false, note: "" },
  resourceDenial: { present: false, note: "" },
  proxyCount: 0,
  houseRules: "No mass land denial.",
};

const OWNER = {
  id: "user-1",
  name: "Ada",
  email: "ada@example.com",
  image: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  onboardingDone: true,
};

const ROW = {
  id: "sheet-1",
  ownerId: "user-1",
  deckId: "deck-1",
  speed: "core",
  winConditions: ["Combat damage"],
  hasCombos: false,
  combosNote: "",
  hasExtraTurns: false,
  extraTurnsNote: "",
  hasResourceDenial: false,
  resourceDenialNote: "",
  proxyCount: 0,
  houseRules: "No mass land denial.",
  createdAt: new Date("2026-11-20T12:00:00.000Z"),
  updatedAt: new Date("2026-11-20T12:00:00.000Z"),
};

const params = { params: Promise.resolve({ id: "deck-1" }) };

function post(body: unknown) {
  return new Request("http://localhost/api/decks/deck-1/rule-zero", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue({ user: { id: "user-1" } });
  findUser.mockResolvedValue(OWNER);
  findDeck.mockResolvedValue({ id: "deck-1", userId: "user-1" });
  findSheet.mockResolvedValue(null);
  createSheet.mockResolvedValue(ROW);
  updateSheets.mockResolvedValue({ count: 1 });
});

describe("GET /api/decks/[id]/rule-zero", () => {
  it("refuses a caller who does not own the deck before reading a sheet", async () => {
    auth.mockResolvedValue({ user: { id: "stranger" } });
    findUser.mockResolvedValue({ ...OWNER, id: "stranger" });

    const response = await GET(
      new Request("http://localhost/api/decks/deck-1/rule-zero"),
      params
    );

    expect(response.status).toBe(403);
    expect(findSheet).not.toHaveBeenCalled();
  });

  it("returns null when the owner has not written a sheet", async () => {
    const response = await GET(
      new Request("http://localhost/api/decks/deck-1/rule-zero"),
      params
    );

    expect(await response.json()).toEqual({ sheet: null });
  });

  it("returns the owner's declared fields and not a computed bracket", async () => {
    findSheet.mockResolvedValue(ROW);

    const response = await GET(
      new Request("http://localhost/api/decks/deck-1/rule-zero"),
      params
    );

    expect(await response.json()).toEqual({
      sheet: {
        id: "sheet-1",
        deckId: "deck-1",
        ...DECLARED,
        createdAt: "2026-11-20T12:00:00.000Z",
        updatedAt: "2026-11-20T12:00:00.000Z",
      },
    });
  });
});

describe("POST /api/decks/[id]/rule-zero", () => {
  it("stores a declared sheet and ignores a deck list in the body", async () => {
    const response = await POST(
      post({ ...DECLARED, cards: ["Sol Ring"] }),
      params
    );

    expect(response.status).toBe(201);
    expect(createSheet).toHaveBeenCalledOnce();
    const payload: unknown = createSheet.mock.calls[0]?.[0];
    expect(payload).toMatchObject({
      data: {
        deckId: "deck-1",
        ownerId: "user-1",
        speed: "core",
        houseRules: "No mass land denial.",
      },
    });
    expect(JSON.stringify(payload)).not.toContain("Sol Ring");
  });

  it("refuses a speed the sheet does not declare and stores nothing", async () => {
    const response = await POST(post({ ...DECLARED, speed: "fast" }), params);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid rule 0 sheet" });
    expect(createSheet).not.toHaveBeenCalled();
  });

  it("does not overwrite a sheet the deck already has", async () => {
    findSheet.mockResolvedValue(ROW);

    const response = await POST(post(DECLARED), params);

    expect(response.status).toBe(409);
    expect(createSheet).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/decks/[id]/rule-zero", () => {
  it("answers not found for a deck with no sheet and for another owner's sheet", async () => {
    const request = () =>
      new Request("http://localhost/api/decks/deck-1/rule-zero", {
        method: "PATCH",
        body: JSON.stringify(DECLARED),
      });

    const missing = await PATCH(request(), params);
    expect(missing.status).toBe(404);
    expect(updateSheets).not.toHaveBeenCalled();

    findSheet.mockResolvedValue({ ...ROW, ownerId: "someone-else" });
    const hidden = await PATCH(request(), params);
    expect(hidden.status).toBe(404);
    expect(updateSheets).not.toHaveBeenCalled();
  });
});
