/**
 * The request body that names a saved-deck library folder, shared by the
 * create (`POST /api/community/deck-folders`) and rename
 * (`PATCH /api/community/deck-folders/[folderId]`) routes.
 *
 * Community context, saved-deck library. Parsed once at the route boundary;
 * the use cases trust the trimmed name they receive. Own-deck folders
 * (`/api/deck-folders`) apply the same length today, but they are another
 * aggregate and keep their own schema.
 *
 * @module community/library-folder-name
 */
import { z } from "zod";

/** Longest folder name, counted after trimming. */
export const LIBRARY_FOLDER_NAME_MAX_LENGTH = 80;

/** `{ name }`, trimmed, 1 to {@link LIBRARY_FOLDER_NAME_MAX_LENGTH} characters. */
export const LibraryFolderNameSchema = z.object({
  name: z.string().trim().min(1).max(LIBRARY_FOLDER_NAME_MAX_LENGTH),
});
