/**
 * Pins how the `unstable_cache` stand-in records its calls and keys its
 * entries, so a leak test that reads `dataCache.wraps` reads what the subject
 * passed, and an omitted `keyParts` reads as Next's default, an empty list.
 */
import { afterEach, describe, expect, it } from "vitest";

import { dataCache, unstable_cache } from "@/test/data-cache-stand-in";

afterEach(() => dataCache.reset());

describe("the unstable_cache stand-in", () => {
  it("records the key parts and options of each wrap, in order", () => {
    unstable_cache(async () => 1, ["decks"], { revalidate: 60 });

    expect(dataCache.wraps).toEqual([
      { keyParts: ["decks"], options: { revalidate: 60 } },
    ]);
  });

  it("records a wrap made without key parts as an empty key list", () => {
    unstable_cache(async () => 1);

    expect(dataCache.wraps).toEqual([{ keyParts: [], options: undefined }]);
  });

  it("answers a second call with the same arguments from the kept entry", async () => {
    let runs = 0;
    const read = unstable_cache(async (id: string) => {
      runs += 1;
      return `deck ${id}`;
    });

    expect(await read("a")).toBe("deck a");
    expect(await read("a")).toBe("deck a");
    expect(await read("b")).toBe("deck b");

    expect(runs).toBe(2);
    expect(dataCache.hits).toBe(1);
  });
});
