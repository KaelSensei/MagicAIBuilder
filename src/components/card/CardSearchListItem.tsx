"use client";
// List view row for search results
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@/components/ui/utils";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { DraggableCard } from "./DraggableCard";
import { SearchZoneMenu } from "./SearchZoneMenu";
import { CollectionBadge } from "@/components/collection/CollectionBadge";
import type { DeckZone } from "@/lib/deck/types";

interface CardSearchListItemProps {
  readonly card: ScryfallCard;
  readonly onClick?: (card: ScryfallCard) => void;
  readonly draggable?: boolean;
  readonly className?: string;
  readonly onAddToMaybeboard?: (card: ScryfallCard) => void;
  readonly onAddToZone?: (card: ScryfallCard, zone: DeckZone) => void;
  readonly isInMaybeboard?: boolean;
}

function ListItemContent({
  card,
  onClick,
  onAddToMaybeboard: _onAddToMaybeboard,
  isInMaybeboard: _isInMaybeboard,
}: {
  readonly card: ScryfallCard;
  readonly onClick?: (card: ScryfallCard) => void;
  readonly onAddToMaybeboard?: (card: ScryfallCard) => void;
  readonly isInMaybeboard?: boolean;
}) {
  return (
    <motion.button
      type="button"
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2 rounded hover:bg-[var(--surface-hover)] group transition-colors cursor-pointer"
      )}
      onClick={() => onClick?.(card)}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <span className="flex-1 text-sm truncate text-[var(--text-primary)]">
        {card.name}
      </span>
      <CollectionBadge scryfallId={card.id} compact className="shrink-0" />
      <span className="text-xs text-[var(--text-secondary)] shrink-0">
        {card.cmc > 0 ? card.cmc : "—"}
      </span>

      {/* Add to deck */}
      <Plus className="w-3.5 h-3.5 text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
    </motion.button>
  );
}

export function CardSearchListItem({
  card,
  onClick,
  onAddToMaybeboard,
  onAddToZone,
  isInMaybeboard = false,
  draggable = false,
  className,
}: CardSearchListItemProps) {
  const row = (
    <ListItemContent
      card={card}
      onClick={onClick}
      onAddToMaybeboard={onAddToMaybeboard}
      isInMaybeboard={isInMaybeboard}
    />
  );
  const menu = onAddToZone ? (
    <div className="w-36 shrink-0 px-2">
      <SearchZoneMenu card={card} onAddToZone={onAddToZone} />
    </div>
  ) : null;

  if (draggable) {
    return (
      <div className={cn("flex items-center", className)}>
        <div className="min-w-0 flex-1">
          <DraggableCard card={card}>{row}</DraggableCard>
        </div>
        {menu}
      </div>
    );
  }
  return (
    <div className={cn("flex items-center", className)}>
      <div className="min-w-0 flex-1">{row}</div>
      {menu}
    </div>
  );
}
