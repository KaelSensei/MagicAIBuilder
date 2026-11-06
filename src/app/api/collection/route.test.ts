import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAuth, findUnique, findMany, create, update } = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  findUnique: vi.fn(),
  findMany: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}));

vi.mock("@/lib/auth/helpers", () => ({ requireAuth }));
vi.mock("@/lib/db/prisma", () => ({
  prisma: { collectionCard: { findUnique, findMany, create, update } },
}));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));

import { POST } from "./route";

function postCard(quantity = 1) {
  return new Request("http://localhost/api/collection", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      scryfallId: "sf-1",
      name: "Sol Ring",
      quantity,
      foil: false,
      imageUri: "",
    }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  requireAuth.mockResolvedValue({ session: { user: { id: "user-1" } } });
});

describe("POST /api/collection", () => {
  it("creates a card that is not in the collection yet", async () => {
    findUnique.mockResolvedValue(null);
    create.mockResolvedValue({ id: "card-1", quantity: 1 });

    const response = await POST(postCard());

    expect(response.status).toBe(201);
    expect(create).toHaveBeenCalledOnce();
    expect(update).not.toHaveBeenCalled();
  });

  it("increments a printing that already exists", async () => {
    findUnique.mockResolvedValue({ id: "card-1", quantity: 2 });
    update.mockResolvedValue({ id: "card-1", quantity: 3 });

    const response = await POST(postCard());

    expect(response.status).toBe(200);
    expect(create).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith({
      where: { id: "card-1" },
      data: { quantity: 3 },
    });
  });

  it("increments when create loses a unique-constraint race", async () => {
    findUnique.mockResolvedValue(null);
    create.mockRejectedValue(Object.assign(new Error("Unique constraint failed"), { code: "P2002" }));
    update.mockResolvedValue({ id: "card-1", quantity: 2 });

    const response = await POST(postCard());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: "card-1", quantity: 2 });
    expect(update).toHaveBeenCalledWith({
      where: { scryfallId_foil_userId: { scryfallId: "sf-1", foil: false, userId: "user-1" } },
      data: { quantity: { increment: 1 } },
    });
  });

  it("still fails when create throws something other than a unique violation", async () => {
    findUnique.mockResolvedValue(null);
    create.mockRejectedValue(new Error("database down"));

    const response = await POST(postCard());

    expect(response.status).toBe(500);
    expect(update).not.toHaveBeenCalled();
  });
});
