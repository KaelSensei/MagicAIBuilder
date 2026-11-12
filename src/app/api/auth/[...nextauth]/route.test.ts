// @vitest-environment node
/**
 * Drives the real Auth.js route with the app's provider config through a
 * whole Google sign-in: CSRF token, sign-in redirect, OAuth callback.
 * Google's OIDC endpoints are simulated at the network boundary and the
 * database adapter is in memory, so each test pins what happens to the
 * user and account rows.
 */
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { NextRequest } from "next/server";
import type { Adapter, AdapterAccount, AdapterUser } from "next-auth/adapters";

const ORIGIN = "http://localhost:3000";
const GOOGLE_ISSUER = "https://accounts.google.com";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_CLIENT_ID = "test-google-client";
const SESSION_COOKIE = "authjs.session-token";

const { db } = vi.hoisted(() => ({
  db: {
    users: new Map<string, AdapterUser>(),
    accounts: new Array<AdapterAccount>(),
  },
}));

vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
  const { stubPrisma } = await import("@/test/prisma-stub");
  return stubPrisma(await importOriginal(), {});
});

vi.mock(import("@auth/prisma-adapter"), () => ({
  PrismaAdapter: (): Adapter => ({
    createUser: (user) => {
      db.users.set(user.id, user);
      return user;
    },
    getUser: (id) => db.users.get(id) ?? null,
    getUserByEmail: (email) =>
      [...db.users.values()].find((user) => user.email === email) ?? null,
    getUserByAccount: ({ provider, providerAccountId }) => {
      const linked = db.accounts.find(
        (account) =>
          account.provider === provider &&
          account.providerAccountId === providerAccountId
      );
      return linked ? (db.users.get(linked.userId) ?? null) : null;
    },
    linkAccount: (account) => {
      db.accounts.push(account);
      return account;
    },
  }),
}));

interface GoogleProfile {
  readonly sub: string;
  readonly email: string;
  readonly name: string;
}

let googleProfile: GoogleProfile = { sub: "", email: "", name: "" };

function base64url(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

/** An ID token shaped like Google's; the code flow does not verify its signature. */
function idTokenFor(profile: GoogleProfile): string {
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    iss: GOOGLE_ISSUER,
    aud: GOOGLE_CLIENT_ID,
    sub: profile.sub,
    email: profile.email,
    email_verified: true,
    name: profile.name,
    iat: now,
    exp: now + 3600,
  };
  return `${base64url({ alg: "RS256", typ: "JWT", kid: "test" })}.${base64url(claims)}.c2ln`;
}

/** Answers the two Google endpoints Auth.js calls server-side. */
function fakeGoogle(input: RequestInfo | URL): Promise<Response> {
  const url = input instanceof Request ? input.url : String(input);
  if (url === `${GOOGLE_ISSUER}/.well-known/openid-configuration`) {
    return Promise.resolve(
      Response.json({
        issuer: GOOGLE_ISSUER,
        authorization_endpoint: `${GOOGLE_ISSUER}/o/oauth2/v2/auth`,
        token_endpoint: GOOGLE_TOKEN_ENDPOINT,
        userinfo_endpoint: "https://openidconnect.googleapis.com/v1/userinfo",
        jwks_uri: "https://www.googleapis.com/oauth2/v3/certs",
        id_token_signing_alg_values_supported: ["RS256"],
      })
    );
  }
  if (url === GOOGLE_TOKEN_ENDPOINT) {
    return Promise.resolve(
      Response.json({
        access_token: "google-access-token",
        token_type: "Bearer",
        expires_in: 3600,
        scope: "openid email profile",
        id_token: idTokenFor(googleProfile),
      })
    );
  }
  return Promise.reject(new Error(`Unexpected fetch to ${url}`));
}

type RouteHandler = (request: NextRequest) => Promise<Response>;
let GET: RouteHandler;
let POST: RouteHandler;

/** Holds the browser's cookies across the redirects of one sign-in. */
class CookieJar {
  private readonly cookies = new Map<string, string>();

  store(response: Response): void {
    for (const header of response.headers.getSetCookie()) {
      const [pair = ""] = header.split(";");
      const separator = pair.indexOf("=");
      this.cookies.set(pair.slice(0, separator), pair.slice(separator + 1));
    }
  }

