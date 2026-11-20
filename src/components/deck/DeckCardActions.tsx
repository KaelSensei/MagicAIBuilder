"use client";

/**
 * The Duplicate and Delete buttons of a deck card on `/decks`.
 *
 * They sit beside the card's link, never inside it (WCAG 4.1.2: a button nested
 * in a link has no reliable role, and its name leaks into the link's name).
 * On a device that can hover they appear while the card is hovered or holds
 * focus; on a touch screen, which cannot hover, they are always shown.
 */
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Copy, Loader2, Trash2 } from "lucide-react";
import type { Deck } from "@/lib/deck/types";

interface DeckCardActionsProps {
  readonly deck: Pick<Deck, "id" | "name">;
  readonly onDelete: (e: React.MouseEvent, id: string) => void;
  readonly onDuplicate: (e: React.MouseEvent, id: string) => void;
  readonly isDeleting: boolean;
  readonly isDuplicating: boolean;
}

interface ActionButtonProps {
  readonly label: string;
  readonly isBusy: boolean;
  readonly icon: ReactNode;
  readonly hoverTone: string;
  readonly onClick: (e: React.MouseEvent) => void;
}

/** Shown on touch screens; hidden on hover-capable pointers until the card is hovered or focused. */
const ACTION_BUTTON_CLASS =
  "rounded-[var(--lumen-radius-pill)] p-1 text-[var(--text-secondary)] transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100 disabled:opacity-60";

/** One icon button; a spinner replaces its icon while its action runs. */
function ActionButton({
  label,
  isBusy,
  icon,
  hoverTone,
  onClick,
}: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isBusy}
      className={`${ACTION_BUTTON_CLASS} ${hoverTone}`}
      aria-label={label}
    >
      {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : icon}
    </button>
  );
}

/**
 * The deck card's Duplicate and Delete buttons, for the top-right corner of a
 * positioned card wrapper that holds the card's link as a sibling.
 *
 * @param props.deck The deck the buttons act on; its name goes into each label.
 * @param props.onDelete Called with the click and the deck id; the caller owns
 *   the confirmation and the request.
 * @param props.onDuplicate Called with the click and the deck id.
 * @param props.isDeleting Disables Delete and shows its spinner.
 * @param props.isDuplicating Disables Duplicate and shows its spinner.
 */
export function DeckCardActions({
  deck,
  onDelete,
  onDuplicate,
  isDeleting,
  isDuplicating,
}: DeckCardActionsProps) {
  const t = useTranslations("deck");

  return (
    <div className="absolute right-3 top-3 z-10 flex items-center gap-1">
      <ActionButton
        label={t("card.duplicate", { name: deck.name })}
        isBusy={isDuplicating}
        icon={<Copy className="h-3.5 w-3.5" />}
        hoverTone="hover:bg-[var(--accent)]/20 hover:text-[var(--accent-text)]"
        onClick={(e) => onDuplicate(e, deck.id)}
      />
      <ActionButton
        label={t("card.delete", { name: deck.name })}
        isBusy={isDeleting}
        icon={<Trash2 className="h-3.5 w-3.5" />}
        hoverTone="hover:bg-red-500/20 hover:text-red-400"
        onClick={(e) => onDelete(e, deck.id)}
      />
    </div>
  );
}
