"use client";
// Grid display for search results
import { RefObject } from "react";
import { motion } from "framer-motion";
import { CardImage } from "./CardImage";
import { DraggableCard } from "./DraggableCard";
import { cn } from "@/components/ui/utils";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { getCardImageUri } from "@/lib/scryfall/images";

interface CardGridProps {
  cards: ScryfallCard[];
  onCardClick?: (card: ScryfallCard) => void;
  className?: string;
  emptyMessage?: string;
  draggable?: boolean;
  /** Index of the keyboard-selected card (highlights it) */
  selectedIndex?: number;
  /** Ref attached to the selected card element for scroll-into-view */
  selectedRef?: RefObject<HTMLDivElement | null>;
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
  selectedIndex = -1,
  selectedRef,
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
      {cards.map((card, idx) => {
        const isSelected = idx === selectedIndex;
        return (
          <motion.div
            key={card.id}
            variants={itemVariants}
            className={cn(
              "relative rounded transition-all",
              isSelected && "ring-2 ring-[var(--accent)] ring-offset-1 ring-offset-[var(--background)]"
            )}
            ref={isSelected && selectedRef ? (selectedRef as RefObject<HTMLDivElement>) : undefined}
          >
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
          </motion.div>
        );
      })}
    </motion.div>
  );
}
