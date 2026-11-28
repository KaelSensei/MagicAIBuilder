/**
 * The link from an acquisition plan line to the deck that needs the copies.
 * The buy-now list and the deferred group both name decks, and the player acts
 * on a line in that deck's builder (its shopping list holds the deferred
 * choice), so both lists link a deck the same way.
 *
 * @module components/collection/DeckBuilderLink
 */
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

interface DeckBuilderLinkProps {
  readonly deckId: string;
  /** The link's text, and so its accessible name: the deck's name. */
  readonly children: ReactNode;
}

/** A locale-aware link to the deck's builder, `/builder/<deckId>`. */
export function DeckBuilderLink({ deckId, children }: DeckBuilderLinkProps) {
  return (
    <Link
      href={`/builder/${deckId}`}
      className="hover:text-[var(--accent-text)] hover:underline focus-visible:underline"
    >
      {children}
    </Link>
  );
}
