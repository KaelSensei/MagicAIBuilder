"use client";
/**
 * What a deck would break under the format the player just picked, shown
 * before the switch is saved (I-42 requirement 4.2 and its UX line: "Switching
 * format shows the cards that would become illegal before it saves").
 *
 * Context: deck building (ui), inside `DeckFormatPicker`. The checks are
 * `formatSwitchReport`'s; the ban list is the one the builder loads for a
 * format (`useBanlistQuery`), so it is cached for the editor once the switch
 * is saved. The player confirms or cancels here; no card is ever removed.
 *
 * @module deck/FormatSwitchPreview
 */
import { useId, useMemo } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { useBanlistQuery } from "@/hooks/useBanlist";
import { formatDeckCount } from "@/lib/deck/deck-size";
import type { DeckFormat } from "@/lib/deck/formats";
import {
  formatSwitchReport,
  type FormatSwitchReport,
  type FormatSwitchSize,
} from "@/lib/deck/format-switch";
import type { Deck } from "@/lib/deck/types";
import { useDeckSizeStateLabel } from "./DeckCardCount";

interface FormatSwitchPreviewProps {
  /** The deck as the store holds it */
  readonly deck: Deck;
  /** The format the player picked; not saved yet */
  readonly target: DeckFormat;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

/** One line of the list of what breaks, with a stable key. */
interface Problem {
  readonly key: "size" | "copies" | "colorIdentity" | "banned";
  readonly text: string;
}

/**
 * The preview: a region named "Switch to <format>?", the list of what breaks
 * (or that nothing does), the ban list's loading state in words, and the
 * confirm and cancel buttons.
 */
export function FormatSwitchPreview({
  deck,
  target,
  onConfirm,
  onCancel,
}: FormatSwitchPreviewProps) {
  const t = useTranslations("builder.details.formatSwitch");
  const formatName = useTranslations("deck.format.name")(target);
  const headingId = useId();
  const banList = useBanlistQuery(target);
  const report = useMemo(
    () =>
      formatSwitchReport(
        deck,
        target,
        new Set((banList.data ?? []).map((card) => card.name))
      ),
    [deck, target, banList.data]
  );
  const problems = useProblems(report, formatName);
  const banListSettled = !banList.isLoading;

  return (
    <section
      aria-labelledby={headingId}
      className="space-y-2 rounded border border-[var(--border)] bg-[var(--background)] p-2 text-xs"
    >
      <h3 id={headingId} className="font-semibold text-[var(--text-primary)]">
        {t("title", { format: formatName })}
      </h3>
      {problems.length > 0 && (
        <ul className="list-disc space-y-1 pl-4 text-[var(--text-primary)]">
          {problems.map((problem) => (
            <li key={problem.key}>{problem.text}</li>
          ))}
        </ul>
      )}
      <BanListState
        isLoading={banList.isLoading}
        isError={banList.isError}
        format={formatName}
      />
      {banListSettled && problems.length === 0 && (
        <p>{t("nothingBreaks", { format: formatName })}</p>
      )}
      {problems.length > 0 && (
        <p className="text-[var(--text-secondary)]">{t("keepsCards")}</p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onConfirm}
          className="rounded bg-[var(--accent)] px-2 py-1 font-medium text-white hover:bg-[var(--accent-hover)]"
        >
          {t("confirm", { format: formatName })}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-[var(--border)] px-2 py-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          {t("cancel")}
        </button>
      </div>
    </section>
  );
}

/** The ban list's state in words while it loads or when it failed. */
function BanListState({
  isLoading,
  isError,
  format,
}: {
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly format: string;
}) {
  const t = useTranslations("builder.details.formatSwitch");
  // A native <output> carries the status role, so the state is announced.
  if (isLoading) {
    return <output className="block">{t("banListLoading", { format })}</output>;
  }
  if (isError) {
    return <output className="block">{t("banListFailed", { format })}</output>;
  }
  return null;
}

/** The report's problems as the sentences the list shows, in a fixed order. */
function useProblems(
  report: FormatSwitchReport,
  format: string
): readonly Problem[] {
  const t = useTranslations("builder.details.formatSwitch");
  const formatter = useFormatter();
  const cards = (names: readonly string[]) =>
    formatter.list(names, { type: "conjunction" });
  const sizeText = useSizeText(report.size);

  const problems: Problem[] = [];
  if (sizeText) problems.push({ key: "size", text: sizeText });
  if (report.overCopyLimit.length > 0) {
    const items = report.overCopyLimit.map(({ name, copies, limit }) =>
      t("copyItem", { name, copies, limit })
    );
    problems.push({
      key: "copies",
      text: t("copies", { format, cards: cards(items) }),
    });
  }
  if (report.outsideColorIdentity.length > 0) {
    problems.push({
      key: "colorIdentity",
      text: t("colorIdentity", { cards: cards(report.outsideColorIdentity) }),
    });
  }
  if (report.banned.length > 0) {
    problems.push({
      key: "banned",
      text: t("banned", { format, cards: cards(report.banned) }),
    });
  }
  return problems;
}

/** "Deck size: 100/60, 40 cards over"; null when the deck has a legal size. */
function useSizeText(size: FormatSwitchSize): string | null {
  const t = useTranslations("builder.details.formatSwitch");
  const state = useDeckSizeStateLabel(size.status, size.cardCount, size.rule);
  if (size.status === "legal") return null;
  return t("size", {
    count: formatDeckCount(size.cardCount, size.rule, "/"),
    state,
  });
}
