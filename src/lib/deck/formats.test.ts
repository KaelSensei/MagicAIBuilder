import { describe, it, expect } from "vitest";
import {
  FORMAT_CONFIG,
  ALL_FORMATS,
  FORMAT_OPTIONS,
  getFormatConfig,
} from "./formats";
import type { DeckFormat } from "./formats";

describe("FORMAT_CONFIG", () => {
  it("has an entry for every format in ALL_FORMATS", () => {
    for (const format of ALL_FORMATS) {
      expect(FORMAT_CONFIG[format]).toBeDefined();
      expect(FORMAT_CONFIG[format].label).toBeTruthy();
      expect(FORMAT_CONFIG[format].scryfallLegality).toBeTruthy();
    }
  });

  it("Commander has correct config", () => {
    const cfg = FORMAT_CONFIG.commander;
    expect(cfg.deckSize).toBe(100);
    expect(cfg.isSingleton).toBe(true);
    expect(cfg.hasCommander).toBe(true);
    expect(cfg.hasBracketScoring).toBe(true);
    expect(cfg.hasColorIdentity).toBe(true);
    expect(cfg.maxCopiesPerCard).toBe(1);
  });

  it("Standard has correct config", () => {
    const cfg = FORMAT_CONFIG.standard;
    expect(cfg.deckSize).toBe(60);
    expect(cfg.sideboardSize).toBe(15);
    expect(cfg.isSingleton).toBe(false);
    expect(cfg.hasCommander).toBe(false);
    expect(cfg.hasBracketScoring).toBe(false);
    expect(cfg.hasColorIdentity).toBe(false);
    expect(cfg.maxCopiesPerCard).toBe(4);
  });

  it("Brawl has commander but no bracket scoring", () => {
    const cfg = FORMAT_CONFIG.brawl;
    expect(cfg.hasCommander).toBe(true);
    expect(cfg.hasBracketScoring).toBe(false);
    expect(cfg.deckSize).toBe(60);
  });

  it("all 60-card formats have sideboardSize 15", () => {
    const sixtyCardFormats: DeckFormat[] = ["standard", "pioneer", "modern", "legacy", "vintage", "pauper"];
    for (const format of sixtyCardFormats) {
      expect(FORMAT_CONFIG[format].sideboardSize).toBe(15);
    }
  });
});

describe("getFormatConfig", () => {
  it("returns correct config for known format", () => {
    expect(getFormatConfig("modern").label).toBe("Modern");
    expect(getFormatConfig("pauper").scryfallLegality).toBe("pauper");
  });

  it("falls back to Commander for unknown format", () => {
    const cfg = getFormatConfig("unknown_format");
    expect(cfg.label).toBe("Commander");
    expect(cfg.deckSize).toBe(100);
  });
});

describe("FORMAT_OPTIONS", () => {
  it("has same length as ALL_FORMATS", () => {
    expect(FORMAT_OPTIONS).toHaveLength(ALL_FORMATS.length);
  });

  it("first option is Commander", () => {
    expect(FORMAT_OPTIONS[0].value).toBe("commander");
    expect(FORMAT_OPTIONS[0].label).toBe("Commander");
  });
});
