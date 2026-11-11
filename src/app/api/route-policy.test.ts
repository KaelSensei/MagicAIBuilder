// @vitest-environment node
/**
 * Characterization suite: the auth policy of every API route, as it is today.
 *
 * The middleware matcher excludes `/api`, so no edge guard ever sees an API
 * request: the allowlist in `lib/auth/edge-config.ts` is inert, and each route
 * handler is the only thing standing between a caller and the data (audit
 * "server" M6). Nothing used to fail when a route lost its `requireAuth` in a
 * move. This suite pins three things:
 *
 * 1. the matcher still skips `/api` (B2-58 deletes the inert allowlist and
 *    relies on this suite instead);
 * 2. `ROUTE_POLICIES` names a policy for every verb of every route file on
 *    disk, so a new route without a policy fails here;
 * 3. each route behaves as its policy says for a caller with no session, and
 *    owner-only and moderator-only routes refuse a signed-in stranger.
 *
 * The routes run for real against two boundary fakes: the Auth.js session
 * (`auth()` from `lib/auth/config`) and an in-memory database behind
 * `lib/db/prisma`. The guards (`requireAuth`, `requireDeckOwner`,
 * `requireModerator`, `requireApiScope`) are the real ones.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const HTTP_VERBS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
type HttpVerb = (typeof HTTP_VERBS)[number];

/**
 * Who may call a route.
 *
 * - `public`: anyone; the handler never reads the session.
 * - `session`: any signed-in account (`requireAuth`); rows it reaches are the
 *   caller's own.
 * - `optional-viewer`: anyone; the session, when present, only changes the
 *   answer (most read raw `auth()`, deliberately without `requireAuth`'s
 *   database check).
 * - `deck-owner`: only the owner of the deck named in the path.
 * - `moderator`: a signed-in account with `isModerator` (`requireModerator`).
 * - `api-key`: a bearer API key with a scope (`requireApiScope`); a session
 *   cookie never authenticates `/api/v1`.
 * - `share-token`: the share link's token in the path is the credential.
 */
type AuthPolicy =
  | "public"
  | "session"
  | "optional-viewer"
  | "deck-owner"
  | "moderator"
  | "api-key"
  | "share-token";

/**
 * The policy of each verb of each route file, keyed by the file's folder under
 * `src/app/api`. Adding a route means adding its row here.
 */
const ROUTE_POLICIES: Readonly<
  Record<string, Readonly<Partial<Record<HttpVerb, AuthPolicy>>>>
