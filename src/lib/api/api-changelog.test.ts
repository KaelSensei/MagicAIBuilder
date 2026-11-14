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
});
