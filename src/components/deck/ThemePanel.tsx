"use client";
/**
 * The builder's Theme panel: the player names one to three handles and sees
 * how many of the deck's cards hold them, which do, and which do not.
 *
 * Deck analysis (ui), I-102 slice 3
 * (`docs/product/specs/i102-a-theme-you-can-measure.md`). The player chooses
 * the theme; the product never infers one (requirement 1.1). The theme lives
 * in this panel's state for the session and is not saved with the deck, which
 * the panel says: storing it is slice 2. The count runs on the deck the
 * builder holds, a guest deck included, with no request and no store write.
 * Mounted from the deck details panel, closed until the player opens it.
 * Not responsible for: matching and counting (`lib/deck/theme-match.ts`,
 * `lib/deck/theme-coverage.ts`), the editor (`ThemeHandleEditor`) or the
 * lists (`ThemeCoverageView`).
 *
 * @module components/deck/ThemePanel
 */
import { useMemo, useReducer, useState } from "react";
import { useTranslations } from "next-intl";
import {
  themeCoverage,
  type ThemeCoverageDeck,
} from "@/lib/deck/theme-coverage";
import { ThemeCoverageView } from "./ThemeCoverageView";
import { ThemeHandleEditor } from "./ThemeHandleEditor";
import {
  INITIAL_THEME_DRAFT,
  themeDraftReducer,
  themeFromDraft,
} from "./theme-draft";

interface ThemePanelProps {
  /** The deck the builder holds: its command zone and its rows */
  readonly deck: ThemeCoverageDeck;
}

/**
 * A disclosure that opens the theme editor and the deck's coverage of it.
 *
 * @param props.deck - the deck measured
 */
export function ThemePanel({ deck }: ThemePanelProps) {
  const t = useTranslations("builder.theme");
  const [open, setOpen] = useState(false);
  const [draft, dispatch] = useReducer(themeDraftReducer, INITIAL_THEME_DRAFT);
  const theme = useMemo(() => themeFromDraft(draft), [draft]);
  const coverage = useMemo(
    () => (theme ? themeCoverage(deck, theme) : null),
    [deck, theme]
  );

  return (
    <section className="border-t border-[var(--border)]">
      <button
        type="button"
        className="w-full px-3 py-2 text-left text-sm font-medium text-[var(--text-primary)]"
        aria-expanded={open}
        onClick={() => setOpen((wasOpen) => !wasOpen)}
      >
        {t("title")}
      </button>
      {open ? (
        <div className="flex flex-col gap-3 px-3 pb-3">
          <p className="text-xs text-[var(--text-secondary)]">
            {t("notSaved")}
          </p>
          <ThemeHandleEditor draft={draft} dispatch={dispatch} />
          {theme && coverage ? (
            <ThemeCoverageView theme={theme} coverage={coverage} />
          ) : (
            <p className="text-xs text-[var(--text-secondary)]">
              {t("noHandle")}
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}
