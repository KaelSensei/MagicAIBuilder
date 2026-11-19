/**
 * The saved-deck library use cases' ports over the shared Prisma client:
 * what the `/api/community/deck-folders` routes import.
 *
 * Community context, composition root of `saved-deck-library-use-cases.ts`
 * until COM-18 moves the context to `src/modules/community/` and this becomes
 * part of its `server.ts` (ADR 0002). `server-only`: a client import of it
 * fails the build.
 *
 * @module community/saved-deck-library.server
 */
import "server-only";

import { prisma } from "@/lib/db/prisma";
import {
  prismaLibraryFolderStore,
  prismaSavedDeckLibraryReader,
} from "@/lib/community/prisma-saved-deck-library";
import type { SavedDeckLibraryPorts } from "@/lib/community/saved-deck-library-use-cases";

/** The library use cases' ports over the shared client; one instance per server process. */
export const savedDeckLibraryPorts: SavedDeckLibraryPorts = {
  library: prismaSavedDeckLibraryReader(prisma),
  folders: prismaLibraryFolderStore(prisma),
};
