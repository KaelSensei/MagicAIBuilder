"use client";
/**
 * QuickAddCollectionButton — one-click add to collection from search results.
 * Shows a "+" when card is not owned, "Owned" when it is.
 */
import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Check } from "lucide-react";
import { useSession } from "next-auth/react";
import { useCollectionStore } from "@/lib/collection/store";
import { cn } from "@/components/ui/utils";
import type { ScryfallCard } from "@/lib/scryfall/types";

interface QuickAddCollectionButtonProps {
  readonly card: ScryfallCard;
  readonly className?: string;
}

export function QuickAddCollectionButton({
  card,
  className,
}: QuickAddCollectionButtonProps) {
  const t = useTranslations("collection.quickAdd");
  const { data: session } = useSession();
  const getTotalOwned = useCollectionStore((s) => s.getTotalOwned);
  const addToCollection = useCollectionStore((s) => s.addToCollection);
  const [justAdded, setJustAdded] = useState(false);

  const owned = getTotalOwned(card.id);

  const handleClick = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      await addToCollection({
        scryfallId: card.id,
        name: card.name,
        quantity: 1,
        price: card.prices?.usd ? Number.parseFloat(card.prices.usd) : null,
        imageUri: card.image_uris?.normal ?? "",
      });
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1200);
    },
    [card, addToCollection]
  );

  if (!session?.user) return null;

  if (owned > 0 || justAdded) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-0.5 text-[10px] font-medium text-green-400 bg-green-400/15 border border-green-400/30 rounded px-1.5 py-0.5",
          className
        )}
        title={t("owned", { count: owned })}
      >
        <Check className="w-2.5 h-2.5" />
        {justAdded ? t("added") : owned}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-0.5 text-[10px] font-medium text-[var(--accent)] bg-[var(--accent)]/10 border border-[var(--accent)]/30 rounded px-1.5 py-0.5 hover:bg-[var(--accent)]/20 transition-colors",
        className
      )}
      title={t("add")}
    >
      <Plus className="w-2.5 h-2.5" />
      Own
    </button>
  );
}
