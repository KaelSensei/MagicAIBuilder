"use client";
import { useTranslations } from "next-intl";
import { CARD_BACK_URL } from "@/lib/scryfall/images";
import { PlaytestCardImage } from "@/components/playtest/PlaytestCardImage";
import type { DeckCard } from "@/lib/deck/types";
import { useLocalizeDeckCard } from "@/components/card/LocalizedDeckTextContext";

interface CommandZoneProps {
  /** Commanders currently in the command zone. */
  readonly cards: readonly DeckCard[];
  /** Casts a commander onto the battlefield. */
  readonly onCast: (cardId: string) => void;
}

/**
 * Shows the commanders waiting in the command zone, face up (CR 903.6), each
 * with an action to cast it onto the battlefield.
 *
 * @param props - the command zone's cards and the cast action
 * @returns the command zone panel
 */
export function CommandZone({ cards, onCast }: CommandZoneProps) {
  const t = useTranslations("playtest.commandZone");
  const localize = useLocalizeDeckCard();

  return (
    <section className="bg-[var(--surface)] rounded-xl p-4 space-y-3">
      <h3 className="text-[var(--text-primary)] font-semibold text-sm">{t("title")}</h3>
      {cards.length === 0 ? (
        <p className="text-xs text-[var(--text-secondary)]">{t("empty")}</p>
      ) : (
        <ul className="flex flex-wrap gap-3">
          {cards.map((card) => {
            const view = localize(card);
            return (
              <li key={card.id} className="w-24 space-y-1.5">
                <PlaytestCardImage
                  src={view.imageUri || CARD_BACK_URL}
                  alt={view.name}
                  className="rounded-md"
                />
                <p className="text-xs text-[var(--text-primary)] truncate">{view.name}</p>
                <button
                  type="button"
                  onClick={() => onCast(card.id)}
                  aria-label={t("castCard", { name: view.name })}
                  className="w-full px-2 py-1 text-xs bg-green-600/20 hover:bg-green-600/40 text-green-300 rounded transition-colors"
                >
                  {t("cast")}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
