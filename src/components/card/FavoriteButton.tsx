"use client";
import { Heart } from "lucide-react";
import { cn } from "@/components/ui/utils";

interface FavoriteButtonProps {
  readonly scryfallId: string;
  readonly isFavorited: boolean;
  readonly onToggle: (scryfallId: string) => void;
  readonly size?: number;
  readonly className?: string;
}

export function FavoriteButton({
  scryfallId,
  isFavorited,
  onToggle,
  size = 16,
  className,
}: FavoriteButtonProps) {
  return (
    <button
      onClick={() => onToggle(scryfallId)}
      aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={isFavorited}
      className={cn(
        "p-1.5 rounded-full transition-colors",
        isFavorited
          ? "text-red-400 hover:text-red-300 bg-red-400/10 hover:bg-red-400/20"
          : "text-white/40 hover:text-red-400 hover:bg-red-400/10",
        className
      )}
    >
      <Heart
        size={size}
        className={cn(isFavorited && "fill-current")}
      />
    </button>
  );
}
