/**
 * Characterization suite for the deck store's `isSyncing` flag across
 * concurrent writes, and for the save failures the player is never told about.
 *
 * `isSyncing` is set to `hasPendingSaves()` when a write settles
 * (`store.ts:219-226`). Only some writes are counted there, so the flag
 * depends on which writes overlap. This suite pins that truth table, gaps
 * included, before DB-11 replaces the nine counters and maps with one save
 * tracker that must keep the same membership. B2-36 then flips the rows named
 * "currently … (pinned; see B2-36)" one by one.
 *
 * Every test loads a fresh store module, so the module-level counters start
 * at zero. No internal module is mocked: the store's requests reach a fake of
 * the deck API routes through a stubbed `fetch`, which can hold a request
 * until the test releases it.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type * as StoreModule from "@/lib/deck/store";
import type { DeckAction, DeckStore } from "@/lib/deck/store";
import type * as ToastModule from "@/hooks/useToast";
import type { Deck, DeckCard } from "@/lib/deck/types";
import type { ScryfallCard } from "@/lib/scryfall/types";

const DECK_ID = "deck-1";
const DECK_ROUTE = `/api/decks/${DECK_ID}`;
const CARDS_ROUTE = `${DECK_ROUTE}/cards`;

// ---------------------------------------------------------------------------
// Fake deck API
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** A deck as `GET /api/decks/[id]` returns it, with no cards. */
function apiDeck(id: string): Record<string, unknown> {
  return {
    id,
    name: "Goblins",
    format: "commander",
    targetBracket: 3,
    manualBracket: null,
    budget: null,
    description: "",
    tags: [],
    pairingType: "none",
    commanderId: null,
    commanderName: null,
    partnerId: null,
    companionId: null,
    cards: [],
    createdAt: "2026-11-10T00:00:00.000Z",
    updatedAt: "2026-11-10T00:00:00.000Z",
  };
}

/** A held request: `arrived` settles when it comes in, `released` lets it answer. */
interface Gate {
  readonly arrived: PromiseWithResolvers<void>;
  readonly released: PromiseWithResolvers<void>;
}

/**
 * Stands in for the deck API routes. Every request succeeds with a plausible
 * body unless the test holds it (it then waits for `release`) or fails it.
 */
function createDeckServer() {
  const routes: string[] = [];
  const held = new Map<string, Gate>();
  const failing = new Set<string>();
  let savedRows = 0;

  function answer(method: string, path: string, body: unknown): Response {
    if (method === "DELETE") return new Response(null, { status: 204 });
    if (method === "POST" && path.endsWith("/cards")) {
      savedRows += 1;
      return json(
        { ...(isRecord(body) ? body : {}), id: `row-saved-${savedRows}` },
        201
      );
    }
    if (method === "POST" && path.endsWith("/duplicate")) {
      return json({ id: "deck-copy", name: "Goblins (copy)" }, 201);
    }
    if (method === "GET" && path === "/api/decks") {
      return json({ decks: [apiDeck(DECK_ID)], total: 1, page: 0, limit: 20 });
    }
    if (/\/cards\/[^/]+$/.test(path)) return json({});
    return json(apiDeck(path.split("/")[3] ?? "deck-new"));
  }

  async function fetch(
    input: string | URL | Request,
    init: RequestInit = {}
  ): Promise<Response> {
    const url = typeof input === "string" ? input : input.toString();
    const method = init.method ?? "GET";
    const path = url.split("?")[0];
    const route = `${method} ${path}`;
    const body: unknown =
      typeof init.body === "string" ? JSON.parse(init.body) : undefined;
    routes.push(route);
    const hold = held.get(route);
    if (hold) {
      held.delete(route);
      hold.arrived.resolve();
      await hold.released.promise;
    }
    if (failing.delete(route)) return json({ error: "Simulated failure" }, 500);
    return answer(method, path, body);
  }

  return {
    fetch,
    /** Routes received so far, as "METHOD /path". */
    routes,
    /** Holds the next request to `route` until `release` is called. */
    hold(route: string) {
      const gate: Gate = {
        arrived: Promise.withResolvers<void>(),
        released: Promise.withResolvers<void>(),
      };
      held.set(route, gate);
      return {
        arrived: gate.arrived.promise,
        release: () => gate.released.resolve(),
      };
    },
    /** Answers the next request to `route` with a 500. */
    fail(route: string) {
      failing.add(route);
    },
  };
}

