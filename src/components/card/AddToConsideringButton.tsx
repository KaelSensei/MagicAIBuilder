"use client";

import { ListPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/components/ui/utils";
import type { ScryfallCard } from "@/lib/scryfall/types";

interface AddToConsideringButtonProps {
  readonly card: ScryfallCard;
  readonly isInMaybeboard: boolean;
  readonly onAdd: (card: ScryfallCard) => void;
  readonly className?: string;
}

/**
 * Adds a search result to Considering without dragging, for touch and keyboard users.
 *
 * @param props.card Search result to add.
 * @param props.isInMaybeboard Whether a card with this name is already in Considering.
 * @param props.onAdd Store action that adds the card to Considering.
 * @param props.className Positioning classes from the parent layout.
 * @returns An accessible icon button, disabled once the card is in Considering.
 */
export function AddToConsideringButton({
  card,
  isInMaybeboard,
  onAdd,
  className,
}: AddToConsideringButtonProps) {
  const t = useTranslations("card");
  const label = isInMaybeboard
    ? t("namedInMaybeboard", { name: card.name })
    : t("addNamedToMaybeboard", { name: card.name });
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={isInMaybeboard}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        onAdd(card);
      }}
      className={cn(
        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)] disabled:cursor-default disabled:opacity-50",
        className
      )}
    >
      <ListPlus aria-hidden="true" className="h-4 w-4" />
    </button>
  );
}