> = {
  "ai/allowance": { GET: "session" },
  "ai/build": { POST: "session" },
  "ai/suggest": { POST: "session" },
  "auth/[...nextauth]": { GET: "public", POST: "public" },
  "auth/signup": { POST: "public" },
  "cache/cards": { GET: "public" },
  "cache/search": { GET: "public" },
  collection: { GET: "session", POST: "session" },
  "collection/[id]": { PATCH: "session", DELETE: "session" },
  "collection/acquisition-plan": { GET: "session" },
  "collection/usage": { GET: "session" },
  combos: { POST: "public" },
  "community/card-packages": { GET: "public", POST: "session" },
  "community/card-packages/[packageId]/apply": { POST: "session" },
  "community/card-packages/[packageId]/preview": { POST: "session" },
  "community/commanders/[slug]/decks": { GET: "optional-viewer" },
  "community/deck-folders": { GET: "session", POST: "session" },
  "community/deck-folders/[folderId]": { PATCH: "session", DELETE: "session" },
  "community/decks/[id]/comments": { GET: "optional-viewer", POST: "session" },
  "community/decks/[id]/comments/[commentId]": {
    PATCH: "session",
    DELETE: "session",
  },
  "community/decks/[id]/ratings": {
    GET: "optional-viewer",
    POST: "session",
    DELETE: "session",
  },
  "community/decks/[id]/reports": { POST: "session" },
  "community/decks/[id]/save": { POST: "session", DELETE: "session" },
  "community/decks/[id]/vote": {
    GET: "optional-viewer",
    POST: "session",
    DELETE: "session",
  },
  "community/users/[username]/follow": { POST: "session", DELETE: "session" },
  "deck/[id]": { GET: "optional-viewer" },
  "deck-folders": { GET: "session", POST: "session" },
  "deck-folders/[folderId]": { PATCH: "session", DELETE: "session" },
  decks: { GET: "session", POST: "session" },
  "decks/[id]": {
    GET: "deck-owner",
    PATCH: "deck-owner",
    DELETE: "deck-owner",
  },
  "decks/[id]/acquisition-intent": { GET: "deck-owner", PUT: "deck-owner" },
  "decks/[id]/cards": {
    POST: "deck-owner",
    PATCH: "deck-owner",
    DELETE: "deck-owner",
  },
  "decks/[id]/cards/[cardId]": { PATCH: "deck-owner", DELETE: "deck-owner" },
  "decks/[id]/duplicate": { POST: "deck-owner" },
  "decks/[id]/folder": { PATCH: "deck-owner" },
  "decks/[id]/fork": { POST: "session" },
  "decks/[id]/legality": { GET: "deck-owner" },
  "decks/[id]/playtest-sessions": { GET: "deck-owner", POST: "deck-owner" },
  "decks/[id]/share": { POST: "deck-owner", DELETE: "deck-owner" },
  "decks/[id]/snapshots": { GET: "deck-owner", POST: "deck-owner" },
  "decks/[id]/snapshots/[snapshotId]": { DELETE: "deck-owner" },
  "decks/[id]/snapshots/[snapshotId]/restore": { POST: "deck-owner" },
  "decks/folders": { PATCH: "session" },
  // An unauthenticated stub with no persistence and no caller (audit "server"
  // M11); deleting it is an owner decision.
  favorites: { GET: "public", POST: "public" },
  "favorites/[scryfallId]": { DELETE: "public" },
  health: { GET: "public" },
  "import/moxfield-user": { POST: "public" },
  "import/url": { POST: "public" },
  "meta/[commanderSlug]": { GET: "public" },
  "meta/[commanderSlug]/history": { GET: "public" },
  "moderation/deck-reports": { GET: "moderator" },
  "moderation/deck-reports/[reportId]": { PATCH: "moderator" },
  "proxy-card-image": { GET: "public" },
  // GET answers anyone so the builder can hide the control; POST is signed-in.
  "search/translate": { GET: "optional-viewer", POST: "session" },
  "share/[token]": { GET: "share-token" },
  templates: { GET: "public", POST: "session" },
  "user/api-keys": { GET: "session", POST: "session" },
  "user/api-keys/[id]": { DELETE: "session" },
  "user/init": { GET: "session" },
  "user/notification-preferences": { GET: "session", PATCH: "session" },
  "user/onboarding": { GET: "session", POST: "session", DELETE: "session" },
  "user/profile": { GET: "session", PATCH: "session", DELETE: "session" },
  "user/username": { PATCH: "session" },
  "users/[username]": { GET: "optional-viewer" },
  "v1/collection": { GET: "api-key" },
  "v1/decks": { GET: "api-key" },
  "v1/decks/[id]": { GET: "api-key" },
  "v1/openapi": { GET: "public" },
};

/**
 * Routes recorded as data only: the table must still match them on disk, but
 * this suite does not run them. The AI routes were frozen by decision D4 when
 * this slice was planned; the AI series characterizes them before they change.
 */
const DATA_ONLY_ROUTES: ReadonlySet<string> = new Set([
  "ai/allowance",
  "ai/build",
  "ai/suggest",
]);

/** A query string that switches a route to another policy for the same verb. */
interface QueryVariant {
  readonly route: string;
  readonly verb: HttpVerb;
  readonly query: string;
  readonly policy: AuthPolicy;
}

const QUERY_VARIANTS: readonly QueryVariant[] = [
  // Listing your own packages needs a session; browsing public ones does not.
  {
    route: "community/card-packages",
    verb: "GET",
    query: "?scope=mine",
    policy: "session",
  },
  // A forced refresh reads the session: a moderator's is honoured, and anyone
  // else is served the cache rather than refused.
  {
    route: "meta/[commanderSlug]",
    verb: "GET",
    query: "?refresh=true",
    policy: "optional-viewer",
  },
];

const OWNER_ID = "owner-1";
const STRANGER_ID = "stranger-1";
const DECK_ID = "deck-1";
const SHARE_TOKEN = "live-share-token";

