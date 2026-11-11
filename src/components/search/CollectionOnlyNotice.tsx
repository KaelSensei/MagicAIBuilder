"use client";
/**
 * What the search panel says in place of, or above, a "Collection only" list.
 *
 * Card catalog context, search panel. `SearchResults` renders these from the state that
 * `useCardSearchResults` reports, so a guest, an empty or unloaded collection and a partly
 * checked search each read as what they are rather than as "no results".
 *
 * @module components/search/CollectionOnlyNotice
 */
import { useTranslations } from "next-intl";
import { Package } from "lucide-react";
import type { CollectionOnlyState } from "@/hooks/useCardSearchResults";

/** The states in which the filter had nothing to filter by, so nothing was searched. */
export type CollectionOnlyBlocked = Exclude<
  CollectionOnlyState,
  { readonly kind: "scanned" }
>;

function blockedMessageKey(state: CollectionOnlyBlocked): string {
  switch (state.kind) {
    case "signedOut":
      return "collectionOnly.signedOut";
    case "emptyCollection":
      return "collectionOnly.emptyCollection";
    case "collectionUnavailable":
      return "collectionOnly.collectionUnavailable";
    default: {
      const unhandled: never = state;
      return unhandled;
    }
  }
}

/** Replaces the result list when the filter has no collection to filter by. */
export function CollectionOnlyBlockedState({
  state,
}: {
  readonly state: CollectionOnlyBlocked;
}) {
  const t = useTranslations("search");
  return (
    <div className="flex h-40 flex-col items-center justify-center gap-2 px-6 text-center text-sm text-[var(--text-secondary)]">
      <Package className="h-5 w-5" aria-hidden="true" />
      <output aria-live="polite" aria-atomic="true" className="block">
        {t(blockedMessageKey(state))}
      </output>
    </div>
  );
}
CollectionOnlyBlockedState.displayName = "CollectionOnlyBlockedState";

/**
 * Says how much of the search the filter checked. Renders nothing when every match was checked.
 */
export function CollectionOnlyCoverageNote({
  scannedCards,
  totalMatches,
  complete,
}: {
  readonly scannedCards: number;
  readonly totalMatches: number;
  readonly complete: boolean;
}) {
  const t = useTranslations("search");
  if (complete) return null;
  return (
    <p className="px-3 pb-1.5 text-xs text-[var(--text-secondary)]">
      {t("collectionOnly.partialScan", {
        scanned: scannedCards,
        total: totalMatches,
      })}
    </p>
  );
}
CollectionOnlyCoverageNote.displayName = "CollectionOnlyCoverageNote";
