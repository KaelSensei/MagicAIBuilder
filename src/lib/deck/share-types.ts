// Shared types for the deck sharing feature — used by both the server page
// (app/share/[token]/page.tsx) and the client component (ShareDeckView.tsx).
import type { SharedDeckRecord } from "./shared-deck-select";

/** A card of a shared deck, exactly as the share-link allowlist exposes it. */
export type ApiCard = Readonly<SharedDeckRecord["cards"][number]>;

/** What `GET /api/share/[token]` returns to the holder of an enabled link. */
export type ApiSharedDeck = Readonly<Omit<SharedDeckRecord, "cards">> & {
  readonly cards: readonly ApiCard[];
};
