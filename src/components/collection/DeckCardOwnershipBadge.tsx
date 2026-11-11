"use client";
/**
 * The Owned / Buy badge on a deck card row: whether the player's collection
 * holds the copies this row needs.
 *
 * Collection context, shown by `CardListItem` in the deck editor's list view.
 * The decision is `deckCardOwnership`; the counts are live reads of the
 * collection store, which the app loads for a signed-in player.
 * The status is written out, never carried by colour alone (WCAG 1.4.1): a
 * short visible label, and a sentence with the counts for screen readers and
 * the hover title.
 *
 * @module collection/DeckCardOwnershipBadge
 */
import { useTranslations } from "next-intl";
import { Package, ShoppingCart } from "lucide-react";
import { cn } from "@/components/ui/utils";
import { deckCardOwnership } from "@/lib/collection/deck-card-ownership";
import {
  useHasCollectionCards,
  useOwnedQuantity,
} from "@/lib/collection/owned-quantity";
import type { DeckCard } from "@/lib/deck/types";

interface DeckCardOwnershipBadgeProps {
  readonly card: Pick<DeckCard, "id" | "scryfallId" | "typeLine" | "quantity">;
  readonly className?: string;
}

const BADGE_CLASS =
  "shrink-0 inline-flex items-center gap-0.5 text-[10px] font-medium leading-none rounded px-1 py-0.5";

/**
 * Shows whether the player owns this row's card, or must buy copies of it.
 *
 * Renders nothing while the collection is empty (a guest, a player who has
 * recorded no card, or a collection still loading), so a deck is not covered
 * in Buy badges before there is anything to compare with. Renders nothing for
 * a basic land either.
 */
export function DeckCardOwnershipBadge({
  card,
  className,
}: DeckCardOwnershipBadgeProps) {
  const hasCollection = useHasCollectionCards();
  // A row saved without a printing falls back to its own id, as the deck's
  // collection panel does (`getDeckCardStatuses`).
  const ownedQuantity = useOwnedQuantity(card.scryfallId ?? card.id);
  if (!hasCollection) return null;

  const ownership = deckCardOwnership(card, ownedQuantity);
  switch (ownership.kind) {
    case "basicLand":
      return null;
    case "owned":
      return (
        <OwnedBadge
          ownedQuantity={ownership.ownedQuantity}
          className={className}
        />
      );
    case "buy":
      return (
        <BuyBadge
          ownedQuantity={ownership.ownedQuantity}
          missingQuantity={ownership.missingQuantity}
          className={className}
        />
      );
    default: {
      const unhandled: never = ownership;
      throw new Error(`Unhandled deck card ownership: ${String(unhandled)}`);
    }
  }
}

function OwnedBadge({
  ownedQuantity,
  className,
}: {
  readonly ownedQuantity: number;
  readonly className?: string;
}) {
  const t = useTranslations("collection.ownership");
  const detail = t("ownedDetail", { owned: ownedQuantity });

  return (
    <span
      className={cn(
        BADGE_CLASS,
        "text-emerald-400 bg-emerald-400/10",
        className
      )}
      title={detail}
    >
      <Package className="w-2.5 h-2.5" aria-hidden="true" />
      <span aria-hidden="true">{t("owned")}</span>
      <span className="sr-only">{detail}</span>
    </span>
  );
}

function BuyBadge({
  ownedQuantity,
  missingQuantity,
  className,
}: {
  readonly ownedQuantity: number;
  readonly missingQuantity: number;
  readonly className?: string;
}) {
  const t = useTranslations("collection.ownership");
  const detail = t("buyDetail", {
    owned: ownedQuantity,
    missing: missingQuantity,
  });

  return (
    <span
      className={cn(BADGE_CLASS, "text-amber-400 bg-amber-400/10", className)}
      title={detail}
    >
      <ShoppingCart className="w-2.5 h-2.5" aria-hidden="true" />
      <span aria-hidden="true">{t("buy")}</span>
      <span className="sr-only">{detail}</span>
    </span>
  );
}
