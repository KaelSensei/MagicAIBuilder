"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  queryWidensDeckContext,
  readSearchAvailability,
  readSearchQueryResult,
  type NaturalLanguageSearchContext,
  type SearchDescriptionLocale,
  type SearchQueryErrorCode,
  type SearchQueryReadResult,
} from "@/lib/search/natural-language-query";

/**
 * Loads whether natural-language search can call a provider.
 *
 * A failed or signed-out check leaves the feature hidden.
 *
 * @returns true once the server reports a configured provider
 */
export function useNaturalLanguageSearchAvailability(): boolean {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/search/translate", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) return;
        setAvailable(readSearchAvailability(await response.json()));
      })
      .catch(() => {
        setAvailable(false);
      });
    return () => controller.abort();
  }, []);

  return available;
}

/**
 * Asks the server to translate a description. Does not run the search.
 *
 * @param input - description, locale, deck context, and a cancel signal
 * @returns the query and deck context, or a stable error code
 */
async function requestScryfallQuery(input: {
  readonly description: string;
  readonly locale: SearchDescriptionLocale;
  readonly context: NaturalLanguageSearchContext;
  readonly signal: AbortSignal;
}): Promise<SearchQueryReadResult> {
  const response = await fetch("/api/search/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      description: input.description,
      locale: input.locale,
      format: input.context.format,
      colorIdentity: input.context.colorIdentity,
      enforceColorIdentity: input.context.enforceColorIdentity,
      applyContext: input.context.applyContext,
    }),
    signal: input.signal,
  });
  return readSearchQueryResult(await readJson(response));
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

type QueryDraft =
  | { readonly status: "idle" }
  | { readonly status: "loading" }
  | { readonly status: "error"; readonly code: SearchQueryErrorCode }
  | {
      readonly status: "ready";
      readonly generated: string;
      readonly draft: string;
      readonly confirm: boolean;
    };

/** State for one describe session: the draft query, the warning, and the actions. */
export function useQueryDraft(input: {
  readonly context: NaturalLanguageSearchContext;
  readonly locale: SearchDescriptionLocale;
  readonly onActiveChange: (active: boolean) => void;
  readonly onRunQuery: (query: string) => void;
}) {
  const [describing, setDescribing] = useState(false);
  const [applyContext, setApplyContext] = useState(true);
  const [description, setDescription] = useState("");
  const [draft, setDraft] = useState<QueryDraft>({ status: "idle" });
  const abortRef = useRef<AbortController | null>(null);
  const activeContext = useMemo(
    () => ({ ...input.context, applyContext }),
    [applyContext, input.context]
  );

  useEffect(() => () => abortRef.current?.abort(), []);

  const fetchQuery = useCallback(() => {
    beginTranslation({
      abortRef,
      description,
      locale: input.locale,
      context: activeContext,
      setDraft,
    });
  }, [activeContext, description, input.locale]);

  const translate = useCallback(() => {
    if (draft.status === "ready" && draft.draft !== draft.generated) {
      setDraft({ ...draft, confirm: true });
      return;
    }
    fetchQuery();
  }, [draft, fetchQuery]);

  return {
    describing,
    description,
    applyContext,
    draftQuery: draft.status === "ready" ? draft.draft : "",
    reviewing: draft.status === "ready",
    pending: draft.status === "loading",
    errorCode: draft.status === "error" ? draft.code : null,
    confirmReplace: draft.status === "ready" && draft.confirm,
    widens: draft.status === "ready" && queryWidensDeckContext(draft.draft, activeContext),
    onDescribing: (next: boolean) => {
      abortRef.current?.abort();
      setDescribing(next);
      setDraft({ status: "idle" });
      input.onActiveChange(next);
    },
    onDescription: setDescription,
    onApplyContext: setApplyContext,
    onTranslate: translate,
    onReplace: fetchQuery,
    onQuery: (query: string) => {
      if (draft.status !== "ready") return;
      setDraft({ ...draft, draft: query, confirm: false });
    },
    onKeepEdit: () => {
      if (draft.status !== "ready") return;
      setDraft({ ...draft, confirm: false });
    },
    onSearch: () => {
      if (draft.status !== "ready" || draft.draft.trim().length === 0) return;
      input.onRunQuery(draft.draft);
    },
    onReject: () => setDraft({ status: "idle" }),
  };
}

function beginTranslation(input: {
  readonly abortRef: { current: AbortController | null };
  readonly description: string;
  readonly locale: SearchDescriptionLocale;
  readonly context: NaturalLanguageSearchContext;
  readonly setDraft: (draft: QueryDraft) => void;
}): void {
  input.abortRef.current?.abort();
  const controller = new AbortController();
  input.abortRef.current = controller;
  input.setDraft({ status: "loading" });
  void requestScryfallQuery({
    description: input.description,
    locale: input.locale,
    context: input.context,
    signal: controller.signal,
  })
    .then((result) => {
      if (controller.signal.aborted) return;
      input.setDraft(
        result.ok
          ? { status: "ready", generated: result.query, draft: result.query, confirm: false }
          : { status: "error", code: result.code }
      );
    })
    .catch((error: unknown) => {
      if (controller.signal.aborted || isAbortError(error)) return;
      input.setDraft({ status: "error", code: "failed" });
    });
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}
