"use client";
/**
 * One group of cards in the Theme panel, under a visible heading that names
 * the list, and one card row of such a group.
 *
 * Deck analysis (ui), I-102 requirement 3.2: the on-theme cards are grouped by
 * handle and the off-theme cards by stored category. A card row says why the
 * card sits where it does: the field and the text that matched, or that no
 * handle matches.
 *
 * @module components/deck/ThemeCardGroup
 */
import { useId, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { ThemeListEntry } from "./theme-panel-groups";

interface ThemeCardGroupProps {
  /** The group's name: a handle or a category */
  readonly title: ReactNode;
  /** One `ThemeCardRow` per card; none shows `emptyText` */
  readonly children: readonly ReactNode[];
  readonly emptyText: string;
}

/** A heading and the list it names. */
export function ThemeCardGroup({
  title,
  children,
  emptyText,
}: ThemeCardGroupProps) {
  const headingId = useId();

  return (
    <div className="flex flex-col gap-1">
      <h4
        id={headingId}
        className="text-xs font-semibold text-[var(--text-primary)]"
      >
        {title}
      </h4>
      {children.length > 0 ? (
        <ul aria-labelledby={headingId} className="flex flex-col gap-1">
          {children}
        </ul>
      ) : (
        <p className="text-xs text-[var(--text-secondary)]">{emptyText}</p>
      )}
    </div>
  );
}

interface ThemeCardRowProps {
  readonly entry: ThemeListEntry;
  /** Why the card is in this group */
  readonly reason: string;
}

/** A card, its copies, whether it is in the command zone, and why it is here. */
export function ThemeCardRow({ entry, reason }: ThemeCardRowProps) {
  const t = useTranslations("builder.theme");

  return (
    <li className="text-sm text-[var(--text-primary)]">
      <span className="flex flex-wrap items-baseline gap-1">
        {entry.quantity > 1 ? (
          <span>{t("copies", { quantity: entry.quantity })}</span>
        ) : null}
        <span>{entry.cardName}</span>
        {entry.commandZone ? (
          <span className="text-xs text-[var(--text-secondary)]">
            {t("commandZone")}
          </span>
        ) : null}
      </span>
      <span className="block text-xs text-[var(--text-secondary)]">
        {reason}
      </span>
    </li>
  );
}
