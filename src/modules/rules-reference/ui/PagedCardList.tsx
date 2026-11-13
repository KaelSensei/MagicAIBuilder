"use client";
/**
 * The body of the Game Changers and banlist page under its tabs: the search
 * field, then the loading or error message, or the result count, the card grid
 * and the pager.
 *
 * Rules reference context, `ui/`. Presentational: it draws the state the
 * `usePagedFilteredList` hook holds for the active list and reports the
 * visitor's search, page and zoom requests back to the page.
 *
 * @module rules-reference/ui/PagedCardList
 */
import { useTranslations } from "next-intl";
import { Loader2, Search } from "lucide-react";
import type { PagedFilteredList } from "@/modules/rules-reference/client/usePagedFilteredList";
import type { ReferenceList } from "@/modules/rules-reference/client/useReferenceLists";
import { Pagination } from "@/modules/rules-reference/ui/Pagination";
import { ReferenceCardGrid } from "@/modules/rules-reference/ui/ReferenceCardGrid";
import type { ScryfallCard } from "@/lib/scryfall/types";

export interface PagedCardListProps {
  /** The list on screen; it picks the badge on every tile. */
  readonly list: ReferenceList;
  /** The search, page slice and pager state of that list. */
  readonly paged: PagedFilteredList<ScryfallCard>;
  /** Whether the list is still loading: shows the loading message alone. */
  readonly isLoading: boolean;
  /** Whether the list failed to load: shows the error message alone. */
  readonly isError: boolean;
  /** Called with the card whose tile the visitor clicked. */
  readonly onClickZoom: (card: ScryfallCard) => void;
}

/**
 * The search field and, below it, one of: the loading message, the error
 * message, or the count of matching cards with the grid and the pager.
 */
export function PagedCardList({
  list,
  paged,
  isLoading,
  isError,
  onClickZoom,
}: PagedCardListProps) {
  const t = useTranslations("rules");

  return (
    <>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
        <input
          type="search"
          placeholder={t("searchPlaceholder")}
          value={paged.search}
          onChange={(e) => paged.changeSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
        />
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-[var(--text-secondary)]">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm">{t("loading")}</span>
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {t("error")}
        </div>
      )}

      {!isLoading && !isError && (
        <>
          <p className="text-xs text-[var(--text-secondary)]">
            {t("resultsCount", { count: paged.filtered.length })}
            {paged.search && ` ${t("resultsFor", { query: paged.search })}`}
          </p>
          <ReferenceCardGrid
            list={list}
            cards={paged.pageSlice}
            onClickZoom={onClickZoom}
          />
          <Pagination
            currentPage={paged.currentPage}
            totalPages={paged.totalPages}
            onPageChange={paged.goToPage}
            className="mt-2"
          />
        </>
      )}
    </>
  );
}
