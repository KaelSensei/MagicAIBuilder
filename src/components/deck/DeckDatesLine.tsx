"use client";
/**
 * The line that says when a deck was created and last updated, in the
 * builder's Deck details and on the public deck page.
 *
 * It renders the stored dates it is given and nothing else (I-92: a date shown
 * is the one that was stored; a missing date is absent, not guessed). A missing
 * or unreadable date drops its part of the line, and the line disappears when
 * both are missing, so a caller mounts it without a branch.
 *
 * Each date is a `<time>` whose `dateTime` holds the stored instant and whose
 * title is the full date and time in the viewer's locale. The update date reads
 * as relative ("2 days ago") up to {@link RELATIVE_UPDATE_LIMIT_DAYS} days old,
 * then as a date; the creation date always reads as a date. "Now" comes from
 * next-intl's `useNow`, so a provider or a test can fix it.
 *
 * The relative text waits for the hydration. The server renders at one instant
 * and the browser hydrates at another, so around a unit boundary they would
 * write "22 hours ago" and "1 day ago", and React would keep the server's stale
 * text. The server HTML and the hydration therefore show the update as a date,
 * which does not depend on "now"; the browser switches to the relative text
 * right after. The layout's provider gets no request-time `now` on purpose: it
 * would freeze "now" into cached and static pages for every `useNow` caller.
 *
 * @module components/deck/DeckDatesLine
 */
import { useSyncExternalStore, type ReactNode } from "react";
import { useFormatter, useNow, useTranslations } from "next-intl";
import { cn } from "@/components/ui/utils";

/** A stored instant: a `Date` from the deck store or an ISO string from JSON. */
export type DeckInstant = Date | string;

/** Past this age the update date reads as a date rather than "n days ago". */
export const RELATIVE_UPDATE_LIMIT_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

interface DeckDatesLineProps {
  /** When the deck was created, as stored; absent shows no creation date. */
  readonly createdAt?: DeckInstant | null;
  /** When the deck was last updated, as stored; absent shows no update date. */
  readonly updatedAt?: DeckInstant | null;
  /** Spacing from the mounting surface. */
  readonly className?: string;
}

/** The instant a stored value names, or null when it is missing or unreadable. */
function toInstant(value: DeckInstant | null | undefined): Date | null {
  if (value === null || value === undefined) return null;
  const instant = new Date(value);
  return Number.isNaN(instant.getTime()) ? null : instant;
}

/** True while an update is recent enough to read as "n days ago". */
function readsAsRelative(updatedAt: Date, now: Date): boolean {
  return (
    now.getTime() - updatedAt.getTime() <= RELATIVE_UPDATE_LIMIT_DAYS * DAY_MS
  );
}

/** Nothing to undo: whether the line has hydrated never changes back. */
function unsubscribeFromNothing(): void {
  // The store below never changes, so there is no listener to remove.
}

/** Hydration is the only change the store below has, and React handles it. */
function subscribeToNothing(): () => void {
  return unsubscribeFromNothing;
}

/**
 * False in the server render and in the hydration, true in every render after.
 * React hydrates with the server snapshot, so both sides render the same text,
 * then re-renders at once with the browser snapshot; a render that is not a
 * hydration reads true straight away.
 */
function useHasHydrated(): boolean {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false
  );
}

/** The `<time>` tag of a dates message, holding the stored instant. */
function storedTimeTag(instant: Date, title: string) {
  return function storedTime(chunks: ReactNode) {
    return (
      <time dateTime={instant.toISOString()} title={title}>
        {chunks}
      </time>
    );
  };
}

/**
 * Shows a deck's stored creation and update dates.
 *
 * @param props.createdAt - the stored creation instant, or nothing
 * @param props.updatedAt - the stored update instant, or nothing
 * @returns the dates line, or null when neither date is known
 */
export function DeckDatesLine({
  createdAt,
  updatedAt,
  className,
}: DeckDatesLineProps) {
  const t = useTranslations("deck.dates");
  const format = useFormatter();
  const now = useNow();
  const hasHydrated = useHasHydrated();
  const created = toInstant(createdAt);
  const updated = toInstant(updatedAt);
  if (created === null && updated === null) return null;

  const timeOf = (instant: Date) =>
    storedTimeTag(
      instant,
      format.dateTime(instant, { dateStyle: "full", timeStyle: "short" })
    );
  const asDate = (instant: Date) =>
    format.dateTime(instant, { dateStyle: "medium" });

  return (
    <p className={cn("text-xs text-[var(--text-secondary)]", className)}>
      {created && (
        <span>
          {t.rich("created", { date: asDate(created), time: timeOf(created) })}
        </span>
      )}
      {created && updated && <span aria-hidden="true"> · </span>}
      {updated && (
        <span>
          {hasHydrated && readsAsRelative(updated, now)
            ? t.rich("updatedAgo", {
                ago: format.relativeTime(updated, now),
                time: timeOf(updated),
              })
            : t.rich("updatedOn", {
                date: asDate(updated),
                time: timeOf(updated),
              })}
        </span>
      )}
    </p>
  );
}
