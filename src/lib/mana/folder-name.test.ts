import { describe, expect, it } from "vitest";
import { readableFolderName, tokenizeFolderName } from "./folder-name";

describe("tokenizeFolderName", () => {
  it.each(["{X}", "{C}", "{W/U}", "{w}", "{W", "W}"])(
    "an unknown token stays as typed: %s",
    (token) => {
      const name = `${token} Storm`;

      expect(tokenizeFolderName(name)).toEqual([
        { kind: "text", text: name, start: 0 },
      ]);
    }
  );

  it("reads the five upper-case colour tokens as mana symbols", () => {
    expect(tokenizeFolderName("{W}{U} Control")).toEqual([
      { kind: "mana", color: "W", start: 0 },
      { kind: "mana", color: "U", start: 3 },
      { kind: "text", text: " Control", start: 6 },
    ]);
    expect(tokenizeFolderName("{B}{R}{G}").map((part) => part.kind)).toEqual([
      "mana",
      "mana",
      "mana",
    ]);
  });

  it("keeps a name without a token as one text part", () => {
    expect(tokenizeFolderName("Competitive")).toEqual([
      { kind: "text", text: "Competitive", start: 0 },
    ]);
  });

  it("keeps the text between and after symbols in order", () => {
    expect(tokenizeFolderName("Mono{G} and {G}{W}")).toEqual([
      { kind: "text", text: "Mono", start: 0 },
      { kind: "mana", color: "G", start: 4 },
      { kind: "text", text: " and ", start: 7 },
      { kind: "mana", color: "G", start: 12 },
      { kind: "mana", color: "W", start: 15 },
    ]);
  });
});

describe("readableFolderName", () => {
  it("reads each symbol as its letter, never as a brace sequence", () => {
    expect(readableFolderName(tokenizeFolderName("{W}{U} Control"))).toBe(
      "W U Control"
    );
    expect(readableFolderName(tokenizeFolderName("Mono{G}"))).toBe("Mono G");
  });
});
