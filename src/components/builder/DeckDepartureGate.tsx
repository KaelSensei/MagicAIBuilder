"use client";
/**
 * What the builder shows in place of a deck it no longer holds, while it is on its way to the
 * library after the player deleted that deck there (see `useDeckDeparture`).
 */
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

/** Props of {@link DeckDepartureGate}. */
export interface DeckDepartureGateProps {
  /** The page deleted this deck itself and is leaving for the library. */
  readonly isLeaving: boolean;
  /** What the page shows for a deck it does not hold, such as "Deck not found". */
  readonly children: ReactNode;
}

/**
 * While the page is leaving a deck it deleted, says the library is opening; otherwise shows
 * `children`, so a deck missing for any other reason is still reported as missing.
 */
export function DeckDepartureGate({
  isLeaving,
  children,
}: DeckDepartureGateProps) {
  const t = useTranslations("builder.deleteDeck");

  if (!isLeaving) return children;
  return (
    <output aria-busy="true" className="text-sm text-[var(--text-secondary)]">
      {t("leaving")}
    </output>
  );
}
