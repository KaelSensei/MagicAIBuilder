import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import {
  API_KEY_PREFIX,
  API_SCOPES,
  hasScope,
  hashApiKey,
  isWellFormedApiKey,
  mintApiKey,
  parseBearerToken,
  parseScopes,
} from "./keys";

describe("mintApiKey", () => {
  it("prefixes the token so it is recognisable in a log or a secret scanner", () => {
    expect(mintApiKey().token.startsWith(API_KEY_PREFIX)).toBe(true);
  });

  it("carries 32 bytes of entropy as 43 unpadded base64url characters", () => {
    const secret = mintApiKey().token.slice(API_KEY_PREFIX.length);
    expect(secret).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(secret).not.toContain("=");
  });

  it("never repeats", () => {
    const tokens = new Set(Array.from({ length: 200 }, () => mintApiKey().token));
    expect(tokens.size).toBe(200);
  });

  it("returns the hash of the token it returns, and nothing reversible", () => {
    const { token, tokenHash } = mintApiKey();
    expect(tokenHash).toBe(createHash("sha256").update(token, "utf8").digest("hex"));
    expect(tokenHash).not.toContain(token.slice(API_KEY_PREFIX.length));
  });

  it("keeps a display prefix that cannot be used to authenticate", () => {
    const { token, displayPrefix } = mintApiKey();
    expect(token.startsWith(displayPrefix)).toBe(true);
    expect(displayPrefix).toHaveLength(API_KEY_PREFIX.length + 8);
    expect(isWellFormedApiKey(displayPrefix)).toBe(false);
  });
});

describe("hashApiKey", () => {
  it("is stable for one token and different across tokens", () => {
    expect(hashApiKey("mab_abc")).toBe(hashApiKey("mab_abc"));
    expect(hashApiKey("mab_abc")).not.toBe(hashApiKey("mab_abd"));
  });
});

describe("isWellFormedApiKey", () => {
  it("accepts a minted token", () => {
    expect(isWellFormedApiKey(mintApiKey().token)).toBe(true);
  });

  it.each([
    ["", "empty"],
    ["sk_live_0123456789", "another vendor's prefix"],
    ["mab_", "prefix only"],
    ["mab_tooshort", "short secret"],
    [`mab_${"a".repeat(44)}`, "one character too long"],
    [`mab_${"a".repeat(42)}+`, "a character outside base64url"],
  ])("rejects %j (%s)", (candidate) => {
    expect(isWellFormedApiKey(candidate)).toBe(false);
  });
});

describe("parseBearerToken", () => {
  it("reads the token out of a Bearer header", () => {
    expect(parseBearerToken("Bearer mab_abc")).toBe("mab_abc");
  });

  it("matches the scheme case-insensitively, as RFC 7235 defines it", () => {
    expect(parseBearerToken("bearer mab_abc")).toBe("mab_abc");
    expect(parseBearerToken("BEARER mab_abc")).toBe("mab_abc");
  });

  it("tolerates extra spaces between the scheme and the token", () => {
    expect(parseBearerToken("Bearer   mab_abc")).toBe("mab_abc");
  });

  it.each<readonly [string | null, string]>([
    [null, "absent"],
    ["", "empty"],
    ["mab_abc", "no scheme"],
    ["Basic dXNlcjpwYXNz", "a different scheme"],
    ["Bearer", "no token"],
    ["Bearer ", "empty token"],
    ["Bearer a b", "two tokens"],
  ])("returns null for %j (%s)", (header) => {
    expect(parseBearerToken(header)).toBeNull();
  });
});

describe("scopes", () => {
  it("recognises a granted scope", () => {
    expect(hasScope(["decks:read"], "decks:read")).toBe(true);
  });

  it("does not treat one scope as implying another", () => {
    expect(hasScope(["collection:read"], "decks:read")).toBe(false);
  });

  it("drops stored scopes the code no longer defines", () => {
    // A scope removed from the codebase must not keep granting anything just
    // because an old row still lists it.
    expect(parseScopes(["decks:read", "decks:write", "nonsense"])).toEqual(["decks:read"]);
  });

  it("keeps every scope the code does define", () => {
    expect(parseScopes([...API_SCOPES])).toEqual([...API_SCOPES]);
  });
});
