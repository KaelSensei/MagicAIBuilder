"use client";
/**
 * What one export target leaves out or moves, shown under its row in the
 * export dialog before the player copies or downloads (I-50 requirement 1.2).
 *
 * Deck interchange, UI. A collapsed summary per kind of notice, with the
 * total copies concerned; opening it lists each card with its deck zone.
 * Renders nothing for a target that keeps every card where the deck holds
 * it. Not responsible for building the notices (`exportDeck`).
 *
 * @module components/deck/ExportNotices
 */
import { useTranslations } from "next-intl";
import type { ExportNotice } from "@/lib/deck/export";

interface ExportNoticesProps {
  /** The target's display name, e.g. "TappedOut". */
  readonly format: string;
  /** The target's notices, in deck order. */
  readonly notices: readonly ExportNotice[];
}

interface NoticeGroups {
  readonly dropped: readonly ExportNotice[];
  readonly moved: readonly ExportNotice[];
}

function groupNotices(notices: readonly ExportNotice[]): NoticeGroups {
  const dropped: ExportNotice[] = [];
  const moved: ExportNotice[] = [];
  for (const notice of notices) {
    (notice.kind === "cardDropped" ? dropped : moved).push(notice);
  }
  return { dropped, moved };
}

function totalCopies(notices: readonly ExportNotice[]): number {
  return notices.reduce((sum, notice) => sum + notice.quantity, 0);
}

/**
 * The notices of one export target: a "leaves out" group and a "moves"
 * group, each shown only when it has a card.
 */
export function ExportNotices({ format, notices }: ExportNoticesProps) {
  const t = useTranslations("deck.export.notices");
  const { dropped, moved } = groupNotices(notices);
  return (
    <>
      <NoticeGroup
        summary={t("leftOut", { format, count: totalCopies(dropped) })}
        notices={dropped}
      />
      <NoticeGroup
        summary={t("moved", { format, count: totalCopies(moved) })}
        notices={moved}
      />
    </>
  );
}

interface NoticeGroupProps {
  readonly summary: string;
  readonly notices: readonly ExportNotice[];
}

function NoticeGroup({ summary, notices }: NoticeGroupProps) {
  const t = useTranslations("deck.export.notices");
  if (notices.length === 0) return null;
  return (
    <details className="mt-1 text-xs text-[var(--text-secondary)]">
      <summary className="cursor-pointer">{summary}</summary>
      <ul aria-label={summary} className="mt-1 ml-4 list-disc space-y-0.5">
        {notices.map((notice) => (
          <li key={`${notice.from}:${notice.cardName}`}>
            {t("card", {
              quantity: notice.quantity,
              name: notice.cardName,
              zone: t(`zone.${notice.from}`),
            })}
          </li>
        ))}
      </ul>
    </details>
  );
}
