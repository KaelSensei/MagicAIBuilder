/**
 * Which deck snapshot a recorded playtest is filed under.
 *
 * Deck-building context, application layer (master plan DB-01, server audit
 * S3.5). A recorded run is filed under a snapshot so the before/after
 * comparison can group runs by deck version. The server picks it from the
 * deck as saved when the run is recorded, never from a card list the client
 * sends. Caller: `POST /api/decks/[id]/playtest-sessions`, inside its
 * recording transaction, through `prismaDeckVersionStore(tx)`, so a snapshot
 * created for a run is never left behind without the run.
 *
 * @module deck/snapshot-of-saved-deck
 */
import {
  findSnapshotOfVersion,
  snapshotContent,
} from "@/lib/deck/deck-version";
import type { DeckVersionStore } from "@/lib/deck/snapshot-store-port";

/**
 * How many recent snapshots a recorded run is matched against. Each one is a
 * full card list, so the read stays bounded however long the deck's history
 * grows; a version older than this window gets a fresh snapshot.
 */
export const VERSION_MATCH_WINDOW = 20;

/** The deck a run was played with: its id and its commander id. */
export interface PlayedDeck {
  readonly id: string;
  readonly commanderId: string | null;
}

/**
 * Names a snapshot created to hold a recorded run's deck version.
 *
 * The name is stored, not translated, so it uses the app's untranslated
 * "Playtest" label and a UTC timestamp that reads the same in every locale.
 *
 * @param recordedAt - When the run was recorded.
 * @returns e.g. "Playtest · 2026-11-09 14:32 UTC".
 */
export function playtestSnapshotName(recordedAt: Date): string {
  const iso = recordedAt.toISOString();
  return `Playtest · ${iso.slice(0, 10)} ${iso.slice(11, 16)} UTC`;
}

/**
 * Finds the snapshot holding the deck as saved now, or creates one.
 *
 * Repeated runs on an unchanged deck therefore share one snapshot instead of
 * adding a new one to the deck's history each time, and a run on a reverted
 * deck lands under the earlier version's snapshot, hand-saved or not.
 *
 * @param store - The version store, bound to the recording transaction.
 * @param deck - The owned deck the run was played with.
 * @param recordedAt - When the run is being recorded, for a new snapshot's name.
 * @returns The id of the snapshot to file the run under.
 */
export async function snapshotOfSavedDeck(
  store: DeckVersionStore,
  deck: PlayedDeck,
  recordedAt: Date
): Promise<string> {
  const cards = await store.listCards(deck.id);
  const recent = await store.listRecentSnapshots(deck.id, VERSION_MATCH_WINDOW);
  const existing = findSnapshotOfVersion(deck.id, cards, recent);
  if (existing) return existing;

  return store.createSnapshot({
    deckId: deck.id,
    name: playtestSnapshotName(recordedAt),
    ...snapshotContent({ commanderId: deck.commanderId, cards }),
  });
}
