"use client";
/**
 * The search results' view switch: card images in a grid, or compact rows.
 *
 * Card catalog context, search panel. `SearchResults` shows it at the end of the header row above
 * a listed result; the choice lives in the deck store (`searchViewMode`), which `SearchResults`
 * reads to lay the cards out, so it survives a new search.
 *
 * It is a `SegmentedControl` (design audit S3, I-04): the two hand-made icon buttons it replaces
 * were 22 px targets, below the 24 px of WCAG 2.2 SC 2.5.8, exposed no pressed state, and marked
 * the chosen layout by its icon colour alone (SC 1.4.1). The control's `sm` size gives each
 * icon-only option a 28 px square; their `title` tooltips go, as at the other icon-only sites.
 *
 * @module components/search/SearchViewModeToggle
 */
import { useTranslations } from "next-intl";
import { LayoutGrid, List } from "lucide-react";
import {
  SegmentedControl,
  type SegmentedOption,
} from "@/components/ui/SegmentedControl";
import { useDeckStore, type DeckStore } from "@/lib/deck/store";

type SearchViewMode = DeckStore["searchViewMode"];

/**
 * Switches the search results between card images and compact rows: a group named "Result view"
 * whose options are named "Grid view" and "List view" for screen readers and show their icons.
 */
export function SearchViewModeToggle() {
  const t = useTranslations("search");
  const viewMode = useDeckStore((s) => s.searchViewMode);
  const setViewMode = useDeckStore((s) => s.setSearchViewMode);

  const options: readonly SegmentedOption<SearchViewMode>[] = [
    {
      value: "grid",
      label: t("gridView"),
      icon: <LayoutGrid className="w-3.5 h-3.5" />,
      hideLabel: true,
    },
    {
      value: "list",
      label: t("listView"),
      icon: <List className="w-3.5 h-3.5" />,
      hideLabel: true,
    },
  ];

  return (
    <SegmentedControl
      aria-label={t("viewMode")}
      options={options}
      value={viewMode}
      onChange={setViewMode}
      size="sm"
      className="ml-auto"
    />
  );
}
