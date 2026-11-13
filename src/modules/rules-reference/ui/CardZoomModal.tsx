"use client";
/**
 * The zoom of one card of the Game Changers and banlist page: its display-size
 * image, name, type line and position in the page, with previous/next
 * navigation and a button to the printing selector.
 *
 * Rules reference context, `ui/`. Built on the shared `Modal`, which gives it
 * the dialog role, the focus trap, the focus return to the tile that opened it
 * and an Escape that closes only the top dialog (#1340). Presentational: the
 * page owns which card is zoomed and what the printings button opens.
 *
 * @module rules-reference/ui/CardZoomModal
 */
import type { KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { Modal, ModalTitle } from "@/components/ui/Modal";
import {
  getCardGridImageUri,
  getListedCardImageUri,
} from "@/modules/rules-reference/ui/card-image";
import { resolveLocalizedText } from "@/lib/scryfall/localized";
import type { ScryfallCard } from "@/lib/scryfall/types";

export interface CardZoomModalProps {
  /** The zoomed card; it must be one of `cards`. */
  readonly card: ScryfallCard;
  /** The cards the previous/next controls step through, in page order. */
  readonly cards: readonly ScryfallCard[];
  readonly onClose: () => void;
  /** Called with the neighbouring card when the visitor steps to it. */
  readonly onNavigate: (card: ScryfallCard) => void;
  /** Called when the visitor asks for every printing of the zoomed card. */
  readonly onOpenPrintings: () => void;
}

const SIDE_BUTTON_CLASS =
  "absolute top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white/70 transition-colors hover:bg-black/80 hover:text-white";

interface StepButtonProps {
  readonly direction: "previous" | "next";
  /** The card the step leads to; the button is not drawn when there is none. */
  readonly target: ScryfallCard | undefined;
  readonly onNavigate: (card: ScryfallCard) => void;
}

/** The previous or next arrow at the side of the card, absent at that end of the page. */
function StepButton({ direction, target, onNavigate }: StepButtonProps) {
  const t = useTranslations("rules");
  if (!target) return null;
  const isPrevious = direction === "previous";
  return (
    <button
      type="button"
      onClick={() => onNavigate(target)}
      className={`${SIDE_BUTTON_CLASS} ${isPrevious ? "left-4" : "right-4"}`}
      aria-label={t(isPrevious ? "zoom.previousCard" : "zoom.nextCard")}
    >
      {isPrevious ? "‹" : "›"}
    </button>
  );
}

interface ZoomedCardPanelProps {
  readonly card: ScryfallCard;
  /** The card's position in the page, for "n / total". */
  readonly position: { readonly current: number; readonly total: number };
  readonly onClose: () => void;
  readonly onOpenPrintings: () => void;
}

/** The card itself: the close button, the display-size image, the caption and the printings button. */
function ZoomedCardPanel({
  card,
  position,
  onClose,
  onOpenPrintings,
}: ZoomedCardPanelProps) {
  const t = useTranslations("rules");
  const text = resolveLocalizedText(card);
  const largeUri =
    getListedCardImageUri(card, "display") ?? getCardGridImageUri(card);

  return (
    <div className="relative z-10 w-full max-w-[400px]">
      <button
        type="button"
        onClick={onClose}
        className="absolute -right-3 -top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] shadow-lg transition-colors hover:text-[var(--text-primary)]"
        aria-label={t("zoom.closeButton")}
      >
        <X className="w-4 h-4" />
      </button>

      {largeUri && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={largeUri}
          alt={text.name}
          className="w-full rounded-xl shadow-2xl"
        />
      )}

      <div className="mt-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-white">{text.name}</p>
          <p className="text-xs text-white/60">
            {text.typeLine}
            {position.total > 1 && (
              <span className="ml-2 text-white/40">
                {t("zoom.cardPosition", position)}
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenPrintings}
          className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white/80 transition-colors hover:border-white/40 hover:text-white"
        >
          {t("zoom.viewAllArts")}
        </button>
      </div>
    </div>
  );
}

/**
 * A modal zoom of `card`, named "<card name> — zoom" for assistive technology.
 *
 * ArrowLeft and ArrowRight step through `cards` and stop at both ends; Escape,
 * the close button and a press on the backdrop close it. Focus lands on the
 * close button when it opens and goes back to the element that opened it when
 * it closes. The arrow keys are read on the dialog content rather than the
 * window: the focus trap keeps every key press inside it.
 */
export function CardZoomModal({
  card,
  cards,
  onClose,
  onNavigate,
  onOpenPrintings,
}: CardZoomModalProps) {
  const t = useTranslations("rules");
  const currentIndex = cards.findIndex((c) => c.id === card.id);
  const previous = currentIndex > 0 ? cards[currentIndex - 1] : undefined;
  const next =
    currentIndex < cards.length - 1 ? cards[currentIndex + 1] : undefined;

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft" && previous) onNavigate(previous);
    if (event.key === "ArrowRight" && next) onNavigate(next);
  }

  return (
    <Modal
      open
      onClose={onClose}
      showClose={false}
      maxWidth="max-w-none"
      className="mx-0 h-full w-full rounded-none border-0 bg-transparent p-4 shadow-none"
    >
      <ModalTitle className="sr-only">
        {`${resolveLocalizedText(card).name} — zoom`}
      </ModalTitle>
      {/* The trap keeps focus inside, so every key press bubbles through here. */}
      <div
        className="relative flex h-full w-full items-center justify-center"
        onKeyDown={handleKeyDown}
      >
        <ZoomedCardPanel
          card={card}
          position={{ current: currentIndex + 1, total: cards.length }}
          onClose={onClose}
          onOpenPrintings={onOpenPrintings}
        />
        <StepButton
          direction="previous"
          target={previous}
          onNavigate={onNavigate}
        />
        <StepButton direction="next" target={next} onNavigate={onNavigate} />

        {/* The backdrop is a button so a press around the card closes the zoom;
            it comes last so the focus trap opens on the close button, not on it. */}
        <button
          type="button"
          className="absolute inset-0 z-0 cursor-default border-0 bg-transparent p-0"
          aria-label={t("zoom.close")}
          onClick={onClose}
        />
      </div>
    </Modal>
  );
}
