import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCreate, mockFindMany, mockRequireAuth } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockFindMany: vi.fn(),
  mockRequireAuth: vi.fn(),
}));

vi.mock("@/lib/auth/helpers", () => ({ requireAuth: mockRequireAuth }));
vi.mock("@/lib/db/prisma", () => ({
  prisma: { cardPackage: { create: mockCreate, findMany: mockFindMany } },
}));

import { GET, POST } from "./route";

const postRequest = (body: unknown) =>
  new Request("http://localhost/api/community/card-packages", {
    method: "POST",
    body: JSON.stringify(body),
  });

describe("/api/community/card-packages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockResolvedValue({ session: { user: { id: "author-1" } } });
  });

  it("lists only published packages with author attribution", async () => {
    mockFindMany.mockResolvedValue([]);

    const response = await GET(new Request("http://localhost/api/community/card-packages"));

    expect(response.status).toBe(200);
    expect(mockFindMany).toHaveBeenCalledWith({
      where: { isPublic: true },
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        isPublic: true,
        updatedAt: true,
        author: { select: { username: true, name: true } },
        cards: {
          orderBy: { name: "asc" },
          select: {
            scryfallId: true,
            name: true,
            quantity: true,
            colorIdentity: true,
            isBanned: true,
            isBasicLand: true,
            imageUri: true,
          },
        },
      },
    });
  });

  it("lists private packages only for their signed-in owner", async () => {
    mockFindMany.mockResolvedValue([{ id: "private-1", isPublic: false }]);

    const response = await GET(new Request("http://localhost/api/community/card-packages?scope=mine"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([{ id: "private-1", isPublic: false }]);
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { authorId: "author-1" },
    }));
  });

  it("requires authentication before listing owned packages", async () => {
    mockRequireAuth.mockResolvedValue({ error: new Response(null, { status: 401 }) });

    const response = await GET(new Request("http://localhost/api/community/card-packages?scope=mine"));

    expect(response.status).toBe(401);
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("creates an attributed package and combines duplicate cards", async () => {
    mockCreate.mockResolvedValue({ id: "package-1" });

    const response = await POST(
      postRequest({
        name: "  Blue interaction  ",
        description: "  Stack essentials  ",
        category: "interaction",
        isPublic: true,
        cards: [
          { scryfallId: "card-1", name: "Counterspell", quantity: 1, colorIdentity: ["U"] },
          { scryfallId: "card-1", name: "Counterspell", quantity: 2, colorIdentity: ["U"] },
        ],
      })
    );

    expect(response.status).toBe(201);
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        authorId: "author-1",
        name: "Blue interaction",
        description: "Stack essentials",
        category: "interaction",
        isPublic: true,
        cards: {
          create: [
            {
              scryfallId: "card-1",
              name: "Counterspell",
              quantity: 3,
              colorIdentity: ["U"],
              isBanned: false,
              isBasicLand: false,
              imageUri: "",
            },
          ],
        },
      },
      select: { id: true, name: true, category: true, isPublic: true, createdAt: true },
    });
  });

  it("rejects an empty card package", async () => {
    const response = await POST(
      postRequest({ name: "Empty", category: "other", isPublic: false, cards: [] })
    );

    expect(response.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
