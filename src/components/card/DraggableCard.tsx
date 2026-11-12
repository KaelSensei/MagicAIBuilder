"use client";
// Draggable wrapper for search result cards using dnd-kit
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { ScryfallCard } from "@/lib/scryfall/types";

interface DraggableCardProps {
  readonly card: ScryfallCard;
  readonly children: React.ReactNode;
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

  // dnd-kit makes this wrapper a `role="button"` drag handle. Its name is the card's name:
  // left unnamed, it borrows the name of its content, and a grid result whose image is the
  // "Add <card> to deck" button would then announce two buttons with that name.
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} aria-label={card.name}>
      {children}
    </div>
  );
}