  header(): string {
    return [...this.cookies]
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");
  }

  has(name: string): boolean {
    return Boolean(this.cookies.get(name));
  }
}

/** Reads the token from the body of `GET /api/auth/csrf`. */
function readCsrfToken(body: unknown): string {
  if (
    typeof body === "object" &&
    body !== null &&
    "csrfToken" in body &&
    typeof body.csrfToken === "string"
  ) {
    return body.csrfToken;
  }
  throw new Error("The CSRF endpoint returned no token");
}

/**
 * Runs the whole "Continue with Google" round trip for `profile`.
 *
 * @returns the callback's redirect target and the cookies it left behind
 */
async function signInWithGoogle(
  profile: GoogleProfile
): Promise<{ readonly location: string | null; readonly jar: CookieJar }> {
  googleProfile = profile;
  const jar = new CookieJar();

  const csrf = await GET(new NextRequest(`${ORIGIN}/api/auth/csrf`));
  jar.store(csrf);
  const csrfToken = readCsrfToken(await csrf.json());

  const start = await POST(
    new NextRequest(`${ORIGIN}/api/auth/signin/google`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: jar.header(),
      },
      body: new URLSearchParams({ csrfToken, callbackUrl: `${ORIGIN}/decks` }),
    })
  );
  jar.store(start);
  expect(start.headers.get("location")).toMatch(
    /^https:\/\/accounts\.google\.com\//
  );

  const callback = await GET(
    new NextRequest(`${ORIGIN}/api/auth/callback/google?code=google-code`, {
      headers: { Cookie: jar.header() },
    })
  );
  jar.store(callback);
  return { location: callback.headers.get("location"), jar };
}

beforeAll(async () => {
  vi.stubEnv("AUTH_SECRET", "test-secret-with-at-least-32-characters");
  vi.stubEnv("AUTH_URL", undefined);
  vi.stubEnv("NEXTAUTH_URL", undefined);
  vi.stubEnv("AUTH_TRUST_HOST", "true");
  vi.stubEnv("GOOGLE_CLIENT_ID", GOOGLE_CLIENT_ID);
  vi.stubEnv("GOOGLE_CLIENT_SECRET", "test-google-secret");
  vi.stubGlobal("fetch", fakeGoogle);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  ({ GET, POST } = await import("./route"));
});

afterAll(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

beforeEach(() => {
  db.users.clear();
  db.accounts.length = 0;
});

describe("Google sign-in through /api/auth", () => {
  it("refuses to link Google to a password account whose email was never verified", async () => {
    db.users.set("squatter", {
      id: "squatter",
      name: "Attacker",
      email: "victim@example.com",
      emailVerified: null,
    });

    const { location, jar } = await signInWithGoogle({
      sub: "google-victim",
      email: "victim@example.com",
      name: "Victim",
    });

    expect(location).toBe(`${ORIGIN}/auth/signin?error=OAuthAccountNotLinked`);
    expect(db.accounts).toEqual([]);
    expect(jar.has(SESSION_COOKIE)).toBe(false);
  });

  it("still signs in a returning Google user whose account is already linked", async () => {
    db.users.set("google-first", {
      id: "google-first",
      name: "Returning",
      email: "returning@example.com",
      emailVerified: null,
    });
    db.accounts.push({
      userId: "google-first",
      type: "oidc",
      provider: "google",
      providerAccountId: "google-returning",
    });

    const { location, jar } = await signInWithGoogle({
      sub: "google-returning",
      email: "returning@example.com",
      name: "Returning",
    });

    expect(location).toBe(`${ORIGIN}/decks`);
    expect(jar.has(SESSION_COOKIE)).toBe(true);
    expect(db.accounts).toHaveLength(1);
  });

  it("creates and links an account for a first-time Google user", async () => {
    const { location, jar } = await signInWithGoogle({
      sub: "google-new",
      email: "new@example.com",
      name: "Newcomer",
    });

    expect(location).toBe(`${ORIGIN}/decks`);
    expect(jar.has(SESSION_COOKIE)).toBe(true);
    const [created] = [...db.users.values()];
    expect(created?.email).toBe("new@example.com");
    expect(db.accounts).toEqual([
      expect.objectContaining({
        provider: "google",
        providerAccountId: "google-new",
        userId: created?.id,
      }),
    ]);
  });
});