/** The value each dynamic path segment takes in a request. */
const SAMPLE_PARAMS: Readonly<Record<string, string | readonly string[]>> = {
  id: DECK_ID,
  cardId: "card-1",
  commanderSlug: "atraxa-praetors-voice",
  commentId: "comment-1",
  folderId: "folder-1",
  nextauth: ["session"],
  packageId: "package-1",
  reportId: "report-1",
  scryfallId: "scryfall-1",
  slug: "atraxa-praetors-voice",
  snapshotId: "snapshot-1",
  token: SHARE_TOKEN,
  username: "deck-owner",
};

type Row = Readonly<Record<string, unknown>>;

const fake = vi.hoisted(() => ({
  /** Stands in for Auth.js `auth()`: resolves to the session cookie's content. */
  auth: vi.fn(),
  /** In-memory tables, by Prisma model name. */
  tables: new Map<string, readonly Row[]>(),
}));

vi.mock(import("@/lib/auth/config"), () => ({
  auth: fake.auth,
  // The real Auth.js endpoints run in `auth/[...nextauth]/route.test.ts`.
  handlers: {
    GET: async () => new Response(null, { status: 200 }),
    POST: async () => new Response(null, { status: 200 }),
  },
}));

// The typed factory must return a `PrismaClient`, so the real (never
// connected) client is wrapped: every model read goes to `fake.tables`, and no
// query can reach a database.
vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
  const { prisma } = await importOriginal();
  return {
    prisma: new Proxy(prisma, {
      get: (_client, property) => fakeClientMember(property),
    }),
  };
});

// next-intl's middleware imports `next/server` without an extension, which
// Node's ESM loader cannot resolve outside Next's bundler.
vi.mock(import("next-intl/middleware"), () => ({ default: () => vi.fn() }));

/** @returns whether `value` is a plain object whose columns can be read */
function isRow(value: unknown): value is Row {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Equality, plus `{ equals, mode: "insensitive" }`: the only operator the
 * routes exercised here put in a WHERE. Any other operator matches nothing.
 */
function columnMatches(stored: unknown, filter: unknown): boolean {
  if (filter === undefined) return true;
  if (isRow(filter) && typeof filter.equals === "string") {
    return (
      typeof stored === "string" &&
      (filter.mode === "insensitive"
        ? stored.toLowerCase() === filter.equals.toLowerCase()
        : stored === filter.equals)
    );
  }
  return stored === filter;
}

/** @returns the rows matching the `where` of Prisma-style arguments */
function rowsWhere(rows: readonly Row[], args: unknown): readonly Row[] {
  const where = isRow(args) && isRow(args.where) ? args.where : {};
  return rows.filter((row) =>
    Object.entries(where).every(([column, filter]) =>
      columnMatches(row[column], filter)
    )
  );
}

/**
 * A read-only model delegate. `select` and `include` are ignored; writes are
 * absent, so a route that reaches one fails with a 500 rather than passing.
 */
function modelDelegate(rows: readonly Row[]) {
  return {
    findUnique: async (args: unknown) => rowsWhere(rows, args)[0] ?? null,
    findFirst: async (args: unknown) => rowsWhere(rows, args)[0] ?? null,
    findMany: async (args: unknown) => rowsWhere(rows, args),
    count: async (args: unknown) => rowsWhere(rows, args).length,
    updateMany: async (args: unknown) => ({
      count: rowsWhere(rows, args).length,
    }),
    deleteMany: async (args: unknown) => ({
      count: rowsWhere(rows, args).length,
    }),
  };
}

/** @returns what the fake client answers for `prisma[property]` */
function fakeClientMember(property: string | symbol): unknown {
  if (property === "$queryRaw") return async () => [];
  if (typeof property !== "string" || property.startsWith("$"))
    return undefined;
  return modelDelegate(fake.tables.get(property) ?? []);
}

/** A signed-in deck owner, a signed-in stranger, and one public, shared deck. */
function seedTables(): void {
  fake.tables.clear();
  fake.tables.set("user", [
    { id: OWNER_ID, username: "deck-owner", isModerator: false, decks: [] },
    { id: STRANGER_ID, username: "stranger", isModerator: false, decks: [] },
  ]);
  fake.tables.set("deck", [
    {
      id: DECK_ID,
      userId: OWNER_ID,
      name: "Shared deck",
      isPublic: true,
      shareToken: SHARE_TOKEN,
      shareEnabled: true,
      cards: [],
    },
  ]);
}

/** One verb of one route, as the suite runs it. */
interface RouteCase {
  readonly route: string;
  readonly verb: HttpVerb;
  readonly policy: AuthPolicy;
  readonly query: string;
  readonly label: string;
}

const API_DIR = join(process.cwd(), "src", "app", "api");
const ROUTE_FILE = /^route\.tsx?$/;

/** @returns every route file under `dir`, as absolute paths */
function routeFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return routeFiles(path);
    return ROUTE_FILE.test(entry.name) ? [path] : [];
  });
}

