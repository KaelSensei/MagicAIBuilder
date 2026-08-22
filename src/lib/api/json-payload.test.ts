import { describe, it, expect } from "vitest";
import { toJsonPayload } from "./json-payload";

describe("toJsonPayload", () => {
  it("passes plain JSON through unchanged", () => {
    expect(toJsonPayload({ a: 1, b: ["x", null], c: true })).toEqual({
      a: 1,
      b: ["x", null],
      c: true,
    });
  });

  it("returns a copy, so a later mutation cannot reach the stored value", () => {
    const source = { nested: { n: 1 } };
    const payload = toJsonPayload(source);
    source.nested.n = 2;
    expect(payload).toEqual({ nested: { n: 1 } });
  });

  // ─── Why this is not structuredClone ────────────────────────────────────────

  it("flattens a Date to an ISO string rather than preserving it", () => {
    // `structuredClone` would keep a Date object here, which is not a
    // `Prisma.InputJsonValue`. Flattening is the whole purpose of this helper.
    expect(toJsonPayload({ at: new Date("2026-08-22T00:00:00.000Z") })).toEqual({
      at: "2026-08-22T00:00:00.000Z",
    });
  });

  it("drops a member with no JSON representation instead of throwing", () => {
    // `structuredClone` throws a DataCloneError on a function; JSON drops it.
    expect(toJsonPayload({ keep: 1, fn: () => "x", gone: undefined })).toEqual({
      keep: 1,
    });
  });

  // ─── The edge all three copies shared ───────────────────────────────────────

  it.each([undefined, () => "x", Symbol("s")])(
    "throws a TypeError naming the caller's mistake for %s",
    (value) => {
      // JSON.stringify returns `undefined` for these, and feeding that to
      // JSON.parse throws `SyntaxError: "undefined" is not valid JSON` — an
      // error that names the parser rather than what the caller did wrong.
      expect(() => toJsonPayload(value)).toThrow(TypeError);
    }
  );

  it("stores a literal null, which is valid JSON", () => {
    expect(toJsonPayload(null)).toBeNull();
  });

  it("keeps a top-level array an array", () => {
    expect(toJsonPayload([1, 2, 3])).toEqual([1, 2, 3]);
  });
});
