/**
 * What reporting a deck and saving one as a bookmark need from the outside:
 * the deck's facts, the stored reports, the stored bookmarks and the caller's
 * folders.
 *
 * Community context, deck actions. The use cases in
 * `deck-report-use-cases.ts` and `saved-deck-use-cases.ts` depend on these
 * ports only. `prisma-deck-facts-reader.ts`, `prisma-deck-report-store.ts`
 * and `prisma-saved-deck-store.ts` implement them over Prisma;
 * `deck-action-server.ts` wires them. Tests hand the use cases the in-memory
 * fakes of `testing/deck-action-fakes.ts` instead (ADR 0005).
 *
 * @module community/deck-action-ports
 */
import type { ReportReason } from "@/lib/community/community-contracts";
import type { DeckVisibilityFacts } from "@/lib/community/deck-visibility-policy";

/**
 * The facts the deck action rules read about one stored deck.
 *
 * Answers the whole {@link DeckVisibilityFacts} so the same reader can serve
 * `canViewDeck`; COM-12 declares an equivalent `DeckVisibilityReader` for
 * votes and ratings, and the two merge once both have landed.
 */
export interface DeckFactsReader {
  /** @returns the deck's facts, or null when no deck has this id */
  readDeckFacts(deckId: string): Promise<DeckVisibilityFacts | null>;
}

/** One user's report of one deck, the pair that identifies a stored row. */
export interface ReporterOnDeck {
  readonly reporterId: string;
  readonly deckId: string;
}

/** What `reportDeck` stores: who reports which deck, and why. */
export interface ReportDraft extends ReporterOnDeck {
  readonly reason: ReportReason;
}

/**
 * The stored moderation reports, one row per reporter and deck
 * (`@@unique([userId, deckId])`).
 *
 * Each method is one atomic statement, so a moderator closing the report
 * between two calls is never undone. An implementation guarantees:
 * - `fileUnlessReported` inserts a pending report and answers true, or leaves
 *   the reporter's existing report of this deck untouched and answers false;
 * - `replacePendingReason` changes the reason of the reporter's report while
 *   it is still pending and answers true; a closed report (reviewed or
 *   dismissed) is left as the moderator closed it, and the answer is false.
 * Any method rejects with the store's own error when the store fails; the
 * route turns that into a 500.
 */
export interface DeckReportStore {
  fileUnlessReported(report: ReportDraft): Promise<boolean>;
  replacePendingReason(report: ReportDraft): Promise<boolean>;
}

/** One user's bookmark of one deck, the pair that identifies a stored row. */
export interface SaverOnDeck {
  readonly userId: string;
  readonly deckId: string;
}

/** What `savePublicDeck` stores: the bookmark and the folder it sits in, if any. */
export interface SavedDeckDraft extends SaverOnDeck {
  readonly folderId: string | null;
}

/**
 * The stored bookmarks, one row per user and deck (`@@unique([userId, deckId])`).
 *
 * An implementation guarantees:
 * - `save` stores the bookmark, moving the user's earlier bookmark of the
 *   deck to the given folder if one exists: saving twice never stacks a
 *   second row;
 * - `remove` is idempotent: removing a bookmark that does not exist is not
 *   an error.
 * Any method rejects with the store's own error when the store fails; the
 * route turns that into a 500.
 */
export interface SavedDeckStore {
  save(draft: SavedDeckDraft): Promise<void>;
  remove(saver: SaverOnDeck): Promise<void>;
}

/** The caller's personal folders, as far as saving a deck needs to know them. */
export interface DeckFolderReader {
  /** @returns true when `userId` owns a folder with this id */
  isOwnedBy(folderId: string, userId: string): Promise<boolean>;
}