/** @returns the route's folder under `src/app/api`, with `/` separators */
function routeKey(file: string): string {
  return relative(API_DIR, file).split(sep).slice(0, -1).join("/");
}

const FILE_BY_ROUTE: ReadonlyMap<string, string> = new Map(
  routeFiles(API_DIR).map((file) => [routeKey(file), file])
);

/** @returns the HTTP verbs a route file exports, read from its source */
function exportedVerbs(file: string): HttpVerb[] {
  const source = readFileSync(file, "utf8");
  const declared = [
    ...source.matchAll(/export\s+(?:async\s+)?function\s+(\w+)/g),
    ...source.matchAll(/export\s+const\s+\{([^}]*)\}/g),
  ].flatMap((match) => match[1].split(",").map((name) => name.trim()));
  return HTTP_VERBS.filter((verb) => declared.includes(verb));
}

/** @returns the policy table as one case per verb, plus the query variants */
function routeCases(): RouteCase[] {
  const base = Object.entries(ROUTE_POLICIES).flatMap(([route, verbs]) =>
    HTTP_VERBS.flatMap((verb) => {
      const policy = verbs[verb];
      return policy ? [{ route, verb, policy, query: "" }] : [];
    })
  );
  return [...base, ...QUERY_VARIANTS]
    .filter((routeCase) => !DATA_ONLY_ROUTES.has(routeCase.route))
    .map((routeCase) => ({
      ...routeCase,
      label: `${routeCase.verb} /api/${routeCase.route}${routeCase.query} (${routeCase.policy})`,
    }));
}

const ROUTE_CASES = routeCases();

/** @returns the dynamic segment's parameter name, or null for a static one */
function paramName(segment: string): string | null {
  return /^\[(?:\.\.\.)?(\w+)\]$/.exec(segment)?.[1] ?? null;
}

/** @returns the route's URL path with sample values in its dynamic segments */
function samplePath(route: string): string {
  const segments = route.split("/").map((segment) => {
    const name = paramName(segment);
    if (name === null) return segment;
    const value = SAMPLE_PARAMS[name];
    return typeof value === "string" ? value : (value ?? []).join("/");
  });
  return `/api/${segments.join("/")}`;
}

/** @returns the `params` Next passes a handler for this route */
function sampleParams(
  route: string
): Record<string, string | readonly string[]> {
  return Object.fromEntries(
    route
      .split("/")
      .map(paramName)
      .filter((name) => name !== null)
      .map((name) => [name, SAMPLE_PARAMS[name] ?? ""])
  );
}

/**
 * Calls one verb of one route the way Next does.
 *
 * @param body - JSON body for verbs that carry one; `{}` by default
 */
async function callRoute(
  routeCase: Pick<RouteCase, "route" | "verb" | "query">,
  body: unknown = {}
): Promise<Response> {
  const file = FILE_BY_ROUTE.get(routeCase.route);
  if (!file) throw new Error(`No route file for ${routeCase.route}`);
  const routeModule: unknown = await import(/* @vite-ignore */ file);
  const handler = isRow(routeModule) ? routeModule[routeCase.verb] : undefined;
  if (typeof handler !== "function") {
    throw new Error(`${routeCase.route} exports no ${routeCase.verb}`);
  }
  const hasBody = routeCase.verb !== "GET";
  const request = new NextRequest(
    `http://localhost${samplePath(routeCase.route)}${routeCase.query}`,
    {
      method: routeCase.verb,
      headers: hasBody ? { "content-type": "application/json" } : {},
      body: hasBody ? JSON.stringify(body) : undefined,
    }
  );
  const response: unknown = await handler(request, {
    params: Promise.resolve(sampleParams(routeCase.route)),
  });
  if (!(response instanceof Response)) {
    throw new Error(
      `${routeCase.route} ${routeCase.verb} returned no Response`
    );
  }
  return response;
}

