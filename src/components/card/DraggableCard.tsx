"use client";
// Draggable wrapper for search result cards using dnd-kit
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { ScryfallCard } from "@/lib/scryfall/types";

interface DraggableCardProps {
  card: ScryfallCard;
  children: React.ReactNode;
}

export function DraggableCard({ card, children }: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `search-${card.id}`,
      data: { card, source: "search" },
    });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? "grabbing" : "grab",
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </div>
  );
}
