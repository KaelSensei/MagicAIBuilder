/**
 * The rate limit declared for every API route.
 *
 * Production safety (I-05). The edge middleware does not see `/api`, and the
 * in-memory limiter is the only limit a route has. A route that is not in
 * this list can ship with no declared limit. `routeLimitGaps` is the check:
 * every route file is here, a route that calls `checkRateLimit` is `limited`,
 * and a route that does not is `unlimited`.
 *
 * The numbers are the arguments those routes pass to `checkRateLimit`, read
 * on 2026-11-20. Changing a route's numbers without changing this list leaves
 * the declaration stale; the call-or-not check still holds.
 * Not responsible for: the shared store M2 asks for, or enforcing the limit.
 *
 * @module api/route-limits
 */

/** A counted limit: this many requests per window. */
export interface CountedLimit {
  readonly kind: "limited";
  /** How many requests the window allows. At least 1. */
  readonly requests: number;
  /** Window length in milliseconds. At least 1. */
  readonly windowMs: number;
}

/** The route calls no limiter. The declaration says so on purpose. */
export interface UnlimitedRoute {
  readonly kind: "unlimited";
}

/** Whether a route is limited, and to what. */
export type RouteLimit = CountedLimit | UnlimitedRoute;

/** One route's declared limit. `route` is its folder under `src/app/api`. */
export interface RouteLimitDeclaration {
  readonly route: string;
  readonly limit: RouteLimit;
}

/** A route file as the inventory read it. */
export interface RouteOnDisk {
  readonly route: string;
  /** True when the file calls `checkRateLimit`. */
  readonly callsLimiter: boolean;
}

/** One way the registry and the route files disagree. */
export type RouteLimitGap =
  | { readonly kind: "missing-declaration"; readonly route: string }
  | { readonly kind: "unknown-route"; readonly route: string }
  | { readonly kind: "duplicate-declaration"; readonly route: string }
  | { readonly kind: "limiter-not-declared"; readonly route: string }
  | { readonly kind: "declared-limiter-not-called"; readonly route: string };

/** One minute, the window most of these routes use. */
const PER_MINUTE = 60_000;

function limited(
  route: string,
  requests: number,
  windowMs: number = PER_MINUTE
): RouteLimitDeclaration {
  return { route, limit: { kind: "limited", requests, windowMs } };
}

function unlimited(route: string): RouteLimitDeclaration {
  return { route, limit: { kind: "unlimited" } };
}

/**
 * Every API route and the limit it declares.
 *
 * A new route fails `routeLimitGaps` until it is added here. A limited row
 * names the count and the window the handler passes to `checkRateLimit`.
 */
