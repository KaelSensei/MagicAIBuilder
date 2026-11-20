"use client";
/**
 * The theme's settings in the Theme panel: one to three handles, whether a
 * card must match any or every handle, and whether basic lands are counted.
 *
 * Deck analysis (ui), I-102 slice 3, requirements 2.1 and 2.3. Every control
 * is a native form element with a name, so the whole editor works from the
 * keyboard. The rows stack under 640 px.
 *
 * @module components/deck/ThemeHandleEditor
 */
import { useId, type Dispatch } from "react";
import { useTranslations } from "next-intl";
import type { DeckTheme } from "@/lib/deck/theme-match";
import { ThemeHandleRow } from "./ThemeHandleRow";
import {
  MAX_HANDLES,
  type ThemeDraft,
  type ThemeDraftAction,
} from "./theme-draft";

/** The two ways handles combine, "any" first as the default (I-102 2.1). */
const MATCH_MODES: readonly DeckTheme["match"][] = ["any", "all"];

interface ThemeHandleEditorProps {
  readonly draft: ThemeDraft;
  readonly dispatch: Dispatch<ThemeDraftAction>;
}

/** Edits the theme the panel counts. */
export function ThemeHandleEditor({ draft, dispatch }: ThemeHandleEditorProps) {
  const t = useTranslations("builder.theme");
  const matchName = useId();

  return (
    <div className="flex flex-col gap-3">
      <fieldset className="flex flex-col gap-2">
        <legend className="text-xs font-medium text-[var(--text-secondary)]">
          {t("handlesLegend")}
        </legend>
        <ol className="flex flex-col gap-2">
          {draft.handles.map((handle, position) => (
            <ThemeHandleRow
              key={handle.id}
              handle={handle}
              number={position + 1}
              dispatch={dispatch}
            />
          ))}
        </ol>
        {draft.handles.length < MAX_HANDLES ? (
          <button
            type="button"
            className="self-start text-xs font-medium text-[var(--text-primary)] underline"
            onClick={() => dispatch({ type: "addHandle" })}
          >
            {t("add")}
          </button>
        ) : (
          <p className="text-xs text-[var(--text-secondary)]">
            {t("maxHandles")}
          </p>
        )}
      </fieldset>
      <fieldset className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        <legend className="text-xs font-medium text-[var(--text-secondary)]">
          {t("matchLegend")}
        </legend>
        {MATCH_MODES.map((mode) => (
          <label
            key={mode}
            className="flex items-center gap-1 text-sm text-[var(--text-primary)]"
          >
            <input
              type="radio"
              name={matchName}
              value={mode}
              checked={draft.match === mode}
              onChange={() => dispatch({ type: "setMatch", match: mode })}
            />
            {t(`match.${mode}`)}
          </label>
        ))}
      </fieldset>
      <label className="flex items-center gap-1 text-sm text-[var(--text-primary)]">
        <input
          type="checkbox"
          checked={draft.countBasics}
          onChange={(event) =>
            dispatch({
              type: "setCountBasics",
              countBasics: event.target.checked,
            })
          }
        />
        {t("countBasics")}
      </label>
    </div>
  );
}
