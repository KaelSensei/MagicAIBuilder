import { readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ROUTE_LIMITS,
  routeLimitGaps,
  type RouteLimitDeclaration,
  type RouteOnDisk,
} from "./route-limits";

const LIMITED: RouteLimitDeclaration = {
  route: "ai/suggest",
  limit: { kind: "limited", requests: 10, windowMs: 60_000 },
};

const OPEN: RouteLimitDeclaration = {
  route: "health",
  limit: { kind: "unlimited" },
};

describe("routeLimitGaps", () => {
  it("reports a route the registry does not declare", () => {
    expect(
      routeLimitGaps(
        [
          { route: "ai/suggest", callsLimiter: true },
          { route: "health", callsLimiter: false },
        ],
        [LIMITED]
      )
    ).toEqual([{ kind: "missing-declaration", route: "health" }]);
  });

  it("reports a declaration whose route file is gone", () => {
    expect(routeLimitGaps([], [LIMITED])).toEqual([
      { kind: "unknown-route", route: "ai/suggest" },
    ]);
  });

  it("reports a route declared twice", () => {
    expect(
      routeLimitGaps(
        [{ route: "ai/suggest", callsLimiter: true }],
        [LIMITED, LIMITED]
      )
    ).toEqual([{ kind: "duplicate-declaration", route: "ai/suggest" }]);
  });

  it("reports a limiter the registry calls unlimited", () => {
    expect(
      routeLimitGaps([{ route: "health", callsLimiter: true }], [OPEN])
    ).toEqual([{ kind: "limiter-not-declared", route: "health" }]);
  });

  it("reports a declared limiter the route never calls", () => {
    expect(
      routeLimitGaps([{ route: "ai/suggest", callsLimiter: false }], [LIMITED])
    ).toEqual([{ kind: "declared-limiter-not-called", route: "ai/suggest" }]);
  });

  it("accepts a limited route that calls the limiter and an open route that does not", () => {
    const routes: readonly RouteOnDisk[] = [
      { route: "ai/suggest", callsLimiter: true },
      { route: "health", callsLimiter: false },
    ];
    expect(routeLimitGaps(routes, [LIMITED, OPEN])).toEqual([]);
  });
});

const API_DIR = join(process.cwd(), "src", "app", "api");

function routeFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return routeFiles(path);
    return entry.name === "route.ts" || entry.name === "route.tsx"
      ? [path]
      : [];
  });
}

function routesOnDisk(): RouteOnDisk[] {
  return routeFiles(API_DIR).map((file) => ({
    route: relative(API_DIR, file).split(sep).slice(0, -1).join("/"),
    callsLimiter: readFileSync(file, "utf8").includes("checkRateLimit("),
  }));
}

describe("ROUTE_LIMITS", () => {
  it("declares every API route, and only a route that calls the limiter is limited", () => {
    expect(routeLimitGaps(routesOnDisk(), ROUTE_LIMITS)).toEqual([]);
  });

  it("gives every limited route a positive count and window", () => {
    const limited = ROUTE_LIMITS.filter(
      (entry) => entry.limit.kind === "limited"
    );
    expect(limited.length).toBeGreaterThan(0);
    for (const entry of limited) {
      if (entry.limit.kind !== "limited") continue;
      expect(entry.limit.requests).toBeGreaterThan(0);
      expect(entry.limit.windowMs).toBeGreaterThan(0);
    }
  });
});
