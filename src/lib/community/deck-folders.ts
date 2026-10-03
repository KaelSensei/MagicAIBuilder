export interface SavedDeckSummary {
  readonly createdAt: string;
  readonly deck: {
    readonly id: string;
    readonly name: string;
    readonly commanderName: string | null;
    readonly user: {
      readonly username: string | null;
      readonly name: string | null;
    };
  };
}

export interface SavedDeckFolder {
  readonly id: string;
  readonly name: string;
  readonly savedDecks: readonly SavedDeckSummary[];
}

export interface SavedDeckFoldersResponse {
  readonly folders: readonly SavedDeckFolder[];
  readonly unfiled: readonly SavedDeckSummary[];
}

function isSavedDeck(value: unknown): value is SavedDeckSummary {
  return (
    typeof value === "object" &&
    value !== null &&
    "createdAt" in value &&
    typeof value.createdAt === "string" &&
    "deck" in value &&
    typeof value.deck === "object" &&
    value.deck !== null &&
    "id" in value.deck &&
    typeof value.deck.id === "string" &&
    "name" in value.deck &&
    typeof value.deck.name === "string" &&
    "user" in value.deck
  );
}

function isFolder(value: unknown): value is SavedDeckFolder {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "name" in value &&
    typeof value.name === "string" &&
    "savedDecks" in value &&
    Array.isArray(value.savedDecks) &&
    value.savedDecks.every(isSavedDeck)
  );
}

/** Parses the private folder API without trusting arbitrary response data. */
export function readSavedDeckFolders(value: unknown): SavedDeckFoldersResponse {
  if (typeof value !== "object" || value === null)
    return { folders: [], unfiled: [] };
  const folders =
    "folders" in value && Array.isArray(value.folders)
      ? value.folders.filter(isFolder)
      : [];
  const unfiled =
    "unfiled" in value && Array.isArray(value.unfiled)
      ? value.unfiled.filter(isSavedDeck)
      : [];
  return { folders, unfiled };
}