/** @returns whether Next's matcher sends this path through the middleware */
async function runsMiddleware(pathname: string): Promise<boolean> {
  const { config } = await import("@/middleware");
  // Next compiles each matcher with path-to-regexp. These patterns hold no
  // named parameter, so the string read as a regular expression matches the
  // same paths.
  return config.matcher.some((pattern) =>
    new RegExp(`^${pattern}$`).test(pathname)
  );
}

beforeEach(() => {
  fake.auth.mockReset();
  fake.auth.mockResolvedValue(null);
  seedTables();
  // `requireAuth` signs in a Playwright user when this flag is "1" outside
  // production; pin it off so "anonymous" means anonymous.
  vi.stubEnv("PLAYWRIGHT_TEST", "0");
  // No route may reach the network from a unit test.
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      throw new Error("network is disabled in this suite");
    })
  );
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("the middleware never sees an API request", () => {
  it.each([...FILE_BY_ROUTE.keys()])("skips /api/%s", async (route) => {
    expect(await runsMiddleware(samplePath(route))).toBe(false);
  });

  it("runs on pages, with and without a locale prefix", async () => {
    expect(await runsMiddleware("/decks")).toBe(true);
    expect(await runsMiddleware("/fr/decks")).toBe(true);
    expect(await runsMiddleware("/builder/deck-1")).toBe(true);
  });

  it('currently also skips any page whose path merely starts with "api" (pinned; no such page exists yet)', async () => {
    expect(await runsMiddleware("/apiary")).toBe(false);
  });
});

describe("every API route declares its auth policy", () => {
  it("finds the route files at all, so the checks below cannot pass vacuously", () => {
    expect(FILE_BY_ROUTE.size).toBeGreaterThan(60);
  });

  it("has a row for every route file on disk, and none for a file that is gone", () => {
    expect(Object.keys(ROUTE_POLICIES).sort()).toEqual(
      [...FILE_BY_ROUTE.keys()].sort()
    );
  });

  it.each([...FILE_BY_ROUTE.entries()])(
    "/api/%s: has a policy for exactly the verbs the file exports",
    (route, file) => {
      const declared = HTTP_VERBS.filter(
        (verb) => ROUTE_POLICIES[route]?.[verb]
      );
      expect(declared).toEqual(exportedVerbs(file));
    }
  );
});

/** @returns the cases as `[label, case]` rows, so test names print unquoted */
function labelled(routeCases: readonly RouteCase[]): [string, RouteCase][] {
  return routeCases.map((routeCase) => [routeCase.label, routeCase]);
}

/** @returns the runnable cases whose policy is one of `policies` */
function casesWith(...policies: readonly AuthPolicy[]): RouteCase[] {
  return ROUTE_CASES.filter((routeCase) => policies.includes(routeCase.policy));
}

