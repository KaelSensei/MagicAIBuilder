"use client";

import { useTranslations } from "next-intl";
import type { DeckCorrection } from "@/app/api/ai/build/types";

type Translate = ReturnType<typeof useTranslations>;

/** The player-facing rule behind one correction. */
function reasonText(t: Translate, reason: DeckCorrection["reason"]): string {
  switch (reason) {
    case "unknown_card":
      return t("wizard.correctionReasonUnknownCard");
    case "outside_color_identity":
      return t("wizard.correctionReasonOutsideColorIdentity");
    case "banned":
      return t("wizard.correctionReasonBanned");
    case "not_legal":
      return t("wizard.correctionReasonNotLegal");
    case "extra_copies":
      return t("wizard.correctionReasonExtraCopies");
    case "commander_in_list":
      return t("wizard.correctionReasonCommanderInList");
    case "over_size":
      return t("wizard.correctionReasonOverSize");
    case "fill_to_size":
      return t("wizard.correctionReasonFillToSize");
    default: {
      const unhandled: never = reason;
      return unhandled;
    }
  }
}

/**
 * Lists what the server's card-data check changed in an AI-generated deck,
 * so a removed or added card is never a silent change (I-02 spec, 2.2 and 5.3).
 *
 * @param corrections - The corrections from the build's `done` event, in list order
 * @param onOpenDeck - Opens the saved deck once the player has read the list
 */
export function GeneratedDeckCorrections({
  corrections,
  onOpenDeck,
}: {
  readonly corrections: readonly DeckCorrection[];
  readonly onOpenDeck: () => void;
}) {
  const t = useTranslations("deck");

  return (
    <section
      aria-labelledby="generated-deck-corrections-title"
      className="flex flex-col gap-4 w-full max-w-md mx-auto"
    >
      <h2
        id="generated-deck-corrections-title"
        className="text-xl font-bold text-[var(--text-primary)] text-center"
      >
        {t("wizard.correctionsTitle", { count: corrections.length })}
      </h2>
      <p className="text-sm text-[var(--text-secondary)] text-center">
        {t("wizard.correctionsIntro")}
      </p>
      <ul className="flex flex-col gap-2 text-sm text-[var(--text-primary)]">
        {corrections.map((correction, index) => (
          <li
            key={`${correction.action}-${correction.name}-${correction.reason}-${index}`}
            className="px-3 py-2 rounded-lg border border-[var(--border)]"
          >
            {t(
              correction.action === "removed"
                ? "wizard.correctionRemoved"
                : "wizard.correctionAdded",
              {
                name: correction.name,
                quantity: correction.quantity,
                reason: reasonText(t, correction.reason),
              }
            )}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onOpenDeck}
        className="self-center px-5 py-2.5 rounded-xl text-sm font-semibold bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white"
      >
        {t("wizard.openDeck")}
      </button>
    </section>
  );
}
