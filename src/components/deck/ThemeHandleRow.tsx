"use client";
/**
 * One handle of the theme as the player edits it: its kind, its value, the
 * "ignore a leading The" switch for a first letter, and a remove button.
 *
 * Deck analysis (ui), I-102 slice 3. The kinds that need card details the
 * deck does not store yet (artist, plane or set, watermark, flavour text) are
 * listed as disabled options with the reason, never as a kind that matches
 * nothing (requirement 6.2).
 *
 * @module components/deck/ThemeHandleRow
 */
import type { Dispatch } from "react";
import { useTranslations } from "next-intl";
import {
  MAX_HANDLE_LENGTH,
  PENDING_HANDLE_KINDS,
  STORED_HANDLE_KINDS,
  type HandleChanges,
  type HandleDraft,
  type ThemeDraftAction,
} from "./theme-draft";

/** The class every control of the row shares. */
const CONTROL_CLASS =
  "rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-sm text-[var(--text-primary)]";

interface ThemeHandleRowProps {
  readonly handle: HandleDraft;
  /** The handle's position, from 1, as the player reads it */
  readonly number: number;
  readonly dispatch: Dispatch<ThemeDraftAction>;
}

/** Edits one handle; every control is named after the handle's position. */
export function ThemeHandleRow({
  handle,
  number,
  dispatch,
}: ThemeHandleRowProps) {
  const t = useTranslations("builder.theme");
  const edit = (changes: HandleChanges) =>
    dispatch({ type: "editHandle", id: handle.id, changes });

  return (
    <li className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center">
      <select
        aria-label={t("kindLabel", { number })}
        className={CONTROL_CLASS}
        value={handle.kind}
        onChange={(event) => {
          const kind = STORED_HANDLE_KINDS.find(
            (stored) => stored === event.target.value
          );
          if (kind) edit({ kind });
        }}
      >
        {STORED_HANDLE_KINDS.map((kind) => (
          <option key={kind} value={kind}>
            {t(`kinds.${kind}`)}
          </option>
        ))}
        {PENDING_HANDLE_KINDS.map((kind) => (
          <option key={kind} value={kind} disabled>
            {t("pendingKind", { kind: t(`kinds.${kind}`) })}
          </option>
        ))}
      </select>
      <input
        type="text"
        aria-label={t("valueLabel", { number })}
        className={CONTROL_CLASS}
        value={handle.value}
        maxLength={handle.kind === "firstLetter" ? 1 : MAX_HANDLE_LENGTH}
        onChange={(event) => edit({ value: event.target.value })}
      />
      {handle.kind === "firstLetter" ? (
        <label className="flex items-center gap-1 text-xs text-[var(--text-primary)]">
          <input
            type="checkbox"
            checked={handle.ignoreLeadingThe}
            onChange={(event) =>
              edit({ ignoreLeadingThe: event.target.checked })
            }
          />
          {t("ignoreLeadingThe")}
        </label>
      ) : null}
      <button
        type="button"
        aria-label={t("removeLabel", { number })}
        className="self-start text-xs text-[var(--text-secondary)] underline"
        onClick={() => dispatch({ type: "removeHandle", id: handle.id })}
      >
        {t("remove")}
      </button>
    </li>
  );
}
