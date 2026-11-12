"use client";

import { SearchBar } from "@/components/search/SearchBar";
import { NaturalLanguageSearch } from "@/components/search/NaturalLanguageSearch";
import { NaturalLanguageSearchBoundary } from "@/components/search/NaturalLanguageSearchBoundary";
import type { NaturalLanguageSearchContext, SearchDescriptionLocale } from "@/lib/search/natural-language-query";

interface BuilderDescribedSearchProps {
  readonly describeActive: boolean;
  readonly allowed: boolean;
  readonly searchLoading: boolean;
  readonly context: NaturalLanguageSearchContext;
  readonly locale: SearchDescriptionLocale;
  readonly onSearch: (text: string) => void;
  readonly onFocus: () => void;
  readonly onBlur: () => void;
  readonly onActiveChange: (active: boolean) => void;
  readonly onRunQuery: (query: string) => void;
}

/**
 * Syntax field and the describe control for the builder name search.
 *
 * The describe control is hidden when the player is choosing a commander,
 * partner, or companion, because those searches are syntax-only.
 *
 * @param props - which search is active and how a confirmed query is run
 * @returns the syntax field, the describe control, or both
 */
export function BuilderDescribedSearch(props: BuilderDescribedSearchProps) {
  return (
    <>
      {props.describeActive ? null : (
        <SearchBar
          onSearch={props.onSearch}
          isLoading={props.searchLoading}
          showKeyboardHint={true}
          onFocus={props.onFocus}
          onBlur={props.onBlur}
        />
      )}
      {props.allowed ? (
        <NaturalLanguageSearchBoundary>
          <NaturalLanguageSearch
            context={props.context}
            locale={props.locale}
            onActiveChange={props.onActiveChange}
            onRunQuery={props.onRunQuery}
          />
        </NaturalLanguageSearchBoundary>
      ) : null}
    </>
  );
}
