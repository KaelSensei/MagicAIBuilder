import { describe, it, expect } from "vitest";
import { detectSource } from "./url-import";

describe("detectSource", () => {
  // ─── Moxfield ───────────────────────────────────────────────────────────────
  it("detects moxfield deck URL", () => {
    expect(detectSource("https://www.moxfield.com/decks/AbCdEfGhIj"))
      .toEqual({ source: "moxfield", id: "AbCdEfGhIj" });
  });

  it("detects moxfield without www", () => {
    expect(detectSource("https://moxfield.com/decks/xyz-123"))
      .toEqual({ source: "moxfield", id: "xyz-123" });
  });

  // ─── Archidekt ──────────────────────────────────────────────────────────────
  it("detects archidekt /decks/ URL", () => {
    expect(detectSource("https://archidekt.com/decks/12345678"))
      .toEqual({ source: "archidekt", id: "12345678" });
  });

  it("detects archidekt /deck/ singular", () => {
    expect(detectSource("https://www.archidekt.com/deck/42"))
      .toEqual({ source: "archidekt", id: "42" });
  });

  // ─── TappedOut ──────────────────────────────────────────────────────────────
  it("detects tappedout URL", () => {
    expect(detectSource("https://tappedout.net/mtg-decks/my-cool-deck/"))
      .toEqual({ source: "tappedout", id: "my-cool-deck" });
  });

  it("detects tappedout without trailing slash", () => {
    expect(detectSource("https://www.tappedout.net/mtg-decks/atraxa-stax"))
      .toEqual({ source: "tappedout", id: "atraxa-stax" });
  });

  // ─── MTGTop8 ────────────────────────────────────────────────────────────────
  it("detects mtgtop8 deck URL with d param", () => {
    const result = detectSource("https://www.mtgtop8.com/event?e=1234&d=5678");
    expect(result).toEqual({ source: "mtgtop8", id: "5678" });
  });

  it("detects mtgtop8 with d param first", () => {
    const result = detectSource("https://www.mtgtop8.com/event?d=9999&e=1111");
    expect(result).toEqual({ source: "mtgtop8", id: "9999" });
  });

  // ─── MTGDecks ────────────────────────────────────────────────────────────────
  it("detects mtgdecks URL", () => {
    expect(detectSource("https://mtgdecks.net/Commander/atraxa-superfriends"))
      .toEqual({ source: "mtgdecks", id: "atraxa-superfriends" });
  });

  // ─── EDHRec ──────────────────────────────────────────────────────────────────
  it("detects edhrec commander URL", () => {
    expect(detectSource("https://edhrec.com/commanders/atraxa-praetors-voice"))
      .toEqual({ source: "edhrec", id: "atraxa-praetors-voice" });
  });

  it("detects edhrec without www", () => {
    expect(detectSource("https://edhrec.com/commanders/edgar-markov"))
      .toEqual({ source: "edhrec", id: "edgar-markov" });
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

  it("returns null for edhrec non-commander URL", () => {
    expect(detectSource("https://edhrec.com/cards/sol-ring")).toBeNull();
  });
});
