"use client";
/**
 * The search results' view switch: card images in a grid, or compact rows.
 *
 * Card catalog context, search panel. `SearchResults` shows it in the header row above a listed
 * result; the choice lives in the deck store (`searchViewMode`), which `SearchResults` reads to lay
 * the cards out, so it survives a new search.
 *
 * @module components/search/SearchViewModeToggle
 */
import { useTranslations } from "next-intl";
import { LayoutGrid, List } from "lucide-react";
import { useDeckStore } from "@/lib/deck/store";

/** Switches the search results between card images and compact rows. */
export function SearchViewModeToggle() {
  const t = useTranslations("search");
  const viewMode = useDeckStore((s) => s.searchViewMode);
  const setViewMode = useDeckStore((s) => s.setSearchViewMode);
  return (
    <div className="flex items-center gap-1 ml-auto">
      <button
        type="button"
        onClick={() => setViewMode("grid")}
        className={`p-1 rounded transition-colors ${
          viewMode === "grid"
            ? "text-[var(--accent-text)]"
            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        }`}
        title={t("gridView")}
        aria-label={t("gridView")}
      >
        <LayoutGrid className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={() => setViewMode("list")}
        className={`p-1 rounded transition-colors ${
          viewMode === "list"
            ? "text-[var(--accent-text)]"
            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        }`}
        title={t("listView")}
        aria-label={t("listView")}
      >
        <List className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
