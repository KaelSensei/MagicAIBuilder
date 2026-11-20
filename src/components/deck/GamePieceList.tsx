/**
 * The "Game pieces" block of the token library panel: one line per piece, already worded by
 * the panel, so the screen and the exported checklist read the same text.
 *
 * Context: deck statistics. `TokenLibraryPanel` builds the lines from `gamePiecesOf`.
 *
 * @module components/deck/GamePieceList
 */

import { useTranslations } from "next-intl";
import { useId } from "react";

import { gamePiecesOf, type GamePieceKind } from "@/lib/deck/game-pieces";
import type { DeckCard } from "@/lib/deck/types";

/** One worded line, such as "The monarch — Palace Jailer, Queen Marchesa". */
export interface GamePieceLine {
  readonly kind: GamePieceKind;
  readonly text: string;
}

/**
 * Words the game pieces the deck's cards need, in the viewer's language.
 *
 * @param cards - the deck's rows, the command zone included
 * @returns one line per piece, in `gamePiecesOf` order; empty when no card needs a piece
 */
export function useGamePieceLines(
  cards: readonly DeckCard[]
): readonly GamePieceLine[] {
  const t = useTranslations("deck");
  return gamePiecesOf(cards).map((piece) => ({
    kind: piece.kind,
    text: t("stats.gamePieceLine", {
      piece: t(`stats.gamePiece.${piece.kind}`),
      cards: piece.cardNames.join(", "),
    }),
  }));
}

interface GamePieceListProps {
  readonly heading: string;
  readonly lines: readonly GamePieceLine[];
}

/**
 * Lists the deck's game pieces under their heading; renders nothing when there is none.
 *
 * @param heading - the localized block title, which also names the list for assistive tech
 * @param lines - one line per piece kind, each kind once
 */
export function GamePieceList({ heading, lines }: GamePieceListProps) {
  const headingId = useId();
  if (lines.length === 0) return null;

  return (
    <div className="mt-3">
      <p
        id={headingId}
        className="mb-1 text-xs uppercase tracking-wide text-[var(--text-secondary)]"
      >
        {heading}
      </p>
      <ul aria-labelledby={headingId} className="space-y-1">
        {lines.map((line) => (
          <li key={line.kind} className="text-xs text-[var(--text-primary)]">
            {line.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