export const ROUTE_LIMITS: readonly RouteLimitDeclaration[] = [
  unlimited("ai/allowance"),
  limited("ai/build", 5),
  limited("ai/suggest", 10),
  unlimited("auth/[...nextauth]"),
  limited("auth/signup", 5, 15 * PER_MINUTE),
  limited("cache/cards", 120),
  limited("cache/search", 60),
  unlimited("collection"),
  unlimited("collection/[id]"),
  unlimited("collection/acquisition-plan"),
  unlimited("collection/usage"),
  limited("combos", 30),
  unlimited("community/card-packages"),
  unlimited("community/card-packages/[packageId]/apply"),
  unlimited("community/card-packages/[packageId]/preview"),
  unlimited("community/commanders/[slug]/decks"),
  unlimited("community/deck-folders"),
  unlimited("community/deck-folders/[folderId]"),
  unlimited("community/decks/[id]/comments"),
  unlimited("community/decks/[id]/comments/[commentId]"),
  unlimited("community/decks/[id]/ratings"),
  unlimited("community/decks/[id]/reports"),
  unlimited("community/decks/[id]/save"),
  unlimited("community/decks/[id]/vote"),
  unlimited("community/users/[username]/follow"),
  unlimited("deck-folders"),
  unlimited("deck-folders/[folderId]"),
  limited("deck/[id]", 60),
  unlimited("decks"),
  unlimited("decks/[id]"),
  unlimited("decks/[id]/acquisition-intent"),
  unlimited("decks/[id]/cards"),
  unlimited("decks/[id]/cards/[cardId]"),
  unlimited("decks/[id]/command-zone"),
  unlimited("decks/[id]/duplicate"),
  unlimited("decks/[id]/folder"),
  unlimited("decks/[id]/fork"),
  unlimited("decks/[id]/legality"),
  unlimited("decks/[id]/playtest-sessions"),
  unlimited("decks/[id]/rule-zero"),
  unlimited("decks/[id]/share"),
  unlimited("decks/[id]/snapshots"),
  unlimited("decks/[id]/snapshots/[snapshotId]"),
  unlimited("decks/[id]/snapshots/[snapshotId]/restore"),
  unlimited("decks/folders"),
  unlimited("health"),
  limited("import/moxfield-user", 10),
  limited("import/url", 10),
  limited("meta/[commanderSlug]", 30),
  limited("meta/[commanderSlug]/history", 30),
  unlimited("moderation/deck-reports"),
  unlimited("moderation/deck-reports/[reportId]"),
  limited("proxy-card-image", 300),
  limited("search/translate", 10),
  unlimited("share/[token]"),
  unlimited("user/api-keys"),
  unlimited("user/api-keys/[id]"),
  limited("user/export", 1, 60 * PER_MINUTE),
  unlimited("user/init"),
  unlimited("user/notification-preferences"),
  unlimited("user/onboarding"),
  unlimited("user/profile"),
  unlimited("user/username"),
  unlimited("users/[username]"),
  unlimited("v1/collection"),
  unlimited("v1/decks"),
  unlimited("v1/decks/[id]"),
  unlimited("v1/openapi"),
];

function gapRank(kind: RouteLimitGap["kind"]): number {
  switch (kind) {
    case "missing-declaration":
      return 0;
    case "unknown-route":
      return 1;
    case "duplicate-declaration":
      return 2;
    case "limiter-not-declared":
      return 3;
    case "declared-limiter-not-called":
      return 4;
    default: {
      const unhandled: never = kind;
      return unhandled;
    }
  }
}

/**
 * Where the registry and the route files disagree.
 *
 * A route file with no row is `missing-declaration`. A row with no file is
 * `unknown-route`. A repeated row is `duplicate-declaration`. A file that
 * calls `checkRateLimit` while its row is `unlimited` is
 * `limiter-not-declared`; the opposite is `declared-limiter-not-called`.
 *
 * @param routes - the route files on disk
 * @param declarations - the registry, usually {@link ROUTE_LIMITS}
 * @returns the gaps, ordered by route then kind
 */
export function routeLimitGaps(
  routes: readonly RouteOnDisk[],
  declarations: readonly RouteLimitDeclaration[]
): readonly RouteLimitGap[] {
  const declared = new Map<string, RouteLimit>();
  const gaps: RouteLimitGap[] = [];
  for (const declaration of declarations) {
    if (declared.has(declaration.route)) {
      gaps.push({ kind: "duplicate-declaration", route: declaration.route });
      continue;
    }
    declared.set(declaration.route, declaration.limit);
  }

  const onDisk = new Set(routes.map((route) => route.route));
  for (const route of routes) {
    const limit = declared.get(route.route);
    if (limit === undefined) {
      gaps.push({ kind: "missing-declaration", route: route.route });
      continue;
    }
    if (route.callsLimiter && limit.kind === "unlimited") {
      gaps.push({ kind: "limiter-not-declared", route: route.route });
    } else if (!route.callsLimiter && limit.kind === "limited") {
      gaps.push({ kind: "declared-limiter-not-called", route: route.route });
    }
  }
  for (const route of declared.keys()) {
    if (!onDisk.has(route)) {
      gaps.push({ kind: "unknown-route", route });
    }
  }

  return gaps.sort(
    (left, right) =>
      left.route.localeCompare(right.route) ||
      gapRank(left.kind) - gapRank(right.kind)
  );
}