// ---------------------------------------------------------------------------
// Cards and the open deck
// ---------------------------------------------------------------------------

function slug(name: string): string {
  return name.toLowerCase().replaceAll(/[^a-z]+/g, "-");
}

function scryfallCard(
  name: string,
  overrides: Partial<ScryfallCard> = {}
): ScryfallCard {
  return {
    id: `scry-${slug(name)}`,
    name,
    cmc: 2,
    type_line: "Creature — Bear",
    oracle_text: "",
    color_identity: ["G"],
    keywords: [],
    ...overrides,
  };
}

function deckCard(name: string, overrides: Partial<DeckCard> = {}): DeckCard {
  return {
    id: `row-${slug(name)}`,
    scryfallId: `scry-${slug(name)}`,
    name,
    manaCost: "",
    cmc: 1,
    typeLine: "Artifact",
    oracleText: "",
    colorIdentity: [],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
    category: "artifact",
    quantity: 1,
    zone: "main",
    ...overrides,
  };
}

const KRENKO = deckCard("Krenko, Mob Boss", {
  typeLine: "Legendary Creature — Goblin Warrior",
  colorIdentity: ["R"],
  category: "commander",
});
const SOL_RING = deckCard("Sol Ring", { category: "ramp" });
const MOUNTAIN = deckCard("Mountain", {
  typeLine: "Basic Land — Mountain",
  category: "land",
  quantity: 10,
});
const PROBE_CARD = deckCard("Goblin Instigator", {
  typeLine: "Creature — Goblin Rogue",
  category: "creature",
});
const COUNTERSPELL = deckCard("Counterspell", {
  typeLine: "Instant",
  category: "instant",
  zone: "maybeboard",
});
const ARCANE_SIGNET = deckCard("Arcane Signet", { category: "ramp" });
const JEGANTHA = deckCard("Jegantha, the Wellspring", {
  typeLine: "Legendary Creature — Elemental Elk",
  category: "companion",
});

const GRIZZLY_BEARS = scryfallCard("Grizzly Bears");
const PURPHOROS = scryfallCard("Purphoros, God of the Forge", {
  type_line: "Legendary Enchantment Creature — God",
  color_identity: ["R"],
});
const LURRUS = scryfallCard("Lurrus of the Dream-Den", {
  type_line: "Legendary Creature — Cat Nightmare",
  oracle_text:
    "Companion — Each permanent card in your starting deck has mana value 2 or less.",
  keywords: ["Companion", "Lifelink"],
});
const SOL_RING_PRINTING = scryfallCard("Sol Ring", {
  id: "scry-sol-ring-c21",
  type_line: "Artifact",
  image_uris: {
    grid: "https://img.test/sol-ring-c21-grid.webp",
    art: "https://img.test/sol-ring-c21-art.webp",
  },
});

function openDeck(overrides: Partial<Deck> = {}): Deck {
  const cards = overrides.cards ?? [
    SOL_RING,
    MOUNTAIN,
    PROBE_CARD,
    COUNTERSPELL,
  ];
  return {
    id: DECK_ID,
    name: "Goblins",
    commander: KRENKO,
    partner: null,
    companion: null,
    pairingType: "none",
    format: "commander",
    cardCount: 0,
    targetBracket: 3,
    manualBracket: null,
    budget: null,
    description: "",
    tags: ["tokens"],
    shareToken: null,
    shareEnabled: false,
    isPublic: false,
    isAIGenerated: false,
    createdAt: new Date("2026-11-10T00:00:00.000Z"),
    updatedAt: new Date("2026-11-10T00:00:00.000Z"),
    ...overrides,
    cards,
    maybeboard: cards.filter((card) => card.zone === "maybeboard"),
  };
}

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

let server: ReturnType<typeof createDeckServer>;
let useDeckStore: (typeof StoreModule)["useDeckStore"];
let useToastStore: (typeof ToastModule)["useToastStore"];

