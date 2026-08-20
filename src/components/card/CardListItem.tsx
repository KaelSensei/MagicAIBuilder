"use client";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { X, AlertTriangle, Zap, Bookmark, RefreshCw } from "lucide-react";
import { useState } from "react";
import { cn } from "@/components/ui/utils";
import type { DeckCard } from "@/lib/deck/types";
import { CardTooltip } from "@/components/card/CardTooltip";
import { useLocalizedDeckName } from "@/components/card/LocalizedDeckTextContext";
interface CardListItemProps {
  readonly card: DeckCard;
  readonly onRemove?: (id: string) => void;
  readonly onMoveToMaybeboard?: (id: string) => void;
  readonly className?: string;
  readonly showNotes?: boolean;
}
function TurnOverButton({
  isFlipped,
  frontName,
  backName,
  onFlip,
}: {
  readonly isFlipped: boolean;
  readonly frontName: string;
  readonly backName: string;
  readonly onFlip: (e: React.MouseEvent) => void;
}) {
  const t = useTranslations("card");
  const label = isFlipped
    ? t("showFront", { name: frontName })
    : t("turnOverTo", { name: backName });

  return (
    <button
      type="button"
      onClick={onFlip}
      aria-label={label}
      title={label}
      className={cn(
        "shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors text-[10px] leading-none opacity-0 group-hover:opacity-100"
      )}
    >
      <RefreshCw
        className={cn(
          "w-2.5 h-2.5 transition-transform duration-300",
          isFlipped && "rotate-180"
        )}
      />
      <span>{t("turnOver")}</span>
    </button>
  );
}
function DfcBadge({ isFlexibleLand }: { readonly isFlexibleLand: boolean }) {
  const t = useTranslations("card");

  return (
    <span
      className={cn(
        "shrink-0 text-[9px] font-bold leading-none px-1 py-0.5 rounded",
        isFlexibleLand
          ? "bg-emerald-600/20 text-emerald-400"
          : "bg-[var(--surface-hover)] text-[var(--text-secondary)]"
      )}
      title={isFlexibleLand ? t("flexibleLand") : t("doubleFaced")}
    >
      {isFlexibleLand ? "△▽ LAND" : "△▽"}
    </span>
  );
}
export function CardListItem({
  card,
  onRemove,
  onMoveToMaybeboard,
  className,
  showNotes: _showNotes,
}: CardListItemProps) {
  const t = useTranslations("card");
  const tBuilder = useTranslations("builder");
  const [isFlipped, setIsFlipped] = useState(false);
  const isDfc = Boolean(card.cardFaces);
  // Translated front name only: the batch resolves the front face, and the
  // back face is read straight from the English snapshot on flip.
  const localizedName = useLocalizedDeckName(card.name);
  const activeName =
    isDfc && isFlipped ? (card.cardFaces?.[1].name ?? card.name) : localizedName;
  const flip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFlipped((p) => !p);
  };
  return (
    <CardTooltip card={card}>
      <motion.div
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[var(--surface-hover)] group transition-colors",
          className
        )}
        layout
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
      >
        <span className="text-xs text-[var(--text-secondary)] w-4 text-center shrink-0">
          {card.quantity}
        </span>
        {isDfc && <DfcBadge isFlexibleLand={card.isFlexibleLand ?? false} />}
        <span className="flex-1 text-sm truncate text-[var(--text-primary)]">
          {activeName}
        </span>
        <span className="text-xs text-[var(--text-secondary)] shrink-0">
          {card.cmc > 0 ? card.cmc : "—"}
        </span>
        {card.price !== null && (
          <span
            className="shrink-0 text-[10px] font-medium px-1 py-0.5 rounded bg-emerald-600/20 text-emerald-400 leading-none"
            title={`Price: $${card.price.toFixed(2)}`}
          >
            ${card.price.toFixed(2)}
          </span>
        )}
        {card.isGameChanger && (
          <span title={t("gameChanger")}>
            <Zap className="w-3 h-3 text-amber-400" />
          </span>
        )}
        {card.isBanned && (
          <span title={t("banned")}>
            <AlertTriangle className="w-3 h-3 text-red-500" />
          </span>
        )}
        {isDfc && card.cardFaces && (
          <TurnOverButton
            isFlipped={isFlipped}
            frontName={card.cardFaces[0].name}
            backName={card.cardFaces[1].name}
            onFlip={flip}
          />
        )}
        {onMoveToMaybeboard && (
          <button
            type="button"
            onClick={() => onMoveToMaybeboard(card.id)}
            className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity p-0.5 rounded hover:bg-amber-500/20 text-[var(--text-secondary)] hover:text-amber-400"
            aria-label={t("moveNamedToMaybeboard", { name: card.name })}
            title={tBuilder("zoneMoveTargets.toMaybeboard")}
          >
            <Bookmark className="w-3 h-3" />
          </button>
        )}
        {onRemove && (
          <button
            type="button"
            onClick={() => onRemove(card.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-red-500/20 text-[var(--text-secondary)] hover:text-red-400"
            aria-label={t("removeNamed", { name: card.name })}
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </motion.div>
    </CardTooltip>
  );
}
