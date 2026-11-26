"use client";

/**
 * What the AI deck wizard shows when it created the deck but could not fill it completely.
 *
 * Deck building context. The deck is in the player's library already, so the notice offers the
 * deck, never a retry: building or saving again would store a second deck (I-02). The error behind
 * it stays in the log (`use-built-deck-save.ts`); the player reads one sentence in their language.
 * The build's corrections, when it has any, are listed under that sentence: they are stored nowhere
 * else, and every correction is shown (I-02 spec, 2.2 and 5.3). One "Open the deck" serves both.
 *
 * @module deck/UnfinishedDeckNotice
 */
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { GeneratedDeckCorrections } from "./GeneratedDeckCorrections";
import type { UnfinishedDeck } from "./use-built-deck-save";

/**
 * Says the deck was created but not finished, lists the build's corrections, and opens the deck on
 * request.
 *
 * @param deck - The stored deck, the copies its import could not add and the build's corrections
 * @param onOpenDeck - Opens a deck by id, as the wizard's success path does
 */
export function UnfinishedDeckNotice({
  deck,
  onOpenDeck,
}: {
  readonly deck: UnfinishedDeck;
  readonly onOpenDeck: (deckId: string) => void;
}) {
  const t = useTranslations("deck");

  return (
    <section className="flex flex-col items-center gap-6 w-full max-w-md mx-auto">
      <div className="text-4xl" aria-hidden="true">
        ⚠️
      </div>
      <p
        role="alert"
        className="text-sm text-center text-[var(--text-primary)]"
      >
        {deck.cardsNotAdded === null
          ? t("wizard.deckNotFinished")
          : t("wizard.deckNotFinishedCards", { count: deck.cardsNotAdded })}
      </p>
      {deck.corrections.length > 0 && (
        <GeneratedDeckCorrections corrections={deck.corrections} />
      )}
      <Button size="lg" onClick={() => onOpenDeck(deck.deckId)}>
        {t("wizard.openDeck")}
      </Button>
    </section>
  );
}
