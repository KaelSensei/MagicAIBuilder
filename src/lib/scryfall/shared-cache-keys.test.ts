import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  cardCacheRowKey,
  parseCardCacheId,
  parseSearchCacheKey,
  searchCacheRowKey,
  SHARED_CACHE_NAMESPACE,
} from "./shared-cache-keys";

function searchKey(params: Record<string, string>) {
  return parseSearchCacheKey(new URLSearchParams(params));
}

describe("parseSearchCacheKey", () => {
  it.each([
    "banned:commander",
    'id<=wubrg t:creature (o:"draw a card" or o:scry) -t:legendary',
    '!"Lim-Dûl\'s Vault"',
    '!"R&D\'s Secret Lair" or !"+2 Mace"',
    "name:/^Sol/ mana:{T}",
    'lang:ja unique:cards (!"Ratonhnhaké:ton")',
    "Épée de feu et de glace",
    "稲妻",
    "x".repeat(1000),
  ])("accepts %s", (query) => {
    expect(searchKey({ query })).toEqual({
      ok: true,
      key: { query, page: 1, multilingual: false },
    });
  });

  it("reads the page and the multilingual flag", () => {
    expect(
      searchKey({ query: "t:goblin", page: "100", multilingual: "1" })
    ).toEqual({
      ok: true,
      key: { query: "t:goblin", page: 100, multilingual: true },
    });
  });

  it.each([
    ["a tab", "t:goblin\tt:elf"],
    ["a zero-width space", "Sol\u200bRing"],
    ["a non-breaking space", "Sol\u00a0Ring"],
    ["a DEL character", "t:goblin\u007f"],
  ])("refuses a query holding %s", (_label, query) => {
    expect(searchKey({ query })).toMatchObject({ ok: false });
  });

  it.each(["-1", "01a", "1e2", " 1", "1000"])("refuses page %j", (page) => {
    expect(searchKey({ query: "t:goblin", page })).toMatchObject({ ok: false });
  });
});

describe("searchCacheRowKey", () => {
  const base = { query: "is:gamechanger", page: 1, multilingual: false };

  it("is stable for one page and starts with the namespace", () => {
    expect(searchCacheRowKey(base)).toBe(searchCacheRowKey({ ...base }));
    expect(searchCacheRowKey(base).startsWith(SHARED_CACHE_NAMESPACE)).toBe(
      true
    );
  });

  it("differs by query, page and multilingual flag", () => {
    const keys = new Set([
      searchCacheRowKey(base),
      searchCacheRowKey({ ...base, query: "is:gamechanger " }),
      searchCacheRowKey({ ...base, page: 2 }),
      searchCacheRowKey({ ...base, multilingual: true }),
    ]);
    expect(keys.size).toBe(4);
  });

  it("never equals a key from the client-written scheme", () => {
    const legacy = createHash("sha256")
      .update("is:gamechanger|1")
      .digest("hex");
    expect(searchCacheRowKey(base)).not.toBe(legacy);
  });
});

describe("parseCardCacheId and cardCacheRowKey", () => {
  it("lower-cases a Scryfall id and namespaces its row key", () => {
    const parsed = parseCardCacheId(
      new URLSearchParams({ id: "0000579F-7B35-4ED3-B44C-DB2A538066FE" })
    );
    expect(parsed).toEqual({
      ok: true,
      key: "0000579f-7b35-4ed3-b44c-db2a538066fe",
    });
    expect(cardCacheRowKey("0000579f-7b35-4ed3-b44c-db2a538066fe")).toBe(
      `${SHARED_CACHE_NAMESPACE}0000579f-7b35-4ed3-b44c-db2a538066fe`
    );
  });
});
