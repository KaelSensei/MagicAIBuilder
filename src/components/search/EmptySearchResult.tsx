"use client";

/**
 * What a card search with no result shows under its status line: the query it
 * ran, the "Collection only" coverage note it is given, and what to try next.
 *
 * Card catalog context, search panel. `SearchResults` renders it outside the
 * status output, which still announces the empty result alone. The next step
 * is new: an empty result used to stop at the query (I-13 AC-13-05, design
 * audit S11).
 *
 * @module components/search/EmptySearchResult
 */

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";

/** Props of {@link EmptySearchResult}. */
export interface EmptySearchResultProps {
  /** The Scryfall query that produced the empty list, shown so the player can edit it. */
  readonly executedQuery?: string;
  /** Clears the search filters; given only while they narrow the search. */
  readonly onClearFilters?: () => void;
  /** The "Collection only" coverage note, between the query and the next step. */
  readonly children?: ReactNode;
}

/**
 * The query, the coverage note, then "Clear filters" while the filters narrow
 * the search, or else one hint at the Scryfall search syntax, with an example.
 */
export function EmptySearchResult({
  executedQuery,
  onClearFilters,
  children,
}: EmptySearchResultProps) {
  const t = useTranslations("search");
  return (
    <>
      {executedQuery ? (
        <p className="mt-2 max-w-full truncate px-4 text-center font-mono text-xs">
          {t("executedQuery", { query: executedQuery })}
        </p>
      ) : null}
      {children}
      {onClearFilters ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="mt-3"
          onClick={onClearFilters}
        >
          {t("clearFilters")}
        </Button>
      ) : (
        <p className="mt-2 px-4 text-center text-xs">{t("syntaxHint")}</p>
      )}
    </>
  );
}