beforeEach(async () => {
  server = createDeckServer();
  vi.stubGlobal("fetch", server.fetch);
  vi.resetModules();
  ({ useDeckStore } = await import("@/lib/deck/store"));
  ({ useToastStore } = await import("@/hooks/useToast"));
  useDeckStore.setState({
    decks: { [DECK_ID]: openDeck() },
    activeDeckId: DECK_ID,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function isSyncing(): boolean {
  return useDeckStore.getState().isSyncing;
}

function deck(): Deck | undefined {
  return useDeckStore.getState().decks[DECK_ID];
}

function toastMessages(): string[] {
  return useToastStore.getState().toasts.map((toast) => toast.message);
}

/** A tracked write on its own card: settling it recomputes `isSyncing` from the shared count. */
const PROBE = {
  route: `PATCH ${CARDS_ROUTE}/${PROBE_CARD.id}`,
  run: () => useDeckStore.getState().updateCardCategory(PROBE_CARD.id, "draw"),
};

// ---------------------------------------------------------------------------
// The truth table
// ---------------------------------------------------------------------------

interface SavePath {
  /** The store call, as test names show it. */
  readonly call: string;
  /** The first request the call sends, as "METHOD /path": the one a test holds. */
  readonly route: string;
  readonly run: (store: DeckStore) => Promise<unknown>;
  /** State the call needs beyond the open deck. */
  readonly given?: () => Partial<DeckStore>;
}

const PATCH_DECK = `PATCH ${DECK_ROUTE}`;
const POST_CARD = `POST ${CARDS_ROUTE}`;
const patchCard = (card: DeckCard) => `PATCH ${CARDS_ROUTE}/${card.id}`;
const deleteCard = (card: DeckCard) => `DELETE ${CARDS_ROUTE}/${card.id}`;

function undoOf(
  action: DeckAction,
  cards?: DeckCard[]
): () => Partial<DeckStore> {
  return () => ({
    decks: { [DECK_ID]: openDeck(cards ? { cards } : {}) },
    undoStack: [action],
  });
}

const UNDO_ZONE_MOVE = undoOf(
  {
    type: "MOVE_ZONE",
    deckId: DECK_ID,
    cardId: SOL_RING.id,
    from: "main",
    to: "sideboard",
  },
  [{ ...SOL_RING, zone: "sideboard" }, PROBE_CARD]
);
const UNDO_ADDITION = undoOf({
  type: "ADD_CARD",
  deckId: DECK_ID,
  card: SOL_RING,
});
const UNDO_REMOVAL = undoOf({
  type: "REMOVE_CARD",
  deckId: DECK_ID,
  card: ARCANE_SIGNET,
});
const BULK_EDIT_REMOVING_SOL_RING = {
  removedCardIds: [SOL_RING.id],
  quantityChanges: [],
  additions: [],
  commandZone: null,
};

/** Counted by `hasPendingSaves()`: another write settling first leaves the flag up. */
// prettier-ignore
const TRACKED: readonly SavePath[] = [
  { call: "addCard", route: POST_CARD, run: (s) => s.addCard(GRIZZLY_BEARS) },
  { call: "removeCard", route: deleteCard(SOL_RING), run: (s) => s.removeCard(SOL_RING.id) },
  { call: "bulkRemoveCards", route: deleteCard(SOL_RING), run: (s) => s.bulkRemoveCards([SOL_RING.id]) },
  { call: "updateCardQuantity", route: patchCard(MOUNTAIN), run: (s) => s.updateCardQuantity(MOUNTAIN.id, -1) },
  { call: "updateCardCategory", route: patchCard(SOL_RING), run: (s) => s.updateCardCategory(SOL_RING.id, "artifact") },
  { call: "updateCardNotes", route: patchCard(SOL_RING), run: (s) => s.updateCardNotes(SOL_RING.id, "Turn one") },
  { call: "moveCardToZone", route: patchCard(SOL_RING), run: (s) => s.moveCardToZone(SOL_RING.id, "sideboard") },
  { call: "bulkMoveToZone", route: patchCard(SOL_RING), run: (s) => s.bulkMoveToZone([SOL_RING.id], "sideboard") },
  { call: "moveToMaybeboard", route: patchCard(SOL_RING), run: (s) => s.moveToMaybeboard(SOL_RING.id) },
  { call: "moveToDeck", route: patchCard(COUNTERSPELL), run: (s) => s.moveToDeck(COUNTERSPELL.id) },
  { call: "undo of a zone move", route: patchCard(SOL_RING), run: (s) => s.undo(), given: UNDO_ZONE_MOVE },
  { call: "renameDeck", route: PATCH_DECK, run: (s) => s.renameDeck(DECK_ID, "Goblin Horde") },
  { call: "setManualBracket", route: PATCH_DECK, run: (s) => s.setManualBracket(3) },
  { call: "setBudget", route: PATCH_DECK, run: (s) => s.setBudget(150) },
];

/** Raise the flag, but are not counted: another write settling first clears it. */
// prettier-ignore
const UNTRACKED: readonly SavePath[] = [
  { call: "setCommander", route: PATCH_DECK, run: (s) => s.setCommander(PURPHOROS) },
  { call: "clearCommander", route: PATCH_DECK, run: (s) => s.clearCommander() },
  { call: "setPartner", route: PATCH_DECK, run: (s) => s.setPartner(null) },
  { call: "setCompanion", route: POST_CARD, run: (s) => s.setCompanion(LURRUS) },
  { call: "addDeckCard", route: POST_CARD, run: (s) => s.addDeckCard(ARCANE_SIGNET) },
  { call: "swapCardPrinting", route: patchCard(SOL_RING), run: (s) => s.swapCardPrinting(SOL_RING.id, SOL_RING_PRINTING) },
  { call: "updateDeckDescription", route: PATCH_DECK, run: (s) => s.updateDeckDescription(DECK_ID, "Go wide") },
  { call: "addTag", route: PATCH_DECK, run: (s) => s.addTag(DECK_ID, "haste") },
  { call: "removeTag", route: PATCH_DECK, run: (s) => s.removeTag(DECK_ID, "tokens") },
  { call: "setTargetBracket", route: PATCH_DECK, run: (s) => s.setTargetBracket(3) },
  { call: "applyBulkEdit", route: `PATCH ${CARDS_ROUTE}`, run: (s) => s.applyBulkEdit(BULK_EDIT_REMOVING_SOL_RING) },
  { call: "createDeck", route: "POST /api/decks", run: (s) => s.createDeck("Elves") },
  { call: "duplicateDeck", route: `POST ${DECK_ROUTE}/duplicate`, run: (s) => s.duplicateDeck(DECK_ID) },
  { call: "deleteDeck", route: `DELETE ${DECK_ROUTE}`, run: (s) => s.deleteDeck(DECK_ID) },
  { call: "loadDecks", route: "GET /api/decks", run: (s) => s.loadDecks() },
  { call: "forceSave", route: `GET ${DECK_ROUTE}`, run: (s) => s.forceSave() },
  { call: "reloadActiveDeck", route: `GET ${DECK_ROUTE}`, run: (s) => s.reloadActiveDeck() },
];

/** Never raise the flag at all. */
// prettier-ignore
const SILENT: readonly SavePath[] = [
  { call: "addToMaybeboard", route: POST_CARD, run: (s) => s.addToMaybeboard(GRIZZLY_BEARS) },
  { call: "removeFromMaybeboard", route: deleteCard(COUNTERSPELL), run: (s) => s.removeFromMaybeboard(COUNTERSPELL.id) },
  { call: "undo of an addition", route: deleteCard(SOL_RING), run: (s) => s.undo(), given: UNDO_ADDITION },
  { call: "undo of a removal", route: POST_CARD, run: (s) => s.undo(), given: UNDO_REMOVAL },
];

function cases(paths: readonly SavePath[]): [string, SavePath][] {
  return paths.map((path) => [path.call, path]);
}

/**
 * Starts `path` and holds its first request, so the test can observe the
 * store while that save is in flight.
 *
 * @returns the running call and a function that lets its request answer
 */
async function startHeld(
  path: SavePath
): Promise<{ settled: Promise<unknown>; release: () => void }> {
  if (path.given) useDeckStore.setState(path.given());
  const gate = server.hold(path.route);
  const settled = path.run(useDeckStore.getState());
  await gate.arrived;
  return { settled, release: gate.release };
}

describe("isSyncing while one save is in flight and another settles", () => {
  it.each(cases(TRACKED))(
    "%s keeps isSyncing true until its own request settles, even when another save settles first",
    async (_call, path) => {
      const { settled, release } = await startHeld(path);
      expect(isSyncing()).toBe(true);

      await PROBE.run();
      expect(isSyncing()).toBe(true);

      release();
      await settled;
      expect(isSyncing()).toBe(false);
    }
  );

  it.each(cases(UNTRACKED))(
    "%s raises isSyncing, but currently another save settling first clears it while its own request is in flight (pinned; see B2-36)",
    async (_call, path) => {
      const { settled, release } = await startHeld(path);
      expect(isSyncing()).toBe(true);

      await PROBE.run();
      expect(isSyncing()).toBe(false);

      release();
      await settled;
      expect(isSyncing()).toBe(false);
    }
  );

  it.each(cases(SILENT))(
    "%s currently never raises isSyncing while its request is in flight (pinned; see B2-36)",
    async (_call, path) => {
      const { settled, release } = await startHeld(path);
      expect(isSyncing()).toBe(false);

      release();
      await settled;
      expect(isSyncing()).toBe(false);
    }
  );

  it.each(cases([...TRACKED, ...UNTRACKED, ...SILENT]))(
    "%s leaves isSyncing true when it settles while another save is still in flight",
    async (_call, path) => {
      if (path.given) useDeckStore.setState(path.given());
      const probeGate = server.hold(PROBE.route);
      const probe = PROBE.run();
      await probeGate.arrived;

      await path.run(useDeckStore.getState());
      expect(isSyncing()).toBe(true);

      probeGate.release();
      await probe;
      expect(isSyncing()).toBe(false);
    }
  );
});

// ---------------------------------------------------------------------------
// Failures the player is not told about
// ---------------------------------------------------------------------------

describe("save failures the store does not surface", () => {
  beforeEach(() => {
    // The store logs each failure; the log is not what these tests observe.
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("addDeckCard currently keeps the optimistic row under its temporary id and shows no error when the save fails (pinned; see B2-36)", async () => {
    server.fail(`POST ${CARDS_ROUTE}`);

    await useDeckStore.getState().addDeckCard(ARCANE_SIGNET);

    expect(
      deck()?.cards.find((card) => card.name === "Arcane Signet")?.id
    ).toBe(ARCANE_SIGNET.id);
    expect(toastMessages()).toEqual([]);
  });

  it("addToMaybeboard currently takes the row back but shows no error when the save fails (pinned; see B2-36)", async () => {
    server.fail(`POST ${CARDS_ROUTE}`);

    await useDeckStore.getState().addToMaybeboard(GRIZZLY_BEARS);

    expect(deck()?.maybeboard.map((card) => card.name)).toEqual([
      "Counterspell",
    ]);
    expect(toastMessages()).toEqual([]);
  });

  it("removeFromMaybeboard currently keeps the row removed and shows no error when the delete fails (pinned; see B2-36)", async () => {
    server.fail(`DELETE ${CARDS_ROUTE}/${COUNTERSPELL.id}`);

    await useDeckStore.getState().removeFromMaybeboard(COUNTERSPELL.id);

    expect(deck()?.maybeboard).toEqual([]);
    expect(toastMessages()).toEqual([]);
  });

  it("setCompanion currently shows the new companion only once its saves succeed (pinned; see B2-36)", async () => {
    const gate = server.hold(`POST ${CARDS_ROUTE}`);
    const saving = useDeckStore.getState().setCompanion(LURRUS);
    await gate.arrived;

    expect(deck()?.companion).toBeNull();

    gate.release();
    await saving;
    expect(deck()?.companion?.name).toBe("Lurrus of the Dream-Den");
  });

  it("setCompanion currently keeps showing the replaced companion after the server deleted it, when a later save fails (pinned; see B2-36)", async () => {
    useDeckStore.setState({
      decks: { [DECK_ID]: openDeck({ companion: JEGANTHA }) },
    });
    server.fail(`PATCH ${DECK_ROUTE}`);

    await useDeckStore.getState().setCompanion(LURRUS);

    expect(server.routes).toEqual([
      `DELETE ${CARDS_ROUTE}/${JEGANTHA.id}`,
      `POST ${CARDS_ROUTE}`,
      `PATCH ${DECK_ROUTE}`,
    ]);
    expect(deck()?.companion?.name).toBe("Jegantha, the Wellspring");
    expect(toastMessages()).toEqual(["Could not save companion — try again"]);
  });
});
