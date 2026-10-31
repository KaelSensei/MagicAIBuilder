// Client-side API helpers for deck snapshots

export interface SnapshotMeta {
  id: string;
  name: string;
  commander: string | null;
  cardCount: number;
  createdAt: string;
}

export interface SnapshotFull extends SnapshotMeta {
  cardList: unknown[];
}

/** Longest wait for the snapshot list, matching the other deck loading deadlines. */
export const SNAPSHOT_LIST_TIMEOUT_MS = 15_000;

/**
 * Load a deck's snapshot list, aborting after {@link SNAPSHOT_LIST_TIMEOUT_MS}
 * (including body reading) so the history panel can show its error state.
 * @param deckId - Deck whose snapshots are listed.
 * @returns Snapshot metadata, newest first as returned by the API.
 */
export async function listSnapshots(deckId: string): Promise<SnapshotMeta[]> {
  const res = await fetch(`/api/decks/${encodeURIComponent(deckId)}/snapshots`, {
    signal: AbortSignal.timeout(SNAPSHOT_LIST_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error("Failed to fetch snapshots");
  return res.json();
}

export async function createSnapshot(deckId: string, name: string): Promise<SnapshotFull> {
  const res = await fetch(`/api/decks/${deckId}/snapshots`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "Failed to create snapshot");
  }
  return res.json();
}

export async function deleteSnapshot(deckId: string, snapshotId: string): Promise<void> {
  const res = await fetch(`/api/decks/${deckId}/snapshots/${snapshotId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete snapshot");
}

export async function restoreSnapshot(deckId: string, snapshotId: string): Promise<unknown> {
  const res = await fetch(`/api/decks/${deckId}/snapshots/${snapshotId}/restore`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to restore snapshot");
  return res.json();
}
