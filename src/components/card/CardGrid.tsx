"use client";
// Grid display for search results
import { motion } from "framer-motion";
import { Bookmark } from "lucide-react";
import { CardImage } from "./CardImage";
import { DraggableCard } from "./DraggableCard";
import { cn } from "@/components/ui/utils";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { getCardImageUri } from "@/lib/scryfall/images";

interface CardGridProps {
  cards: ScryfallCard[];
  onCardClick?: (card: ScryfallCard) => void;
  onAddToMaybeboard?: (card: ScryfallCard) => void;
  maybeboardNames?: Set<string>;
  className?: string;
  emptyMessage?: string;
  draggable?: boolean;
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
  onAddToMaybeboard,
  maybeboardNames,
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
      {cards.map((card) => {
        const isInMaybeboard = maybeboardNames?.has(card.name) ?? false;
        return (
          <motion.div key={card.id} variants={itemVariants} className="relative group/gridcard">
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
            {/* Maybeboard badge */}
            {isInMaybeboard && (
              <div className="absolute top-1 right-1 z-10">
                <span className="text-[9px] px-1 py-0.5 rounded-full bg-amber-500/80 text-white font-medium shadow">
                  Maybe
                </span>
              </div>
            )}
            {/* Add to maybeboard button */}
            {onAddToMaybeboard && !isInMaybeboard && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToMaybeboard(card);
                }}
                className="absolute top-1 right-1 z-10 opacity-0 group-hover/gridcard:opacity-100 transition-opacity bg-amber-500/80 hover:bg-amber-500 text-white rounded-full w-5 h-5 flex items-center justify-center shadow"
                title="Add to Maybeboard"
              >
                <Bookmark className="w-3 h-3" />
              </button>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}
