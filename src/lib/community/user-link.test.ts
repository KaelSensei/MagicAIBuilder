import { describe, expect, it } from "vitest";
import { classifyUserLink } from "./user-link";

describe("classifyUserLink", () => {
  it.each([
    ["a site path", "/decks/42", "/decks/42"],
    [
      "a site path with a query and a fragment",
      "/decks/42?tab=primer#plan",
      "/decks/42?tab=primer#plan",
    ],
  ])(
    "keeps %s on this site, as a root-relative path",
    (_case, destination, href) => {
      expect(classifyUserLink(destination)).toEqual({
        kind: "same-site",
        href,
      });
    }
  );

  it("keeps a fragment as an anchor on the page it is written on", () => {
    expect(classifyUserLink("#primer-game-plan")).toEqual({
      kind: "same-site",
      href: "#primer-game-plan",
    });
  });

  it("treats a protocol-relative URL as an external link to the host it names", () => {
    expect(classifyUserLink("//evil.example/phish")).toEqual({
      kind: "external",
      href: "https://evil.example/phish",
    });
  });

  it.each([
    ["an http URL", "http://example.com/guide", "http://example.com/guide"],
    ["an https URL", "https://example.com/guide", "https://example.com/guide"],
    [
      "an upper-case scheme and host",
      "HTTPS://EXAMPLE.COM/GUIDE",
      "https://example.com/GUIDE",
    ],
    [
      "a backslash after the first slash",
      "/\\evil.example/phish",
      "https://evil.example/phish",
    ],
    [
      "a tab between the slashes",
      "/\t/evil.example/phish",
      "https://evil.example/phish",
    ],
    ["two backslashes", "\\\\evil.example/phish", "https://evil.example/phish"],
    [
      "another scheme without slashes",
      "http:evil.example",
      "http://evil.example/",
    ],
  ])(
    "treats %s as an external link, at its canonical address",
    (_case, destination, href) => {
      expect(classifyUserLink(destination)).toEqual({ kind: "external", href });
    }
  );

  it.each([
    ["a javascript: URL", "javascript:alert(1)"],
    ["a javascript: URL in mixed case", "JaVaScRiPt:alert(1)"],
    ["a javascript: URL after leading spaces", "   javascript:alert(1)"],
    [
      "a javascript: URL after a control character",
      "\u0000javascript:alert(1)",
    ],
    ["a javascript: URL split by a tab", "jav\tascript:alert(1)"],
    ["a javascript: URL split by a newline", "java\nscript:alert(1)"],
    ["a data: URL", "data:text/html,<script>alert(1)</script>"],
    ["a data: URL in capitals", "DATA:text/html,<b>hi</b>"],
    ["a vbscript: URL", "vbscript:msgbox(1)"],
    ["a vbscript: URL in mixed case", "VBScript:msgbox(1)"],
    ["a mailto: address", "mailto:owner@example.com"],
    ["a file: URL", "file:///etc/passwd"],
    ["a blob: URL", "blob:https://example.com/0b7c"],
    ["an ftp: URL", "ftp://example.com/deck.txt"],
  ])("refuses %s", (_case, destination) => {
    expect(classifyUserLink(destination)).toEqual({ kind: "refused" });
  });

  it.each([
    ["a relative path", "decks/42"],
    ["a query on its own", "?tab=primer"],
    ["an empty fragment", "#"],
    ["an empty destination", ""],
    ["the page's own scheme without slashes", "https:evil.example"],
    ["a named-entity spelling of javascript:", "javascript&colon;alert(1)"],
    ["a numeric-entity spelling of javascript:", "&#106;avascript:alert(1)"],
  ])(
    "refuses %s, which only makes sense relative to the page it is written on",
    (_case, destination) => {
      expect(classifyUserLink(destination)).toEqual({ kind: "refused" });
    }
  );

  it("refuses a path whose dot segments collapse into a protocol-relative URL", () => {
    expect(classifyUserLink("/.//evil.example/phish")).toEqual({
      kind: "refused",
    });
  });

  it("refuses a destination the URL parser cannot read", () => {
    expect(classifyUserLink("https://[not-a-host")).toEqual({
      kind: "refused",
    });
  });
});
