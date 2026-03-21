"use client";
// Grid display for search results
import { motion } from "framer-motion";
import { CardImage } from "./CardImage";
import { DraggableCard } from "./DraggableCard";
import { cn } from "@/components/ui/utils";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { getCardImageUri } from "@/lib/scryfall/images";
import { CollectionBadge } from "@/components/collection/CollectionBadge";

interface CardGridProps {
  readonly cards: readonly ScryfallCard[];
  readonly onCardClick?: (card: ScryfallCard) => void;
  readonly className?: string;
  readonly emptyMessage?: string;
  readonly draggable?: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export function CardGrid({
  cards,
  onCardClick,
  className,
  emptyMessage = "No cards found",
  draggable = false,
}: CardGridProps) {
  if (cards.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-40 text-[var(--text-secondary)]", className)}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <motion.div
      className={cn("grid grid-cols-3 gap-2 p-2", className)}
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {cards.map((card) => (
        <motion.div key={card.id} variants={itemVariants} className="relative">
          {draggable ? (
            <DraggableCard card={card}>
              <CardImage
                imageUri={getCardImageUri(card, "normal")}
                largeUri={getCardImageUri(card, "large")}
                name={card.name}
                manaCost={card.mana_cost}
                cmc={card.cmc}
                showOverlay={true}
                onClick={() => onCardClick?.(card)}
              />
            </DraggableCard>
          ) : (
            <CardImage
              imageUri={getCardImageUri(card, "normal")}
              largeUri={getCardImageUri(card, "large")}
              name={card.name}
              manaCost={card.mana_cost}
              cmc={card.cmc}
              showOverlay={true}
              onClick={() => onCardClick?.(card)}
            />
          )}
          <CollectionBadge
            scryfallId={card.id}
            compact
            className="absolute bottom-6 left-1 z-10"
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
