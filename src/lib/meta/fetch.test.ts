import { describe, it, expect } from "vitest";
import { commanderToSlug } from "./fetch";

describe("commanderToSlug", () => {
  it("converts simple name", () => {
    expect(commanderToSlug("Atraxa")).toBe("atraxa");
  });

  it("converts name with comma and apostrophe", () => {
    expect(commanderToSlug("Atraxa, Praetors' Voice")).toBe("atraxa-praetors-voice");
  });

  it("converts name with special chars", () => {
    expect(commanderToSlug("Edgar, Charmed Groom")).toBe("edgar-charmed-groom");
  });

  it("converts multi-word name", () => {
    expect(commanderToSlug("The Ur-Dragon")).toBe("the-ur-dragon");
  });

  it("handles trailing/leading spaces", () => {
    expect(commanderToSlug("  Sol Ring  ")).toBe("sol-ring");
  });

  it("strips quotes and punctuation", () => {
    expect(commanderToSlug("Tymna the Weaver")).toBe("tymna-the-weaver");
  });

  it("lowercases everything", () => {
    expect(commanderToSlug("KENRITH")).toBe("kenrith");
  });

  it("handles empty string", () => {
    expect(commanderToSlug("")).toBe("");
  });

  it("handles multiple spaces", () => {
    expect(commanderToSlug("A  B  C")).toBe("a-b-c");
  });

  it("strips numbers are kept", () => {
    expect(commanderToSlug("Sliver Overlord 2")).toBe("sliver-overlord-2");
  });
});