describe("a caller with no session", () => {
  it.each(labelled(casesWith("session", "deck-owner", "moderator")))(
    "%s: is refused with 401",
    async (_label, routeCase) => {
      const response = await callRoute(routeCase);
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: "Unauthorized" });
    }
  );

  it.each(labelled(casesWith("api-key")))(
    "%s: is refused with 401 in the v1 error envelope",
    async (_label, routeCase) => {
      const response = await callRoute(routeCase);
      expect(response.status).toBe(401);
      expect(await response.json()).toMatchObject({
        error: { code: "unauthorized" },
      });
    }
  );

  it.each(labelled(casesWith("public")))(
    "%s: is served, and the session is never read",
    async (_label, routeCase) => {
      const response = await callRoute(routeCase);
      expect([401, 403]).not.toContain(response.status);
      expect(fake.auth).not.toHaveBeenCalled();
    }
  );

  it.each(labelled(casesWith("optional-viewer")))(
    "%s: is served; the session is read only to know the viewer",
    async (_label, routeCase) => {
      const response = await callRoute(routeCase);
      expect([401, 403]).not.toContain(response.status);
      expect(fake.auth).toHaveBeenCalled();
    }
  );

  it.each(labelled(casesWith("share-token")))(
    "%s: opens the shared deck with its live token, and the session is never read",
    async (_label, routeCase) => {
      const response = await callRoute(routeCase);
      expect(response.status).toBe(200);
      expect(fake.auth).not.toHaveBeenCalled();
    }
  );

  it("GET /api/share/[token] (share-token): answers 404 for a token no deck shares", async () => {
    fake.tables.set("deck", []);
    const response = await callRoute({
      route: "share/[token]",
      verb: "GET",
      query: "",
    });
    expect(response.status).toBe(404);
  });

  it("GET /api/deck/[id] (optional-viewer): a client past its read budget gets 429, before the session is read", async () => {
    const { GET } = await import("@/app/api/deck/[id]/route");
    const { PUBLIC_DECK_READS_PER_CLIENT } =
      await import("@/lib/deck/public-read-policy");
    // The budget is per client address and the limiter outlives a test, so
    // this client has an address of its own.
    const read = () =>
      GET(
        new Request(`http://localhost/api/deck/${DECK_ID}`, {
          headers: { "x-real-ip": "203.0.113.42" },
        }),
        { params: Promise.resolve({ id: DECK_ID }) }
      );
    for (let served = 0; served < PUBLIC_DECK_READS_PER_CLIENT; served++) {
      expect((await read()).status).toBe(200);
    }

    const response = await read();

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).not.toBeNull();
    expect(fake.auth).toHaveBeenCalledTimes(PUBLIC_DECK_READS_PER_CLIENT);
  });
});

/**
 * How each owner-only route answers a signed-in caller who does not own the
 * deck. Most answer 403: `requireDeckOwner`, and the inline checks in
 * `decks/[id]`. Three answer 404: the folder move, whose ownership check sits
 * in its query, and the playtest routes, whose own `findOwnedDeck` treats
 * someone else's deck as missing. B2-57 (owner decision OD-08) makes them all
 * answer 404.
 */
const STRANGER_STATUS_EXCEPTIONS: Readonly<Record<string, 404>> = {
  "PATCH /api/decks/[id]/folder (deck-owner)": 404,
  "GET /api/decks/[id]/playtest-sessions (deck-owner)": 404,
  "POST /api/decks/[id]/playtest-sessions (deck-owner)": 404,
};

/**
 * Bodies that pass validation, for the owner-only routes that validate the
 * body before they check ownership: an empty body would be refused with 400
 * before ownership is looked at.
 */
const VALID_BODIES: Readonly<Record<string, unknown>> = {
  "PATCH /api/decks/[id]/folder (deck-owner)": { folderId: null },
  "POST /api/decks/[id]/playtest-sessions (deck-owner)": {
    result: "win",
    turns: 1,
  },
};

describe("a signed-in caller without the right", () => {
  beforeEach(() => {
    fake.auth.mockResolvedValue({
      user: { id: STRANGER_ID },
      expires: "2099-01-01",
    });
  });

  it.each(
    casesWith("deck-owner").map((routeCase): [string, number, RouteCase] => [
      routeCase.label,
      STRANGER_STATUS_EXCEPTIONS[routeCase.label] ?? 403,
      routeCase,
    ])
  )(
    "%s: currently refuses someone else's deck with %i (pinned; B2-57)",
    async (_label, status, routeCase) => {
      const response = await callRoute(
        routeCase,
        VALID_BODIES[routeCase.label]
      );
      expect(response.status).toBe(status);
    }
  );

  it.each(labelled(casesWith("moderator")))(
    "%s: refuses an account that is not a moderator with 403",
    async (_label, routeCase) => {
      const response = await callRoute(routeCase);
      expect(response.status).toBe(403);
    }
  );

  it.each(labelled(casesWith("api-key")))(
    "%s: refuses a session cookie that carries no API key",
    async (_label, routeCase) => {
      const response = await callRoute(routeCase);
      expect(response.status).toBe(401);
      expect(fake.auth).not.toHaveBeenCalled();
    }
  );
});
