"use client";

import type {
  NaturalLanguageSearchContext,
  SearchDescriptionLocale,
} from "@/lib/search/natural-language-query";
import {
  useNaturalLanguageSearchAvailability,
  useQueryDraft,
} from "@/hooks/useNaturalLanguageSearch";
import { NaturalLanguageSearchFields } from "./NaturalLanguageSearchFields";

interface NaturalLanguageSearchProps {
  readonly context: NaturalLanguageSearchContext;
  readonly locale: SearchDescriptionLocale;
  readonly onActiveChange: (active: boolean) => void;
  readonly onRunQuery: (query: string) => void;
}

/**
 * Translates a card description into a Scryfall query the player can edit.
 *
 * Search runs only when the player asks, and it runs the edited text verbatim.
 *
 * @param props - deck context and the callback that selects the executed query
 * @returns nothing when AI is unavailable, otherwise the describe controls
 */
export function NaturalLanguageSearch(props: NaturalLanguageSearchProps) {
  const available = useNaturalLanguageSearchAvailability();
  const draft = useQueryDraft(props);
  if (!available) return null;

  return (
    <NaturalLanguageSearchFields
      describing={draft.describing}
      description={draft.description}
      query={draft.draftQuery}
      reviewing={draft.reviewing}
      pending={draft.pending}
      errorCode={draft.errorCode}
      confirmReplace={draft.confirmReplace}
      applyContext={draft.applyContext}
      contextDisabled={!draft.applyContext}
      widens={draft.widens}
      onDescribing={draft.onDescribing}
      onDescription={draft.onDescription}
      onQuery={draft.onQuery}
      onApplyContext={draft.onApplyContext}
      onTranslate={draft.onTranslate}
      onReplace={draft.onReplace}
      onKeepEdit={draft.onKeepEdit}
      onSearch={draft.onSearch}
      onReject={draft.onReject}
    />
  );
}
