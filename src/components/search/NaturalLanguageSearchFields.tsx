"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { fieldShellClassName, textAreaShellClassName } from "@/components/ui/Input";
import { cn } from "@/components/ui/utils";
import {
  MIN_CARD_DESCRIPTION_LENGTH,
  type SearchQueryErrorCode,
} from "@/lib/search/natural-language-query";

interface NaturalLanguageSearchFieldsProps {
  readonly describing: boolean;
  readonly description: string;
  readonly query: string;
  readonly reviewing: boolean;
  readonly pending: boolean;
  readonly errorCode: SearchQueryErrorCode | null;
  readonly confirmReplace: boolean;
  readonly applyContext: boolean;
  readonly contextDisabled: boolean;
  readonly widens: boolean;
  readonly onDescribing: (describing: boolean) => void;
  readonly onDescription: (value: string) => void;
  readonly onQuery: (value: string) => void;
  readonly onApplyContext: (apply: boolean) => void;
  readonly onTranslate: () => void;
  readonly onReplace: () => void;
  readonly onKeepEdit: () => void;
  readonly onSearch: () => void;
  readonly onReject: () => void;
}

/**
 * Syntax and describe controls for natural-language card search.
 *
 * @param props - field values and the actions the parent runs
 * @returns the mode switch and, in describe mode, the query review
 */
export function NaturalLanguageSearchFields(props: NaturalLanguageSearchFieldsProps) {
  const t = useTranslations("search");
  const descriptionId = useId();
  const queryId = useId();
  const helpId = useId();
  const contextId = useId();
  const canTranslate =
    props.description.trim().length >= MIN_CARD_DESCRIPTION_LENGTH && !props.pending;

  return (
    <div className="space-y-2">
      <fieldset
        aria-label={t("naturalLanguage.modeLabel")}
        className="m-0 flex min-w-0 gap-1 rounded-[var(--lumen-radius-pill)] border-0 bg-[var(--background)] p-1"
      >
        <ModeButton pressed={!props.describing} label={t("naturalLanguage.syntaxMode")} name={t("naturalLanguage.syntaxModeLabel")} onClick={() => props.onDescribing(false)} />
        <ModeButton pressed={props.describing} label={t("naturalLanguage.describeMode")} name={t("naturalLanguage.describeModeLabel")} onClick={() => props.onDescribing(true)} />
      </fieldset>
      {props.describing && (
        <>
          <form className="space-y-2" onSubmit={(event) => { event.preventDefault(); if (canTranslate) props.onTranslate(); }}>
            <label htmlFor={descriptionId} className="block text-xs text-[var(--text-secondary)]">{t("naturalLanguage.descriptionLabel")}</label>
            <textarea id={descriptionId} rows={2} value={props.description} disabled={props.pending} placeholder={t("naturalLanguage.descriptionPlaceholder")} className={textAreaShellClassName} onChange={(event) => props.onDescription(event.target.value)} />
            <label htmlFor={contextId} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <input id={contextId} type="checkbox" checked={props.applyContext} onChange={(event) => props.onApplyContext(event.target.checked)} />
              {t("naturalLanguage.keepContext")}
            </label>
            <Button type="submit" variant="secondary" className="min-h-10" disabled={!canTranslate}>
              {props.pending ? t("naturalLanguage.translating") : t("naturalLanguage.translate")}
            </Button>
          </form>
          {props.contextDisabled && <output className="block text-xs text-[var(--text-secondary)]">{t("naturalLanguage.contextOff")}</output>}
          {props.reviewing && (
            <div className="space-y-2">
              <label htmlFor={queryId} className="block text-xs text-[var(--text-secondary)]">{t("naturalLanguage.queryLabel")}</label>
              <input id={queryId} value={props.query} aria-describedby={helpId} className={cn(fieldShellClassName, "w-full px-3 py-2.5 font-mono")} onChange={(event) => props.onQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && props.query.trim().length > 0) { event.preventDefault(); props.onSearch(); } }} />
              <p id={helpId} className="text-xs text-[var(--text-secondary)]">{t("naturalLanguage.queryHelp")}</p>
              {props.widens && <output className="block text-xs text-[var(--text-secondary)]">{t("naturalLanguage.widened")}</output>}
              <div className="flex flex-wrap gap-2">
                <Button type="button" className="min-h-10" onClick={props.onSearch} disabled={props.query.trim().length === 0}>{t("naturalLanguage.search")}</Button>
                <Button type="button" variant="secondary" className="min-h-10" onClick={props.onReject}>{t("naturalLanguage.reject")}</Button>
                <Button type="button" variant="ghost" className="min-h-10" onClick={() => props.onDescribing(false)}>{t("naturalLanguage.backToSyntax")}</Button>
              </div>
            </div>
          )}
          {props.confirmReplace && (
            <div className="space-y-2">
              <output className="block text-xs text-[var(--text-secondary)]">{t("naturalLanguage.replaceConfirm")}</output>
              <div className="flex flex-wrap gap-2">
                <Button type="button" className="min-h-10" onClick={props.onReplace}>{t("naturalLanguage.replaceEdit")}</Button>
                <Button type="button" variant="secondary" className="min-h-10" onClick={props.onKeepEdit}>{t("naturalLanguage.keepEdit")}</Button>
              </div>
            </div>
          )}
          <SearchStatus pending={props.pending} errorCode={props.errorCode} />
        </>
      )}
    </div>
  );
}

function ModeButton({ pressed, label, name, onClick }: { readonly pressed: boolean; readonly label: string; readonly name: string; readonly onClick: () => void }) {
  return (
    <button type="button" aria-pressed={pressed} aria-label={name} onClick={onClick} className={cn("min-h-10 flex-1 rounded-[var(--lumen-radius-pill)] px-2 text-xs font-medium", pressed ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-[var(--lumen-shadow-sm)]" : "text-[var(--text-secondary)]")}>
      {label}
    </button>
  );
}

function SearchStatus({ pending, errorCode }: { readonly pending: boolean; readonly errorCode: SearchQueryErrorCode | null }) {
  const t = useTranslations("search");
  if (pending) return <output className="block text-xs text-[var(--text-secondary)]">{t("naturalLanguage.translating")}</output>;
  if (!errorCode) return null;
  return <p role="alert" className="text-xs text-[var(--text-secondary)]">{errorText(errorCode, t)}</p>;
}

function errorText(code: SearchQueryErrorCode, t: ReturnType<typeof useTranslations>): string {
  switch (code) {
    case "unavailable": return t("naturalLanguage.unavailable");
    case "rate_limited": return t("naturalLanguage.rateLimited");
    case "allowance_exhausted": return t("naturalLanguage.allowanceExhausted");
    case "ai_spend_ceiling_reached": return t("naturalLanguage.spendCeiling");
    case "invalid_description": return t("naturalLanguage.invalidDescription");
    case "invalid_query": return t("naturalLanguage.invalidQuery");
    case "failed": return t("naturalLanguage.failed");
  }
  const exhaustive: never = code;
  return exhaustive;
}
