"use client";
/**
 * What the search panel says under a partly checked "Collection only" list.
 *
 * Card catalog context, search panel. `SearchResults` renders it from the state that
 * `useCardSearchResults` reports. The reasons nothing was searched (a guest, an empty or unloaded
 * collection) are messages of the result list's own status region (`search-results-view.ts`), so
 * they are announced like every other search state.
 *
 * @module components/search/CollectionOnlyNotice
 */
import { useTranslations } from "next-intl";

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
