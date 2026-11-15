/**
 * Reporting a community deck to the moderators.
 *
 * Community context, deck actions. `POST /api/community/decks/[id]/reports`
 * calls `reportDeck` after the session and the body are checked, and maps
 * each outcome to a status; the HTTP concerns stay in the route. The use case
 * depends on the ports in `deck-action-ports.ts` only, so it runs in Vitest
 * with in-memory fakes and no database (ADR 0005). The rule is
 * `canReportDeck` (`deck-action-rules.ts`).
 *
 * @module community/deck-report-use-cases
 */
import type {
  DeckFactsReader,
  DeckReportStore,
} from "@/lib/community/deck-action-ports";
import { canReportDeck } from "@/lib/community/deck-action-rules";
import type {
  ReportReason,
  ReportResponse,
} from "@/lib/community/community-contracts";

/** The adapters `reportDeck` runs on; `deck-action-server.ts` passes the real ones. */
export interface ReportUseCasePorts {
  readonly decks: DeckFactsReader;
  readonly reports: DeckReportStore;
}

/** One report to file: the reason is already parsed by the route. */
export interface ReportDeckCommand {
  readonly deckId: string;
  readonly reporterId: string;
  readonly reason: ReportReason;
}

/**
 * The outcome of {@link reportDeck}:
 * - `filed`: the reporter's report stands as `status` says: `pending` when
 *   it was just filed or its reason replaced, `closed` when a moderator had
 *   already ruled on it and nothing changed;
 * - `not-found`: no deck has this id, or the deck is not public (a private
 *   deck answers as a missing one, for its owner too);
 * - `own-deck`: the reporter owns the deck.
 */
export type ReportDeckResult =
  | { readonly kind: "filed"; readonly status: ReportResponse["status"] }
  | { readonly kind: "not-found" }
  | { readonly kind: "own-deck" };

/**
 * Files the reporter's report, or replaces the reason of one still pending.
 *
 * A reporter keeps one report per deck. Once a moderator reviews or dismisses
 * it, it stays closed: reporting again changes nothing, so a reporter cannot
 * put the deck back in the queue after every dismissal. The store runs each
 * write as a single statement, so a moderator closing the report between the
 * two is never undone (the reason is then left as the moderator saw it, and
 * the answer is `closed`).
 */
export async function reportDeck(
  { deckId, reporterId, reason }: ReportDeckCommand,
  ports: ReportUseCasePorts
): Promise<ReportDeckResult> {
  const deck = await ports.decks.readDeckFacts(deckId);
  if (!deck) return { kind: "not-found" };

  const decision = canReportDeck(deck, reporterId);
  if (!decision.allowed) {
    return { kind: decision.reason === "own-deck" ? "own-deck" : "not-found" };
  }

  const report = { reporterId, deckId, reason };
  if (await ports.reports.fileUnlessReported(report)) {
    return { kind: "filed", status: "pending" };
  }
  const replaced = await ports.reports.replacePendingReason(report);
  return { kind: "filed", status: replaced ? "pending" : "closed" };
}
