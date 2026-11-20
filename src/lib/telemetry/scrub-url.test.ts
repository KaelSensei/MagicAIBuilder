import { readdirSync, statSync } from "node:fs";
import { basename, dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { SCRUBBED_ROUTES, scrubTelemetryUrl } from "./scrub-url";

/** The App Router folder whose dynamic segments the route table mirrors. */
const APP_DIR = join(dirname(fileURLToPath(import.meta.url)), "../../app");

/** Route folders whose value is private to a player. */
const PRIVATE_SEGMENT_FOLDERS: ReadonlySet<string> = new Set([
  "[token]",
  "[username]",
]);

/** Whether a folder is a route group, which adds no URL segment. */
function isRouteGroup(segment: string): boolean {
  return segment.startsWith("(") && segment.endsWith(")");
}

/** Every folder under `src/app` named after a private segment, as a route. */
function privateRouteFolders(): readonly string[] {
  return readdirSync(APP_DIR, { recursive: true, encoding: "utf8" })
    .filter((relativePath) =>
      PRIVATE_SEGMENT_FOLDERS.has(basename(relativePath))
    )
    .filter((relativePath) =>
      statSync(join(APP_DIR, relativePath)).isDirectory()
    )
    .map(
      (relativePath) =>
        "/" +
        relativePath
          .split(sep)
          .filter((segment) => !isRouteGroup(segment))
          .join("/")
    );
}

describe("the scrubbed route table", () => {
  it("lists every route folder named [token] or [username]", () => {
    const folders = privateRouteFolders();

    expect(folders.length).toBeGreaterThan(0);
    expect(SCRUBBED_ROUTES).toEqual(expect.arrayContaining([...folders]));
  });
});

describe("scrubTelemetryUrl", () => {
  it("a share URL loses its token and its query string", () => {
    expect(scrubTelemetryUrl("/share/abc123?x=1")).toBe("/share/[token]");
  });

  it("a French share URL keeps its locale prefix and loses its token", () => {
    expect(scrubTelemetryUrl("/fr/share/abc123")).toBe("/fr/share/[token]");
  });

  it.each([
    ["/u/kael", "/u/[username]"],
    ["/fr/u/kael", "/fr/u/[username]"],
  ])("a profile URL %s loses its username", (url, scrubbed) => {
    expect(scrubTelemetryUrl(url)).toBe(scrubbed);
  });

  it.each([
    ["/api/share/abc123", "/api/share/[token]"],
    ["/api/users/kael", "/api/users/[username]"],
    [
      "/api/community/users/kael/follow",
      "/api/community/users/[username]/follow",
    ],
  ])("an API URL %s loses its token or username", (url, scrubbed) => {
    expect(scrubTelemetryUrl(url)).toBe(scrubbed);
  });

  it("an unrelated path keeps its segments and loses its query string and fragment", () => {
    expect(scrubTelemetryUrl("/fr/decks/42?sort=name#top")).toBe(
      "/fr/decks/42"
    );
  });

  it("an absolute share URL keeps its origin and loses its token, query string and fragment", () => {
    expect(
      scrubTelemetryUrl("https://magicaibuilder.app/fr/share/abc123?x=1#top")
    ).toBe("https://magicaibuilder.app/fr/share/[token]");
  });

  it("a transaction name keeps its HTTP method and loses the token", () => {
    expect(scrubTelemetryUrl("GET /api/share/abc123?x=1")).toBe(
      "GET /api/share/[token]"
    );
  });

  it("a route template, as a transaction name may already be, is left as it is", () => {
    expect(scrubTelemetryUrl("/[locale]/share/[token]")).toBe(
      "/[locale]/share/[token]"
    );
  });

  it("a share path without a token is left as it is", () => {
    expect(scrubTelemetryUrl("/share/")).toBe("/share/");
  });

  it("a URL that cannot be parsed still loses its query string", () => {
    expect(scrubTelemetryUrl("https://[bad/share/abc123?x=1")).toBe(
      "https://[bad/share/abc123"
    );
  });
});
