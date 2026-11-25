/**
 * The JSON answers of the card-package preview and apply routes, as the
 * browser reads them: through guards instead of a trusted cast.
 *
 * Community context, browser-safe. The routes build these answers from
 * `previewCardPackage` (`./card-package-preview`); this module only checks
 * their shape. An issue kind the page does not know yet (a newer server) is
 * kept as `"unknown"`, so the page still says the card is blocked.
 *
 * @module community/card-package-answers
 */
import { isRecord } from "@/lib/guards";
import type { PackagePreviewIssueKind } from "./card-package-preview";

/** Why the preview blocks a card, or `"unknown"` for a kind this page does not know. */
export type PreviewIssueKind = PackagePreviewIssueKind | "unknown";

/** One card of a package preview, as the page shows it. */
export interface PreviewCardAnswer {
  readonly scryfallId: string;
  readonly name: string;
  readonly quantity: number;
  readonly status: "ready" | "blocked";
  /** The distinct kinds only: the route's English `message` is never shown. */
  readonly issueKinds: readonly PreviewIssueKind[];
}

/** What an apply did: cards added to the main deck, and accepted cards the deck now refuses. */
export interface ApplyAnswer {
  readonly addedCount: number;
  readonly blockedCount: number;
}

/** Every kind the preview emits; the `Record` makes the list exhaustive. */
const KNOWN_ISSUE_KINDS: Readonly<Record<PackagePreviewIssueKind, true>> = {
  banned: true,
  colorIdentity: true,
  singleton: true,
  copyLimit: true,
};

function isKnownIssueKind(kind: string): kind is PackagePreviewIssueKind {
  return Object.hasOwn(KNOWN_ISSUE_KINDS, kind);
}

function isCount(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function parseIssueKind(issue: unknown): PreviewIssueKind {
  if (!isRecord(issue) || typeof issue.kind !== "string") return "unknown";
  return isKnownIssueKind(issue.kind) ? issue.kind : "unknown";
}

function parseStatus(value: unknown): PreviewCardAnswer["status"] | null {
  if (value === "ready" || value === "blocked") return value;
  return null;
}

function parsePreviewCard(value: unknown): PreviewCardAnswer | null {
  if (!isRecord(value)) return null;
  const { scryfallId, name, quantity, issues } = value;
  const status = parseStatus(value.status);
  if (typeof scryfallId !== "string" || typeof name !== "string") return null;
  if (!isCount(quantity) || status === null || !Array.isArray(issues))
    return null;
  // One line per reason: two unknown kinds read as one "Cannot be added".
  const issueKinds = [...new Set(issues.map(parseIssueKind))];
  return { scryfallId, name, quantity, status, issueKinds };
}

/**
 * Read the preview route's answer.
 *
 * @param value - `response.json()` of `POST …/card-packages/[id]/preview`, untrusted
 * @returns the previewed cards in package order, or `null` when any card is malformed
 */
export function parsePreviewAnswer(
  value: unknown
): readonly PreviewCardAnswer[] | null {
  if (!isRecord(value) || !Array.isArray(value.cards)) return null;
  const cards: PreviewCardAnswer[] = [];
  for (const raw of value.cards) {
    const card = parsePreviewCard(raw);
    if (card === null) return null;
    cards.push(card);
  }
  return cards;
}

/**
 * Read the apply route's answer.
 *
 * @param value - `response.json()` of `POST …/card-packages/[id]/apply`, untrusted
 * @returns both counts, or `null` when either is missing or not a whole count
 */
export function parseApplyAnswer(value: unknown): ApplyAnswer | null {
  if (!isRecord(value)) return null;
  const { addedCount, blockedCount } = value;
  if (!isCount(addedCount) || !isCount(blockedCount)) return null;
  return { addedCount, blockedCount };
}
