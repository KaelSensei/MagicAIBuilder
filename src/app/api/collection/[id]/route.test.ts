/**
 * Contract tests for `/api/collection/[id]`.
 *
 * The collection store depends on the exact PATCH response shapes, so they
 * are pinned here: `{ deleted: true }`, `{ merged: false, card }` and
 * `{ merged: true, mergedFromId, card }`.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  COLLECTION_OWNER,
  collectionDb,
  collectionRow,
  wireRow,
} from "@/test/collection-db-fake";

const { requireAuth } = vi.hoisted(() => ({ requireAuth: vi.fn() }));

vi.mock(import("@/lib/auth/helpers"), () => ({ requireAuth }));
vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
  const { stubPrisma } = await import("@/test/prisma-stub");
  const { collectionDb: db } = await import("@/test/collection-db-fake");
  return stubPrisma(await importOriginal(), db.prisma);
});

import { DELETE, PATCH } from "./route";

const SOL_RING = collectionRow();

/**
 * @param id - Collection row to edit.
 * @param body - JSON body of the PATCH.
 * @returns The route response.
 */
function patch(id: string, body: unknown): Promise<Response> {
  return PATCH(
    new Request(`http://localhost/api/collection/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) }
  );
}

beforeEach(() => {
  requireAuth.mockReset();
  requireAuth.mockResolvedValue({
    session: { user: { id: COLLECTION_OWNER } },
  });
  collectionDb.reset([SOL_RING]);
});

describe("PATCH /api/collection/[id]", () => {
  it("answers a quantity change with the saved row in a `merged: false` envelope", async () => {
    const response = await patch(SOL_RING.id, { quantity: 3 });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      merged: false,
      card: wireRow({ ...SOL_RING, quantity: 3 }),
    });
    expect(collectionDb.row(SOL_RING.id)?.quantity).toBe(3);
  });

  it("answers a condition change with the same envelope", async () => {
    const response = await patch(SOL_RING.id, { condition: "LP" });

    expect(await response.json()).toEqual({
      merged: false,
      card: wireRow({ ...SOL_RING, condition: "LP" }),
    });
  });

  it("deletes the row and answers `{ deleted: true }` when the quantity reaches 0", async () => {
    const response = await patch(SOL_RING.id, { quantity: 0 });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ deleted: true });
    expect(collectionDb.row(SOL_RING.id)).toBeUndefined();
  });

  it("moves the row to a printing the user does not own yet and keeps its id", async () => {
    const response = await patch(SOL_RING.id, {
      scryfallId: "printing-sol-ring-alt",
      name: "Sol Ring",
      imageUri: "https://img.example/alt.jpg",
      price: 2,
    });

    expect(await response.json()).toEqual({
      merged: false,
      card: wireRow({
        ...SOL_RING,
        scryfallId: "printing-sol-ring-alt",
        imageUri: "https://img.example/alt.jpg",
        price: 2,
      }),
    });
  });

  it("merges into the row that already holds the target printing and answers with that row", async () => {
    const owned = collectionRow({
      id: "row-sol-ring-alt",
      scryfallId: "printing-sol-ring-alt",
      quantity: 2,
    });
    collectionDb.reset([SOL_RING, owned]);

    const response = await patch(SOL_RING.id, {
      scryfallId: owned.scryfallId,
      name: "Sol Ring",
      imageUri: "",
      price: 1.5,
    });

    expect(await response.json()).toEqual({
      merged: true,
      mergedFromId: SOL_RING.id,
      card: wireRow({ ...owned, quantity: 3 }),
    });
    expect(collectionDb.row(SOL_RING.id)).toBeUndefined();
    expect(collectionDb.all()).toHaveLength(1);
  });

  it("rejects an anonymous request before reading the row", async () => {
    requireAuth.mockResolvedValue({
      error: new Response(null, { status: 401 }),
    });

    const response = await patch(SOL_RING.id, { quantity: 3 });

    expect(response.status).toBe(401);
    expect(collectionDb.row(SOL_RING.id)?.quantity).toBe(1);
  });

  it("answers 404 for a row that does not exist", async () => {
    const response = await patch("row-missing", { quantity: 3 });

    expect(response.status).toBe(404);
  });

  it("refuses another user's row and leaves it unchanged", async () => {
    collectionDb.reset([collectionRow({ userId: "someone-else" })]);

    const response = await patch(SOL_RING.id, { quantity: 3 });

    expect(response.status).toBe(403);
    expect(collectionDb.row(SOL_RING.id)?.quantity).toBe(1);
  });

  it("rejects a negative quantity", async () => {
    const response = await patch(SOL_RING.id, { quantity: -1 });

    expect(response.status).toBe(400);
    expect(collectionDb.row(SOL_RING.id)?.quantity).toBe(1);
  });
});

describe("DELETE /api/collection/[id]", () => {
  it("deletes the user's row and answers `{ deleted: true }`", async () => {
    const response = await DELETE(
      new Request(`http://localhost/api/collection/${SOL_RING.id}`, {
        method: "DELETE",
      }),
      { params: Promise.resolve({ id: SOL_RING.id }) }
    );

    expect(await response.json()).toEqual({ deleted: true });
    expect(collectionDb.row(SOL_RING.id)).toBeUndefined();
  });
});
