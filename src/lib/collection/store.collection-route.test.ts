/**
 * Sociable tests that send the collection store's edits to the real
 * `/api/collection/[id]` route handlers over an in-memory table.
 *
 * The store's own tests mock `fetch` with hand-written bodies. Those mocks
 * once assumed a bare card where the route answers with an envelope, which hid
 * a bug: every quantity edit rolled back on screen although the server had
 * saved it. Here the body is whatever the route really returns.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DELETE, PATCH } from "@/app/api/collection/[id]/route";
import {
  collectionDb,
  collectionRow,
  type FakeCollectionRow,
  wireRow,
} from "@/test/collection-db-fake";
import { useCollectionStore } from "./store";

vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
  const { stubPrisma } = await import("@/test/prisma-stub");
  const { collectionDb: db } = await import("@/test/collection-db-fake");
  return stubPrisma(await importOriginal(), db.prisma);
});

vi.mock(import("@/lib/auth/helpers"), async () => {
  const { COLLECTION_OWNER } = await import("@/test/collection-db-fake");
  return {
    requireAuth: async () => ({
      session: {
        user: {
          id: COLLECTION_OWNER,
          createdAt: new Date(0),
          onboardingDone: true,
        },
      },
    }),
  };
});

const SOL_RING = collectionRow();

/** Sends the store's `fetch` calls to the real route handlers. */
function routeFetchToCollectionRoute(): void {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const request = new Request(
      new URL(String(input), "http://localhost"),
      init
    );
    const id = new URL(request.url).pathname.split("/").at(-1) ?? "";
    const context = { params: Promise.resolve({ id }) };
    return request.method === "DELETE"
      ? DELETE(request, context)
      : PATCH(request, context);
  });
}

/**
 * Seeds the table and loads the same rows into the store, as the collection
 * page does on first render.
 *
 * @param rows - Stored rows.
 */
function seed(rows: readonly FakeCollectionRow[]): void {
  collectionDb.reset(rows);
  useCollectionStore.setState({
    collectionCards: {},
    collectionCardsFoil: {},
    isSyncing: false,
  });
  useCollectionStore.getState().hydrateCollection(rows.map(wireRow));
}

beforeEach(() => {
  vi.restoreAllMocks();
  routeFetchToCollectionRoute();
});

describe("Collection store against /api/collection/[id]", () => {
  it("keeps an edited quantity on screen once the server has saved it", async () => {
    seed([SOL_RING]);

    await useCollectionStore.getState().updateQuantity(SOL_RING.id, 3);

    expect(collectionDb.row(SOL_RING.id)?.quantity).toBe(3);
    expect(
      useCollectionStore.getState().collectionCards[SOL_RING.scryfallId]
        ?.quantity
    ).toBe(3);
    expect(useCollectionStore.getState().isSyncing).toBe(false);
  });

  it("keeps an edited foil quantity in the foil map", async () => {
    const foil = collectionRow({ id: "row-sol-ring-foil", foil: true });
    seed([SOL_RING, foil]);

    await useCollectionStore.getState().updateQuantity(foil.id, 4);

    const state = useCollectionStore.getState();
    expect(state.collectionCardsFoil[foil.scryfallId]?.quantity).toBe(4);
    expect(state.collectionCards[SOL_RING.scryfallId]?.quantity).toBe(1);
  });

  it("removes the row from screen when its quantity reaches 0", async () => {
    seed([SOL_RING]);

    await useCollectionStore.getState().updateQuantity(SOL_RING.id, 0);

    expect(collectionDb.row(SOL_RING.id)).toBeUndefined();
    expect(useCollectionStore.getState().collectionCards).toEqual({});
  });

  it("shows a changed condition once the server has saved it", async () => {
    seed([SOL_RING]);

    await useCollectionStore.getState().updateCondition(SOL_RING.id, "LP");

    const { collectionCards } = useCollectionStore.getState();
    expect(Object.keys(collectionCards)).toEqual([SOL_RING.scryfallId]);
    expect(collectionCards[SOL_RING.scryfallId]?.condition).toBe("LP");
  });

  it("moves a swapped row to its new printing and keeps its id", async () => {
    seed([SOL_RING]);

    await useCollectionStore.getState().swapPrinting(SOL_RING.id, {
      scryfallId: "printing-sol-ring-alt",
      name: "Sol Ring",
      imageUri: "https://img.example/alt.jpg",
      price: 2,
    });

    const { collectionCards } = useCollectionStore.getState();
    expect(Object.keys(collectionCards)).toEqual(["printing-sol-ring-alt"]);
    expect(collectionCards["printing-sol-ring-alt"]?.id).toBe(SOL_RING.id);
  });

  it("replaces the edited row by the surviving row when a swap merges two printings", async () => {
    const owned = collectionRow({
      id: "row-sol-ring-alt",
      scryfallId: "printing-sol-ring-alt",
      quantity: 2,
    });
    seed([SOL_RING, owned]);

    await useCollectionStore.getState().swapPrinting(SOL_RING.id, {
      scryfallId: owned.scryfallId,
      name: "Sol Ring",
      imageUri: "",
      price: 1.5,
    });

    const { collectionCards } = useCollectionStore.getState();
    expect(Object.keys(collectionCards)).toEqual([owned.scryfallId]);
    expect(collectionCards[owned.scryfallId]).toMatchObject({
      id: owned.id,
      quantity: 3,
    });
  });
});
