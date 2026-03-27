import { describe, it, expect } from "vitest";
import { detectSource } from "./url-import";

describe("detectSource", () => {
  // ─── Moxfield ───────────────────────────────────────────────────────────────
  it("detects moxfield deck URL", () => {
    const result = detectSource("https://www.moxfield.com/decks/AbCdEfGhIj");
    expect(result).toEqual({ source: "moxfield", id: "AbCdEfGhIj" });
  });

  it("detects moxfield URL without www", () => {
    const result = detectSource("https://moxfield.com/decks/xyz-123");
    expect(result).toEqual({ source: "moxfield", id: "xyz-123" });
  });

  it("detects moxfield URL with http", () => {
    const result = detectSource("http://www.moxfield.com/decks/my-deck");
    expect(result).toEqual({ source: "moxfield", id: "my-deck" });
  });

  // ─── Archidekt ──────────────────────────────────────────────────────────────
  it("detects archidekt deck URL", () => {
    const result = detectSource("https://archidekt.com/decks/12345678");
    expect(result).toEqual({ source: "archidekt", id: "12345678" });
  });

  it("detects archidekt URL without www", () => {
    const result = detectSource("https://archidekt.com/decks/999");
    expect(result).toEqual({ source: "archidekt", id: "999" });
  });

  it("detects archidekt deck/ singular path", () => {
    const result = detectSource("https://www.archidekt.com/deck/42");
    expect(result).toEqual({ source: "archidekt", id: "42" });
  });

  // ─── Invalid URLs ────────────────────────────────────────────────────────────
  it("returns null for unknown domain", () => {
    expect(detectSource("https://deckstats.net/decks/123")).toBeNull();
  });

  it("returns null for moxfield without deck id", () => {
    expect(detectSource("https://www.moxfield.com/")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(detectSource("")).toBeNull();
  });

  it("returns null for plain text", () => {
    expect(detectSource("not a url")).toBeNull();
  });

  it("returns null for archidekt profile URL", () => {
    expect(detectSource("https://archidekt.com/u/someuser")).toBeNull();
  });
});
