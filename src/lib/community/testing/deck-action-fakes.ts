/**
 * In-memory fakes of the deck action ports, for the report and saved-deck
 * use-case tests (ADR 0005: owned ports get a hand-written fake).
 *
 * Community context, deck actions. Each fake keeps the guarantees its port
 * states in `deck-action-ports.ts`: one report or bookmark per user and deck,
 * a closed report left closed, idempotent removal. A test seeds the decks,
 * folders and rows it needs and reads the maps back for its assertions.
 *
 * @module community/testing/deck-action-fakes
 */
import type {
  DeckFactsReader,
  DeckFolderReader,
  DeckReportStore,
  ReporterOnDeck,
  SavedDeckDraft,
  SavedDeckStore,
  SaverOnDeck,
} from "@/lib/community/deck-action-ports";
import type { DeckVisibilityFacts } from "@/lib/community/deck-visibility-policy";

/** A reader over the given decks, keyed by id; any other id reads as null. */
export function inMemoryDeckFactsReader(
  decks: Readonly<Record<string, DeckVisibilityFacts>>
): DeckFactsReader {
  return {
    readDeckFacts: (deckId) => Promise.resolve(decks[deckId] ?? null),
  };
}

/** Where a stored report stands; `pending` is the only state a reporter can change. */
export type FakeReportStatus = "pending" | "reviewed" | "dismissed";

/** A stored report as the fake keeps it. */
export interface FakeReportRow extends ReporterOnDeck {
  readonly reason: string;
  readonly status: FakeReportStatus;
}

/** The one string a report is keyed on: its reporter and its deck. */
export function reporterKey({ reporterId, deckId }: ReporterOnDeck): string {
  return `${deckId}:${reporterId}`;
}

/** The report fake, with its rows exposed for seeding and assertions. */
export interface InMemoryDeckReportStore extends DeckReportStore {
  readonly rows: Map<string, FakeReportRow>;
}

/** @returns a new report store holding `seed`, independent of every other */
export function inMemoryDeckReportStore(
  seed: readonly FakeReportRow[] = []
): InMemoryDeckReportStore {
  const rows = new Map(seed.map((row) => [reporterKey(row), row]));
  return {
    rows,
    fileUnlessReported: (report) => {
      if (rows.has(reporterKey(report))) return Promise.resolve(false);
      rows.set(reporterKey(report), { ...report, status: "pending" });
      return Promise.resolve(true);
    },
    replacePendingReason: (report) => {
      const stored = rows.get(reporterKey(report));
      if (stored?.status !== "pending") return Promise.resolve(false);
      rows.set(reporterKey(report), { ...stored, reason: report.reason });
      return Promise.resolve(true);
    },
  };
}

/** The one string a bookmark is keyed on: its user and its deck. */
export function saverKey({ userId, deckId }: SaverOnDeck): string {
  return `${deckId}:${userId}`;
}

/** The bookmark fake, with its rows exposed for seeding and assertions. */
export interface InMemorySavedDeckStore extends SavedDeckStore {
  readonly rows: Map<string, SavedDeckDraft>;
}

/** @returns a new bookmark store holding `seed`, independent of every other */
export function inMemorySavedDeckStore(
  seed: readonly SavedDeckDraft[] = []
): InMemorySavedDeckStore {
  const rows = new Map(seed.map((row) => [saverKey(row), row]));
  return {
    rows,
    save: (draft) => {
      rows.set(saverKey(draft), draft);
      return Promise.resolve();
    },
    remove: (saver) => {
      rows.delete(saverKey(saver));
      return Promise.resolve();
    },
  };
}

/** A folder as the fake knows it: its id and its owner. */
export interface FakeFolder {
  readonly id: string;
  readonly userId: string;
}

/** A reader over the given folders; a folder is owned by its `userId` only. */
export function inMemoryDeckFolderReader(
  folders: readonly FakeFolder[]
): DeckFolderReader {
  return {
    isOwnedBy: (folderId, userId) =>
      Promise.resolve(
        folders.some(
          (folder) => folder.id === folderId && folder.userId === userId
        )
      ),
  };
}
