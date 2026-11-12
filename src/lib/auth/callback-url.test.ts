import { describe, expect, it } from "vitest";
import { DEFAULT_CALLBACK_URL, sanitizeCallbackUrl } from "./callback-url";

/**
 * The sign-in and sign-up forms send the browser to `callbackUrl` with
 * `location.href` once the session exists. Whatever this returns is navigated
 * to, so anything that can leave the origin — or run as a script — must fall
 * back to the deck list instead.
 */
describe("sanitizeCallbackUrl", () => {
  it.each([
    ["the guest builder", "/builder/guest", "/builder/guest"],
    ["a localized page", "/fr/builder/x", "/fr/builder/x"],
    ["a query and a fragment", "/decks?page=2#top", "/decks?page=2#top"],
    ["the site root", "/", "/"],
    ["dot segments that stay on the site", "/fr/../decks", "/decks"],
  ])("keeps %s", (_label, raw, expected) => {
    expect(sanitizeCallbackUrl(raw)).toBe(expected);
  });

  it.each([
    ["a missing value", null],
    ["an empty value", ""],
    ["a protocol-relative URL", "//evil.com"],
    ["a protocol-relative URL with a path", "//evil.com/decks"],
    ["an absolute foreign URL", "https://evil.com"],
    ["an absolute URL on this site", "http://localhost:3000/decks"],
    ["a backslash the browser reads as a slash", "/\\evil.com"],
    ["a leading backslash pair", "\\\\evil.com"],
    ["a tab the URL parser strips", "/\t/evil.com"],
    ["a dot segment that collapses into //", "/.//evil.com"],
    ["a parent segment that collapses into //", "/a/../..//evil.com"],
    ["a script URL", "javascript:alert(1)"],
    ["a data URL", "data:text/html,<script>alert(1)</script>"],
    ["a path relative to the current page", "decks"],
    ["a leading space", " /decks"],
  ])("falls back to the deck list for %s", (_label, raw) => {
    expect(sanitizeCallbackUrl(raw)).toBe(DEFAULT_CALLBACK_URL);
  });

  it("falls back to the deck list by default", () => {
    expect(DEFAULT_CALLBACK_URL).toBe("/decks");
  });
});
