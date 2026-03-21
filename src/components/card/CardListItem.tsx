"use client";
// Compact list view for deck cards
import { motion } from "framer-motion";
import { X, AlertTriangle, Zap, Layers, Plus, Minus, Crown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/components/ui/utils";
import type { DeckCard } from "@/lib/deck/types";
import { CardTooltip } from "@/components/card/CardTooltip";
import { DeckCardOwnershipBadge } from "@/components/collection/DeckCardOwnershipBadge";
import { PrintingSelectorModal } from "@/components/card/PrintingSelectorModal";
import { useDeckStore } from "@/lib/deck/store";
import { maxQuantity } from "@/lib/deck/multiples";
import type { ScryfallCard } from "@/lib/scryfall/types";

interface CardListItemProps {
  card: DeckCard;
  onRemove?: (id: string) => void;
  className?: string;
}

/** Convert a DeckCard back to a minimal ScryfallCard shape for the printing modal */
function deckCardToScryfall(card: DeckCard): ScryfallCard {
  return {
    id: card.scryfallId ?? card.id,
    name: card.name,
    mana_cost: card.manaCost,
    cmc: card.cmc,
    type_line: card.typeLine,
    oracle_text: card.oracleText,
    color_identity: card.colorIdentity,
    image_uris: card.imageUri ? { normal: card.imageUri, art_crop: card.artCropUri ?? card.imageUri } : undefined,
    prices: {},
    legalities: {},
    set: "",
    set_name: "",
    collector_number: "",
    rarity: "common",
    object: "card",
    lang: "en",
    released_at: "",
    uri: "",
    scryfall_uri: "",
    layout: "normal",
    highres_image: false,
    image_status: "lowres",
    keywords: [],
    games: [],
    reserved: false,
    foil: false,
    nonfoil: true,
    oversized: false,
    promo: false,
    reprint: false,
    variation: false,
    set_id: "",
    set_type: "",
    border_color: "black",
    frame: "2015",
    full_art: false,
    textless: false,
    booster: false,
    story_spotlight: false,
  } as ScryfallCard;
}

export function CardListItem({ card, onRemove, className }: CardListItemProps) {
  const [showPrintings, setShowPrintings] = useState(false);
  const swapCardPrinting = useDeckStore((s) => s.swapCardPrinting);
  const updateCardQuantity = useDeckStore((s) => s.updateCardQuantity);
  const promoteToCommander = useDeckStore((s) => s.promoteToCommander);
  const max = maxQuantity(card.name, card.typeLine);
  const canIncrement = card.quantity < max;
  const canDecrement = card.quantity > 1;

  const handleSelectPrinting = (printing: ScryfallCard) => {
    swapCardPrinting(card.id, printing);
    setShowPrintings(false);
  };

  return (
    <>
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
          {/* Quantity controls */}
          <div className="flex items-center gap-0.5 shrink-0">
            {canDecrement ? (
              <button
                onClick={(e) => { e.stopPropagation(); updateCardQuantity(card.id, -1); }}
                className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity w-4 h-4 flex items-center justify-center rounded text-[var(--text-secondary)] hover:text-[var(--accent)]"
                aria-label="Decrease quantity"
              >
                <Minus className="w-2.5 h-2.5" />
              </button>
            ) : (
              <span className="w-4" />
            )}
            <span className="text-xs text-[var(--text-secondary)] w-4 text-center">
              {card.quantity}
            </span>
            {canIncrement ? (
              <button
                onClick={(e) => { e.stopPropagation(); updateCardQuantity(card.id, 1); }}
                className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity w-4 h-4 flex items-center justify-center rounded text-[var(--text-secondary)] hover:text-[var(--accent)]"
                aria-label="Increase quantity"
              >
                <Plus className="w-2.5 h-2.5" />
              </button>
            ) : (
              <span className="w-4" />
            )}
          </div>

          {/* Card name */}
          <span className="flex-1 text-sm truncate text-[var(--text-primary)]">
            {card.name}
          </span>

          {/* Mana cost */}
          <span className="text-xs text-[var(--text-secondary)] shrink-0">
            {card.cmc > 0 ? card.cmc : "—"}
          </span>

          {/* Ownership badge */}
          <DeckCardOwnershipBadge scryfallId={card.scryfallId ?? card.id} />

          {/* Flags */}
          {card.isGameChanger && (
            <span title="Game Changer"><Zap className="w-3 h-3 text-amber-400" /></span>
          )}
          {card.isBanned && (
            <span title="Banned"><AlertTriangle className="w-3 h-3 text-red-500" /></span>
          )}

          {/* Set as commander button */}
          <button
            onClick={(e) => { e.stopPropagation(); promoteToCommander(card.id); }}
            className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity p-0.5 rounded text-[var(--text-secondary)] hover:text-yellow-400"
            aria-label={`Set ${card.name} as commander`}
            title="Set as commander"
          >
            <Crown className="w-3 h-3" />
          </button>

          {/* Edition picker button */}
          <button
            onClick={(e) => { e.stopPropagation(); setShowPrintings(true); }}
            className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity p-0.5 rounded text-[var(--text-secondary)] hover:text-[var(--accent)]"
            aria-label={`Change printing of ${card.name}`}
            title="Change edition"
          >
            <Layers className="w-3 h-3" />
          </button>

          {/* Remove button */}
          {onRemove && (
            <button
              onClick={() => onRemove(card.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-red-500/20 text-[var(--text-secondary)] hover:text-red-400"
              aria-label={`Remove ${card.name}`}
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </motion.div>
      </CardTooltip>

      {showPrintings && (
        <PrintingSelectorModal
          card={deckCardToScryfall(card)}
          onSelect={handleSelectPrinting}
          onClose={() => setShowPrintings(false)}
        />
      )}
    </>
  );
}
