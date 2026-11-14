/**
 * The changelog of the public read API, and the check that keeps it honest.
 *
 * I-95. `GET /api/v1/openapi` already describes the routes. This module is
 * the dated record of what changed, and the pure check a pull request runs:
 * a document whose hash is not on a dated line does not pass. Nothing here
 * fetches, and nothing here embeds a deck.
 *
 * Compatible and breaking are the only labels. A breaking line names the
 * field. A route outside `/api/v1` is not a public-read change.
 *
 * @module api/api-changelog
 */
import { createHash } from "node:crypto";
import { buildOpenApiDocument } from "@/lib/api/openapi";

/** Server URL used only to hash the document. The live route fills its own. */
export const CHANGELOG_DOCUMENT_SERVER = "https://example.test/api/v1";

/** The four routes this changelog is allowed to name. */
export const PUBLIC_READ_ROUTES = [
  "/api/v1/decks",
  "/api/v1/decks/{id}",
  "/api/v1/collection",
  "/api/v1/openapi",
] as const;

/** A change is compatible, or it is breaking and names a field. */
export type ApiChangeLabel = "compatible" | "breaking";

/**
 * One dated change to the public read API.
 *
 * `documentHash` is the SHA-256 of the OpenAPI document built at
 * `CHANGELOG_DOCUMENT_SERVER`. `field` is null unless the label is breaking.
 */
export interface ApiChangelogEntry {
  readonly date: string;
  readonly label: ApiChangeLabel;
  readonly summary: string;
  readonly routes: readonly string[];
  readonly field: string | null;
  readonly documentHash: string;
}

/** Why a changelog does not cover the document in front of it. */
export type ApiChangelogFailure =
  | "missing-dated-line"
  | "breaking-without-field"
  | "route-outside-v1"
  | "undated";

/** The check's answer. A failure names one reason; the first one found wins. */
export type ApiChangelogCheck =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: ApiChangelogFailure };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Dated changes to the public read API, oldest last.
 *
 * The first entry records the document as it stood when this page shipped.
 * A later change adds a line and sets `documentHash` to the new
 * `currentOpenApiDocumentHash()`. The check fails until that happens.
 */
export const API_CHANGELOG: readonly ApiChangelogEntry[] = [
  {
    date: "2026-11-14",
    label: "compatible",
    summary:
      "The public read API is documented: the deck list, one deck, the collection, and the OpenAPI document. No field changed.",
    routes: PUBLIC_READ_ROUTES,
    field: null,
    documentHash: "3b9eb8bbdaf924d52c28c3cbc93fc71cc90a42e789f414d80d31c465e4c47306",
  },
];

/**
 * SHA-256 of the OpenAPI document, with a fixed server URL.
 *
 * The live route puts the caller's origin in `servers`. That must not change
 * the hash, so the check always hashes the document built for
 * `CHANGELOG_DOCUMENT_SERVER`.
 *
 * @returns Hex SHA-256 of the canonical document.
 */
export function currentOpenApiDocumentHash(): string {
  const document = buildOpenApiDocument(CHANGELOG_DOCUMENT_SERVER);
  return createHash("sha256").update(JSON.stringify(document)).digest("hex");
}

/**
 * Whether a route is one of the public read routes.
 *
 * @param route - A path as the changelog writes it, starting with a slash.
 * @returns True only for `/api/v1` and the routes under it that this page lists.
 */
function isPublicReadRoute(route: string): boolean {
  return route === "/api/v1" || route.startsWith("/api/v1/");
}

/**
 * Checks that the changelog has a dated line for this document.
 *
 * A matching line is an entry whose `documentHash` equals `documentHash`,
 * whose date is `YYYY-MM-DD`, whose routes all sit under `/api/v1`, and
 * which names a field when the label is breaking. A compatible line needs
 * no field. No entry at all is the same failure as a stale hash: the
 * document changed without a dated line.
 *
 * @param input.documentHash - Hash from `currentOpenApiDocumentHash`, or a
 *   fixture hash in a test.
 * @param input.entries - The changelog, newest or oldest. Order is not significant.
 * @returns Ok, or the first reason the entries do not cover the document.
 */
export function checkApiChangelog(input: {
  readonly documentHash: string;
  readonly entries: readonly ApiChangelogEntry[];
}): ApiChangelogCheck {
  const match = input.entries.find((entry) => entry.documentHash === input.documentHash);
  if (match === undefined) return { ok: false, reason: "missing-dated-line" };
  if (!DATE_RE.test(match.date)) return { ok: false, reason: "undated" };
  if (match.routes.some((route) => !isPublicReadRoute(route))) {
    return { ok: false, reason: "route-outside-v1" };
  }
  if (match.label === "breaking" && (match.field === null || match.field.trim() === "")) {
    return { ok: false, reason: "breaking-without-field" };
  }
  return { ok: true };
}
