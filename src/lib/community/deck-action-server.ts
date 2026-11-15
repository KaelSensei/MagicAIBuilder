/**
 * The report and saved-deck use cases wired over the shared Prisma client:
 * what the `/api/community/decks/[id]/reports` and `.../save` routes import.
 *
 * Community context, deck actions. The composition root of
 * `deck-report-use-cases.ts` and `saved-deck-use-cases.ts` until COM-18 moves
 * the context to `src/modules/community/` and this becomes part of its
 * `server.ts` (ADR 0002). `server-only`: a client import of it fails the
 * build.
 *
 * @module community/deck-action-server
 */
import "server-only";

import { prisma } from "@/lib/db/prisma";
import type { ReportUseCasePorts } from "@/lib/community/deck-report-use-cases";
import { prismaDeckFactsReader } from "@/lib/community/prisma-deck-facts-reader";
import { prismaDeckReportStore } from "@/lib/community/prisma-deck-report-store";
import {
  prismaDeckFolderReader,
  prismaSavedDeckStore,
} from "@/lib/community/prisma-saved-deck-store";
import type { SavedDeckUseCasePorts } from "@/lib/community/saved-deck-use-cases";

const decks = prismaDeckFactsReader(prisma);

/** The report use case's ports over the shared client; one instance per server process. */
export const reportUseCasePorts: ReportUseCasePorts = {
  decks,
  reports: prismaDeckReportStore(prisma),
};

/** The saved-deck use cases' ports over the shared client; one instance per server process. */
export const savedDeckUseCasePorts: SavedDeckUseCasePorts = {
  decks,
  folders: prismaDeckFolderReader(prisma),
  savedDecks: prismaSavedDeckStore(prisma),
};
