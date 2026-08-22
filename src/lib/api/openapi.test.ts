import { describe, it, expect } from "vitest";
import { readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { buildOpenApiDocument, DOCUMENTED_PATHS, API_VERSION } from "./openapi";
import { API_SCOPES } from "./keys";

const V1_DIR = join(process.cwd(), "src", "app", "api", "v1");

/**
 * Every route under `/api/v1`, as an OpenAPI path.
 *
 * `[id]` on disk is `{id}` in a spec; a directory holding a `route.ts` is an
 * endpoint, one without is only a segment.
 */
function routeFilePaths(dir: string, prefix = ""): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const segment = entry.name.replace(/^\[(.+)\]$/, "{$1}");
    const path = `${prefix}/${segment}`;
    if (existsSync(join(dir, entry.name, "route.ts"))) found.push(path);
    found.push(...routeFilePaths(join(dir, entry.name), path));
  }
  return found;
}

/** `/openapi` describes the API rather than being part of it. */
const NOT_AN_API_PATH = new Set(["/openapi"]);

const doc = buildOpenApiDocument("https://example.test/api/v1");

describe("the spec cannot drift from the routes", () => {
  const onDisk = routeFilePaths(V1_DIR).filter((p) => !NOT_AN_API_PATH.has(p));

  it("finds the route files at all — a broken walk would pass every check below vacuously", () => {
    expect(onDisk.length).toBeGreaterThan(0);
  });

  it.each(onDisk)("documents %s", (path) => {
    expect(Object.keys(doc.paths)).toContain(path);
  });

  it.each([...DOCUMENTED_PATHS])("has a route file for the documented %s", (path) => {
    expect(onDisk).toContain(path);
  });

  it("keeps DOCUMENTED_PATHS and the document itself in step", () => {
    expect(Object.keys(doc.paths).toSorted()).toEqual([...DOCUMENTED_PATHS].toSorted());
  });
});

describe("buildOpenApiDocument", () => {
  it("is OpenAPI 3.1 and carries the API version", () => {
    expect(doc.openapi).toBe("3.1.0");
    expect(doc.info.version).toBe(API_VERSION);
  });

  it("puts the caller's own origin in the servers block", () => {
    expect(doc.servers).toEqual([{ url: "https://example.test/api/v1" }]);
  });

  it("requires the bearer scheme globally", () => {
    expect(doc.security).toEqual([{ apiKey: [] }]);
    expect(doc.components.securitySchemes.apiKey).toMatchObject({
      type: "http",
      scheme: "bearer",
    });
  });

  it("names every scope the code defines, so the docs cannot omit a new one", () => {
    for (const scope of API_SCOPES) {
      expect(doc.components.securitySchemes.apiKey.description).toContain(scope);
    }
  });

  it("documents the error envelope every route actually returns", () => {
    const codes = doc.components.schemas.Error.properties.error.properties.code.enum;
    expect(codes).toEqual([
      "unauthorized",
      "forbidden",
      "not_found",
      "rate_limited",
      "invalid_request",
      "server_error",
    ]);
  });

  it("describes the auth and rate-limit failures on every operation", () => {
    for (const [path, item] of Object.entries(doc.paths)) {
      const responses = Object.keys(item.get.responses);
      expect(responses, `${path} is missing an auth or throttling response`).toEqual(
        expect.arrayContaining(["401", "403", "429", "500"])
      );
    }
  });

  it("names a known required scope on every operation", () => {
    for (const [path, item] of Object.entries(doc.paths)) {
      const scope = item.get["x-required-scope"];
      expect(API_SCOPES, `${path} requires an unknown scope`).toContain(scope);
    }
  });

  it("leaves no scope decorative — each one gates at least one operation", () => {
    // `collection:read` shipped with the first key and gated nothing for two
    // commits: a permission a user could tick that bought no access. An
    // advertised permission with no meaning is worse than a missing one — it
    // invites a caller to request the narrowest scope that fits and then fail
    // at runtime for reasons the docs deny.
    const gated = new Set(
      Object.values(doc.paths).map((item) => item.get["x-required-scope"])
    );
    for (const scope of API_SCOPES) {
      expect(gated, `${scope} is granted but gates nothing`).toContain(scope);
    }
  });

  it("gives every operation a unique operationId, which client generators key on", () => {
    const ids = Object.values(doc.paths).map((item) => item.get.operationId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every(Boolean)).toBe(true);
  });

  it("serialises to JSON without cycles or undefined", () => {
    const round = JSON.parse(JSON.stringify(doc));
    expect(round).toEqual(doc);
  });

  it("resolves every $ref it uses", () => {
    const refs = [...JSON.stringify(doc).matchAll(/"\$ref":"([^"]+)"/g)].map((m) => m[1]);
    expect(refs.length).toBeGreaterThan(0);
    for (const ref of refs) {
      const name = ref.replace("#/components/schemas/", "");
      expect(Object.keys(doc.components.schemas), `dangling ${ref}`).toContain(name);
    }
  });
});
