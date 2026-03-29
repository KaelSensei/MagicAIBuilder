"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { DeckCard } from "@/lib/deck/types";
import type { CardZone } from "@/lib/playtest/engine";

interface GraveyardZoneProps {
  readonly graveyard: readonly DeckCard[];
  readonly exile: readonly DeckCard[];
  readonly onRestore: (cardId: string, from: CardZone, to: CardZone) => void;
}

interface ZoneListProps {
  readonly label: string;
  readonly cards: readonly DeckCard[];
  readonly zone: "graveyard" | "exile";
  readonly onRestore: (cardId: string, from: CardZone, to: CardZone) => void;
}

function ZoneList({ label, cards, zone, onRestore }: ZoneListProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-2">
      {/* Header toggle */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between py-1.5 px-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
        aria-label={label}
      >
        <span className="text-sm font-medium text-white/70">
          {label}: {cards.length} {cards.length === 1 ? "card" : "cards"}
        </span>
        {isOpen ? <ChevronUp size={14} className="text-white/40" /> : <ChevronDown size={14} className="text-white/40" />}
      </button>

      {/* Card list */}
      {isOpen && (
        <div className="space-y-1 max-h-48 overflow-y-auto pl-2">
          {cards.length === 0 ? (
            <p className="text-xs text-white/30 py-2">
              {zone === "graveyard" ? "Graveyard is empty" : "Exile is empty"}
            </p>
          ) : (
            [...cards].reverse().map((card) => (
              <div
                key={card.id}
                className="flex items-center justify-between gap-2 py-1.5 px-2 bg-white/5 rounded"
              >
                <span className="text-xs text-white truncate">{card.name}</span>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => onRestore(card.id, zone, "hand")}
                    className="px-2 py-0.5 text-[10px] bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 rounded transition-colors whitespace-nowrap"
                  >
                    Restore to hand
                  </button>
                  <button
                    onClick={() => onRestore(card.id, zone, "battlefield")}
                    className="px-2 py-0.5 text-[10px] bg-green-600/20 hover:bg-green-600/40 text-green-300 rounded transition-colors whitespace-nowrap"
                  >
                    → Play
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function GraveyardZone({ graveyard, exile, onRestore }: GraveyardZoneProps) {
  return (
    <div className="bg-[var(--surface)] rounded-xl p-4 space-y-3">
      <ZoneList label="Graveyard" cards={graveyard} zone="graveyard" onRestore={onRestore} />
      <ZoneList label="Exile" cards={exile} zone="exile" onRestore={onRestore} />
    </div>
  );
}
