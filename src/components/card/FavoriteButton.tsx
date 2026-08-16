"use client";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("card.favorite");

  return (
    <button
      type="button"
      onClick={() => onToggle(scryfallId)}
      aria-label={isFavorited ? t("remove") : t("add")}
      aria-pressed={isFavorited}
      className={cn(
        "p-1.5 rounded-full transition-colors",
        isFavorited
          ? "text-red-400 hover:text-red-300 bg-red-400/10 hover:bg-red-400/20"
          : "text-white/40 hover:text-red-400 hover:bg-red-400/10",
        className
      )}
    >
      <Heart size={size} className={cn(isFavorited && "fill-current")} />
    </button>
  );
}
