import { describe, expect, it } from "vitest";
import {
  DEFAULT_SCRYFALL_API,
  resolveScryfallApiBaseUrl,
  SCRYFALL_API_BASE_URL_VARIABLE,
} from "./api-base-url";

describe("resolveScryfallApiBaseUrl", () => {
  it("uses Scryfall's own origin when the variable is unset", () => {
    expect(resolveScryfallApiBaseUrl(undefined)).toBe(
      "https://api.scryfall.com"
    );
    expect(DEFAULT_SCRYFALL_API).toBe("https://api.scryfall.com");
  });

  it("treats a blank value as unset", () => {
    expect(resolveScryfallApiBaseUrl("   ")).toBe(DEFAULT_SCRYFALL_API);
  });

  it("uses an absolute http URL as given, so the E2E stack can name a stand-in", () => {
    expect(resolveScryfallApiBaseUrl("http://scryfall:8787")).toBe(
      "http://scryfall:8787"
    );
  });

  it("drops a trailing slash, so `${origin}/cards/search` has one slash", () => {
    expect(resolveScryfallApiBaseUrl("https://mirror.example.test/")).toBe(
      "https://mirror.example.test"
    );
  });

  it("drops every trailing slash, however many", () => {
    expect(resolveScryfallApiBaseUrl("https://mirror.example.test///")).toBe(
      "https://mirror.example.test"
    );
    expect(resolveScryfallApiBaseUrl("http://scryfall:8787/api///")).toBe(
      "http://scryfall:8787/api"
    );
  });

  it("resolves a path of many slashes in linear time, so a hostile value cannot stall startup", () => {
    // A backtracking `/\/+$/` took about 3 s here on the VPS; the scan takes
    // about 60 ms, most of it URL parsing. The 1 s ceiling still fails the
    // regex by a wide margin while leaving room for a loaded CI machine.
    const hostile = `http://scryfall:8787/${"/".repeat(50_000)}x`;
    const started = performance.now();
    const resolved = resolveScryfallApiBaseUrl(hostile);
    const elapsedMs = performance.now() - started;
    expect(resolved).toBe(hostile);
    expect(elapsedMs).toBeLessThan(1000);
  });

  it.each([
    "scryfall:8787",
    "ftp://scryfall",
    "not a url",
    "http://scryfall:8787/?debug=1",
    "http://scryfall:8787/#cards",
  ])("throws at startup for %j, naming the variable", (value) => {
    expect(() => resolveScryfallApiBaseUrl(value)).toThrow(
      SCRYFALL_API_BASE_URL_VARIABLE
    );
  });
});
