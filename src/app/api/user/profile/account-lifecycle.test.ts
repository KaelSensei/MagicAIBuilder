import { describe, it, expect, vi, beforeEach } from "vitest";
import type { JWT } from "next-auth/jwt";

// Sociable: the real profile route, requireAuth, Prisma adapter and JWT
// callback run together. Only the database (an in-memory user table) and the
// cookie decoding behind auth() are replaced.

// ─── In-memory user table ────────────────────────────────────────────────────

interface UserRow {
  readonly id: string;
  readonly email: string;
  readonly name: string | null;
  readonly image: string | null;
  readonly emailVerified: Date | null;
  readonly createdAt: Date;
  readonly onboardingDone: boolean;
}

interface UserWhere {
  readonly id?: string;
  readonly email?: string;
}

interface NewUser {
  readonly email: string;
  readonly name?: string | null;
  readonly image?: string | null;
  readonly emailVerified?: Date | null;
}

const { users, userTable, mockAuth } = vi.hoisted(() => {
  const users = new Map<string, UserRow>();
  let nextId = 0;

  const prismaError = (code: string) =>
    Object.assign(new Error(code), { code });

  const find = (where: UserWhere): UserRow | null => {
    if (where.id !== undefined) return users.get(where.id) ?? null;
    for (const row of users.values()) {
      if (row.email === where.email) return row;
    }
    return null;
  };

  const create = async ({
    data,
  }: {
    readonly data: NewUser;
  }): Promise<UserRow> => {
    if (find({ email: data.email })) throw prismaError("P2002");
    nextId += 1;
    const row: UserRow = {
      id: `user-${nextId}`,
      email: data.email,
      name: data.name ?? null,
      image: data.image ?? null,
      emailVerified: data.emailVerified ?? null,
      createdAt: new Date("2026-11-09T00:00:00.000Z"),
      onboardingDone: false,
    };
    users.set(row.id, row);
    return row;
  };

  const userTable = {
    create,
    findUnique: async ({ where }: { readonly where: UserWhere }) => find(where),
    upsert: async ({
      where,
      create: data,
    }: {
      readonly where: UserWhere;
      readonly create: NewUser;
    }) => find(where) ?? create({ data }),
    update: async ({
      where,
      data,
    }: {
      readonly where: UserWhere;
      readonly data: Partial<UserRow>;
    }) => {
      const row = find(where);
      if (!row) throw prismaError("P2025");
      const updated = { ...row, ...data };
      users.set(row.id, updated);
      return updated;
    },
    delete: async ({ where }: { readonly where: UserWhere }) => {
      const row = find(where);
      if (!row) throw prismaError("P2025");
      users.delete(row.id);
      return row;
    },
  };

  return { users, userTable, mockAuth: vi.fn() };
});

vi.mock("@/lib/db/prisma", () => ({ prisma: { user: userTable } }));

// auth() decodes the session cookie; here a device simply holds its session.
vi.mock("@/lib/auth/config", () => ({ auth: mockAuth }));

// ─── Import after mocks ──────────────────────────────────────────────────────

import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db/prisma";
import { edgeAuthConfig } from "@/lib/auth/edge-config";
import { GET, PATCH, DELETE } from "./route";

// ─── Sign-in journey ─────────────────────────────────────────────────────────

/**
 * What Auth.js does on a first Google sign-in: the adapter writes the user row,
 * then the JWT callback mints the token from that row.
 */
async function signInWithGoogle(email: string, name: string): Promise<JWT> {
  const adapter = PrismaAdapter(prisma);
  if (!adapter.createUser) throw new Error("PrismaAdapter has no createUser");

  const user = await adapter.createUser({
    id: "google-profile-id",
    email,
    name,
    image: null,
    emailVerified: null,
  });

  return edgeAuthConfig.callbacks.jwt({
    token: { name, email, picture: null, sub: user.id },
    user,
    account: null,
    trigger: "signUp",
  });
}

/** A device whose cookie holds this token, as the session callback exposes it. */
function holdSession(token: JWT): void {
  mockAuth.mockResolvedValue({
    user: {
      id: typeof token.id === "string" ? token.id : undefined,
      name: token.name,
      email: token.email,
      image: token.picture,
    },
    expires: "2026-11-16T00:00:00.000Z",
  });
}

function renameRequest(name: string): Request {
  return new Request("http://localhost:3000/api/user/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("account lifecycle across sign-in, deletion and a still-signed-in device", () => {
  beforeEach(() => {
    users.clear();
    mockAuth.mockReset();
  });

  it("creates the user on a first sign-in and resolves the session to it", async () => {
    holdSession(await signInWithGoogle("kael@test.com", "Kael"));

    const response = await GET();

    expect(response.status).toBe(200);
    const profile = await response.json();
    expect(profile.email).toBe("kael@test.com");
    expect(profile.id).toBe([...users.keys()][0]);
    expect(users.size).toBe(1);
  });

  it("signs out a token whose account was deleted instead of re-creating the user", async () => {
    holdSession(await signInWithGoogle("kael@test.com", "Kael"));

    expect((await DELETE()).status).toBe(200);
    expect(users.size).toBe(0);

    // Another device still holds the same 7-day token.
    expect((await GET()).status).toBe(401);
    expect((await PATCH(renameRequest("Back again"))).status).toBe(401);
    expect(users.size).toBe(0);
  });
});
