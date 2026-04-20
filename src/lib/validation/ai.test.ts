import { describe, it, expect } from "vitest";
import { sanitizeForPrompt } from "./ai";
import { buildSchema } from "./ai";

describe("sanitizeForPrompt", () => {
  it("removes backticks", () => {
    expect(sanitizeForPrompt("hello `world`")).toBe("hello world");
  });

  it("removes single quotes", () => {
    expect(sanitizeForPrompt("it's a test")).toBe("its a test");
  });

  it("removes double quotes", () => {
    expect(sanitizeForPrompt('say "hello"')).toBe("say hello");
  });

  it("removes backslashes", () => {
    expect(sanitizeForPrompt("path\\to\\file")).toBe("pathtofile");
  });

  it("removes curly braces", () => {
    expect(sanitizeForPrompt("{inject}")).toBe("inject");
  });

  it("removes square brackets", () => {
    expect(sanitizeForPrompt("[test]")).toBe("test");
  });

  it("replaces newlines with spaces", () => {
    expect(sanitizeForPrompt("line1\nline2")).toBe("line1 line2");
  });

  it("replaces carriage returns with spaces", () => {
    expect(sanitizeForPrompt("line1\rline2")).toBe("line1 line2");
  });

  it("trims whitespace", () => {
    expect(sanitizeForPrompt("  hello  ")).toBe("hello");
  });

  it("truncates to maxLen (default 100)", () => {
    const long = "a".repeat(200);
    expect(sanitizeForPrompt(long)).toHaveLength(100);
  });

  it("truncates to custom maxLen", () => {
    expect(sanitizeForPrompt("hello world", 5)).toBe("hello");
  });

  it("handles empty string", () => {
    expect(sanitizeForPrompt("")).toBe("");
  });

  it("preserves normal text", () => {
    expect(sanitizeForPrompt("Atraxa, Praetors Voice")).toBe(
      "Atraxa, Praetors Voice"
    );
  });
});

describe("buildSchema", () => {
  it("accepts valid input", () => {
    const result = buildSchema.safeParse({
      colors: ["W", "U"],
      strategy: "control",
      bracket: 2,
    });
    expect(result.success).toBe(true);
  });

  it("defaults budget to null", () => {
    const result = buildSchema.safeParse({
      colors: ["R"],
      strategy: "aggro",
      bracket: 1,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.budget).toBeNull();
  });

  it("rejects empty colors array", () => {
    const result = buildSchema.safeParse({
      colors: [],
      strategy: "midrange",
      bracket: 3,
    });
    expect(result.success).toBe(false);
  });

  it("accepts bracket 5 (cEDH)", () => {
    const result = buildSchema.safeParse({
      colors: ["G"],
      strategy: "ramp",
      bracket: 5,
    });
    expect(result.success).toBe(true);
  });

  it("rejects bracket out of range", () => {
    const result = buildSchema.safeParse({
      colors: ["G"],
      strategy: "ramp",
      bracket: 6,
    });
    expect(result.success).toBe(false);
  });

  it("rejects bracket below 1", () => {
    const result = buildSchema.safeParse({
      colors: ["B"],
      strategy: "combo",
      bracket: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects strategy over 50 chars", () => {
    const result = buildSchema.safeParse({
      colors: ["U"],
      strategy: "a".repeat(51),
      bracket: 2,
    });
    expect(result.success).toBe(false);
  });

  it("accepts all 5 colors + C", () => {
    const result = buildSchema.safeParse({
      colors: ["W", "U", "B", "R", "G", "C"],
      strategy: "5c goodstuff",
      bracket: 4,
      commanderName: "Kenrith, the Returned King",
      budget: 500,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid color value", () => {
    const result = buildSchema.safeParse({
      colors: ["X"],
      strategy: "test",
      bracket: 1,
    });
    expect(result.success).toBe(false);
  });
});
