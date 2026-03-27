import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Hoist mocks ─────────────────────────────────────────────────────────────

const { mockFindUnique, mockCompare } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockCompare: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: { findUnique: mockFindUnique },
  },
}));

vi.mock("bcryptjs", () => ({
  compare: mockCompare,
}));

vi.mock("@/lib/auth/edge-config", () => ({
  edgeAuthConfig: {
    session: { strategy: "jwt" },
    pages: { signIn: "/auth/signin", error: "/auth/signin" },
    providers: [],
    callbacks: {
      jwt: vi.fn(({ token }: { token: Record<string, unknown> }) => token),
      session: vi.fn(({ session }: { session: unknown }) => session),
      authorized: vi.fn(() => true),
    },
  },
}));

vi.mock("next-auth", () => {
  // Capture the config to extract authorize fn
  return {
    default: (config: Record<string, unknown>) => {
      // Store config for test access
      (globalThis as Record<string, unknown>).__nextAuthConfig = config;
      return {
        handlers: {},
        auth: vi.fn(),
        signIn: vi.fn(),
        signOut: vi.fn(),
      };
    },
  };
});

vi.mock("next-auth/providers/google", () => ({
  default: vi.fn(() => ({ id: "google", name: "Google", type: "oidc" })),
}));

vi.mock("next-auth/providers/credentials", () => ({
  default: vi.fn((opts: Record<string, unknown>) => ({
    id: "credentials",
    name: "credentials",
    type: "credentials",
    authorize: opts.authorize,
  })),
}));

vi.mock("@auth/prisma-adapter", () => ({
  PrismaAdapter: vi.fn(() => ({})),
}));

// Set env vars
vi.stubEnv("GOOGLE_CLIENT_ID", "test-id");
vi.stubEnv("GOOGLE_CLIENT_SECRET", "test-secret");

// ─── Import triggers NextAuth() ──────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- side-effect import triggers NextAuth config
import "./config";

type AuthorizeType = (credentials: Record<string, unknown> | undefined) => Promise<{ id: string; email: string; name: string | null; image: string | null } | null>;

function getAuthorize(): AuthorizeType {
  const config = (globalThis as Record<string, unknown>).__nextAuthConfig as Record<string, unknown>;
  const providers = config.providers as Array<{ id: string; authorize?: AuthorizeType }>;
  const credProvider = providers.find((p) => p.id === "credentials");
  if (!credProvider?.authorize) throw new Error("Credentials provider not found");
  return credProvider.authorize;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Credentials authorize", () => {
  let authorize: AuthorizeType;

  beforeEach(() => {
    vi.clearAllMocks();
    authorize = getAuthorize();
  });

  it("returns null when email is missing", async () => {
    const result = await authorize({ password: "secret" });
    expect(result).toBeNull();
  });

  it("returns null when password is missing", async () => {
    const result = await authorize({ email: "test@test.com" });
    expect(result).toBeNull();
  });

  it("returns null when credentials are undefined", async () => {
    const result = await authorize(undefined);
    expect(result).toBeNull();
  });

  it("returns null when user is not found in DB", async () => {
    mockFindUnique.mockResolvedValueOnce(null);
    const result = await authorize({ email: "test@test.com", password: "secret" });
    expect(result).toBeNull();
    expect(mockFindUnique).toHaveBeenCalledWith({ where: { email: "test@test.com" } });
  });

  it("returns null when user has no password (OAuth-only)", async () => {
    mockFindUnique.mockResolvedValueOnce({ id: "u1", email: "test@test.com", password: null });
    const result = await authorize({ email: "test@test.com", password: "secret" });
    expect(result).toBeNull();
  });

  it("returns null when password does not match", async () => {
    mockFindUnique.mockResolvedValueOnce({ id: "u1", email: "test@test.com", password: "hashed", name: "Test", image: null });
    mockCompare.mockResolvedValueOnce(false);
    const result = await authorize({ email: "test@test.com", password: "wrong" });
    expect(result).toBeNull();
  });

  it("returns user object when credentials are valid", async () => {
    mockFindUnique.mockResolvedValueOnce({ id: "u1", email: "test@test.com", password: "hashed", name: "Test User", image: "https://example.com/photo.jpg" });
    mockCompare.mockResolvedValueOnce(true);
    const result = await authorize({ email: "test@test.com", password: "correct" });
    expect(result).toEqual({
      id: "u1",
      email: "test@test.com",
      name: "Test User",
      image: "https://example.com/photo.jpg",
    });
  });
});
