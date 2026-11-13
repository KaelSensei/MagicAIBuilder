import { describe, expect, it } from "vitest";

import { fileStem } from "./slug";

describe("fileStem", () => {
  it("folds each run of spaces and punctuation into one hyphen and trims the ends", () => {
    expect(fileStem("  My Deck! v2 ")).toBe("My-Deck-v2");
  });

  it("keeps the case of the name", () => {
    expect(fileStem("Atraxa Superfriends")).toBe("Atraxa-Superfriends");
  });

  it("keeps digits and existing hyphens", () => {
    expect(fileStem("mono-red 2024")).toBe("mono-red-2024");
  });

  it("falls back to 'deck' when nothing of the name survives", () => {
    expect(fileStem("")).toBe("deck");
    expect(fileStem("   ")).toBe("deck");
    expect(fileStem("!!!")).toBe("deck");
  });

  it("currently drops an accented letter instead of transliterating it (pinned)", () => {
    expect(fileStem("Ürza's Saga")).toBe("rza-s-Saga");
  });
});
