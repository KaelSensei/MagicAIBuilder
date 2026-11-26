"use client";

/**
 * What a card search with no result shows under its status line: the query it
 * ran, the "Collection only" coverage note it is given, and what to try next.
 *
 * Card catalog context, search panel. `SearchResults` renders it outside the
 * status output, which still announces the empty result alone. The next step
 * is new: an empty result used to stop at the query (I-13 AC-13-05, design
 * audit S11). This view renders the step it is given and decides nothing: a
 * hint at the syntax is wrong where no text box takes it, and "Clear filters"
 * is wrong where the query reads no filter, and only the page knows which.
 *
 * @module components/search/EmptySearchResult
 */

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";

/**
 * What an empty result offers next. The page that runs the search decides it: only that page
 * knows which filters its query reads, and whether the player types Scryfall syntax there.
 */
export type EmptySearchNextStep =
  /** The filters narrow the query, so clearing them widens it. */
  | { readonly kind: "clearFilters"; readonly onClearFilters: () => void }
  /** The player types the query, so one hint at the Scryfall syntax helps. */
  | { readonly kind: "syntaxHint" }
  /** Neither: no filter narrows the query, and no text box takes the syntax. */
  | { readonly kind: "none" };

/** Props of {@link EmptySearchResult}. */
export interface EmptySearchResultProps {
  /** The Scryfall query that produced the empty list, shown so the player can edit it. */
  readonly executedQuery?: string;
  /** What to offer under the result, as the page that runs the search decided it. */
  readonly nextStep: EmptySearchNextStep;
  /** The "Collection only" coverage note, between the query and the next step. */
  readonly children?: ReactNode;
}

/** "Clear filters", one hint at the Scryfall search syntax with an example, or nothing. */
function NextStep({ step }: { readonly step: EmptySearchNextStep }) {
  const t = useTranslations("search");
  switch (step.kind) {
    case "clearFilters":
      return (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="mt-3"
          onClick={step.onClearFilters}
        >
          {t("clearFilters")}
        </Button>
      );
    case "syntaxHint":
      return <p className="mt-2 px-4 text-center text-xs">{t("syntaxHint")}</p>;
    case "none":
      return null;
    default: {
      const unhandled: never = step;
      return unhandled;
    }
  }
}

/** The query, the coverage note, then the next step it is given. */
export function EmptySearchResult({
  executedQuery,
  nextStep,
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
      <NextStep step={nextStep} />
    </>
  );
}
