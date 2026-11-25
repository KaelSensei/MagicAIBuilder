/**
 * Client-side API helpers for deck snapshots, the History panel's saved
 * versions of a deck. A refused or failed request rejects with a
 * {@link DeckApiError}, as the deck client does, so the panel can tell an
 * ended session (401) from any other failure without reading the message.
 *
 * @module db/snapshot-api
 */
import { DeckApiError } from "@/lib/db/deck-api-answer";

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
 * The route's own `error` text, or an empty string when the body is not JSON
 * or carries none. Only that field is read, never the whole body.
 */
async function routeErrorText(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "string"
    ) {
      return body.error;
    }
  } catch {
    // Not JSON (a proxy error page, say): the status is all there is.
  }
  return "";
}

/**
 * Rejects with the answer's status and the route's `error` text, or
 * `fallback` when the route sent none. The text is diagnostic: it is logged,
 * never shown to the player (I-01).
 */
async function rejectRefusal(
  response: Response,
  operation: string,
  fallback: string
): Promise<never> {
  const detail = (await routeErrorText(response)) || fallback;
  throw new DeckApiError(operation, response.status, detail);
}

/**
 * Load a deck's snapshot list, aborting after {@link SNAPSHOT_LIST_TIMEOUT_MS}
 * (including body reading) so the history panel can show its error state.
 * @param deckId - Deck whose snapshots are listed.
 * @returns Snapshot metadata, newest first as returned by the API.
 * @throws {DeckApiError} when the route refuses or fails.
 */
export async function listSnapshots(deckId: string): Promise<SnapshotMeta[]> {
  const res = await fetch(`/api/decks/${encodeURIComponent(deckId)}/snapshots`, {
    signal: AbortSignal.timeout(SNAPSHOT_LIST_TIMEOUT_MS),
  });
  if (!res.ok) {
    return rejectRefusal(res, "listSnapshots", "Failed to fetch snapshots");
  }
  return res.json();
}

/**
 * Save the deck as it is now under `name`.
 * @throws {DeckApiError} when the route refuses or fails, with its `error` text.
 */
export async function createSnapshot(deckId: string, name: string): Promise<SnapshotFull> {
  const res = await fetch(`/api/decks/${deckId}/snapshots`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    return rejectRefusal(res, "createSnapshot", "Failed to create snapshot");
  }
  return res.json();
}

/**
 * Delete one snapshot of the deck.
 * @throws {DeckApiError} when the route refuses or fails.
 */
export async function deleteSnapshot(deckId: string, snapshotId: string): Promise<void> {
  const res = await fetch(`/api/decks/${deckId}/snapshots/${snapshotId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    return rejectRefusal(res, "deleteSnapshot", "Failed to delete snapshot");
  }
}

/**
 * Put the deck back as the snapshot holds it.
 * @throws {DeckApiError} when the route refuses or fails.
 */
export async function restoreSnapshot(deckId: string, snapshotId: string): Promise<unknown> {
  const res = await fetch(`/api/decks/${deckId}/snapshots/${snapshotId}/restore`, {
    method: "POST",
  });
  if (!res.ok) {
    return rejectRefusal(res, "restoreSnapshot", "Failed to restore snapshot");
  }
  return res.json();
}
