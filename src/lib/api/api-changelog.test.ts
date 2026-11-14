/**
 * I-95: a change to the public read API needs a dated changelog line.
 *
 * The OpenAPI document already exists at GET /api/v1/openapi. This check is
 * what stops a breaking change from merging in silence. It does not call
 * the network.
 */
import { describe, expect, it } from "vitest";
import { checkApiChangelog, type ApiChangelogEntry } from "@/lib/api/api-changelog";

const PREVIOUS: ApiChangelogEntry = {
  date: "2026-11-01",
  label: "compatible",
  summary: "The public read routes are listed.",
  routes: ["/api/v1/decks", "/api/v1/decks/{id}", "/api/v1/collection", "/api/v1/openapi"],
  field: null,
  documentHash: "hash-of-the-previous-document",
};

describe("checkApiChangelog", () => {
  it("fails when the OpenAPI document changes and no dated line names the new document", () => {
    expect(
      checkApiChangelog({
        documentHash: "hash-of-the-new-document",
        entries: [PREVIOUS],
      })
    ).toEqual({ ok: false, reason: "missing-dated-line" });
  });

  it("accepts a compatible line whose hash is the document", () => {
    expect(
      checkApiChangelog({
        documentHash: PREVIOUS.documentHash,
        entries: [PREVIOUS],
      })
    ).toEqual({ ok: true });
  });

  it("rejects a breaking line that does not name the field", () => {
    const breaking: ApiChangelogEntry = {
      ...PREVIOUS,
      label: "breaking",
      field: null,
    };

    expect(
      checkApiChangelog({ documentHash: breaking.documentHash, entries: [breaking] })
    ).toEqual({ ok: false, reason: "breaking-without-field" });
  });

  it("accepts a breaking line that names the field and the date", () => {
    const breaking: ApiChangelogEntry = {
      ...PREVIOUS,
      label: "breaking",
      field: "Deck.cards",
    };

    expect(
      checkApiChangelog({ documentHash: breaking.documentHash, entries: [breaking] })
    ).toEqual({ ok: true });
  });

  it("rejects a route outside /api/v1", () => {
    const outside: ApiChangelogEntry = {
      ...PREVIOUS,
      routes: ["/api/decks"],
    };

    expect(
      checkApiChangelog({ documentHash: outside.documentHash, entries: [outside] })
    ).toEqual({ ok: false, reason: "route-outside-v1" });
  });
});
