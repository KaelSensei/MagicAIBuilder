/**
 * Characterization suite for `GET /api/v1/openapi`: the public, machine-readable
 * description of the v1 API. The document itself is pinned against the routes
 * by `lib/api/openapi.test.ts`; the route had no test (audit "server" §6 item 4,
 * audit "tests-tooling" §6.1). This pins what the route adds: no credential,
 * the server URL taken from the request, and the cache header.
 */
import { describe, expect, it } from "vitest";

import { buildOpenApiDocument } from "@/lib/api/openapi";
import { GET } from "./route";

/** @returns the route's answer to a request for `url` with these headers */
function openapi(url: string, headers: Record<string, string> = {}): Response {
  return GET(new Request(url, { headers }));
}

describe("GET /api/v1/openapi", () => {
  it("serves the document to a caller with no credential", async () => {
    const response = openapi("https://magic.example/api/v1/openapi");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/json");
    expect(await response.json()).toEqual(
      buildOpenApiDocument("https://magic.example/api/v1")
    );
  });

  it("names the origin the request arrived on as the API server", async () => {
    const response = openapi("http://localhost:3000/api/v1/openapi");
    const document = await response.json();
    expect(document.servers).toEqual([{ url: "http://localhost:3000/api/v1" }]);
  });

  it("prefers the forwarded host and protocol a proxy sets", async () => {
    const response = openapi("http://10.0.0.7:3000/api/v1/openapi", {
      "x-forwarded-host": "preview.magic.example",
      "x-forwarded-proto": "https",
    });
    const document = await response.json();
    expect(document.servers).toEqual([
      { url: "https://preview.magic.example/api/v1" },
    ]);
  });

  it("lets clients cache it for five minutes, then revalidate", () => {
    const response = openapi("https://magic.example/api/v1/openapi");
    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=300, must-revalidate"
    );
  });
});
