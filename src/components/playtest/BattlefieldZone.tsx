"use client";
import Image from "next/image";
import { RotateCcw } from "lucide-react";
import { cn } from "@/components/ui/utils";
import { CARD_BACK_URL } from "@/lib/scryfall/images";
import type { BattlefieldCard } from "@/lib/playtest/engine";

interface BattlefieldZoneProps {
  readonly battlefield: readonly BattlefieldCard[];
  readonly onTap: (cardId: string) => void;
  readonly onAddCounter: (cardId: string, amount: number) => void;
  readonly onRemove: (cardId: string) => void;
}

export function BattlefieldZone({
  battlefield,
  onTap,
  onAddCounter,
  onRemove,
}: BattlefieldZoneProps) {
  if (battlefield.length === 0) {
    return (
      <div className="bg-[var(--surface)] rounded-xl p-6 flex items-center justify-center">
        <p className="text-white/30 text-sm">No permanents in play</p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--surface)] rounded-xl p-4 space-y-3">
      <h3 className="text-white font-semibold text-sm">
        Battlefield ({battlefield.length})
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {battlefield.map((card) => (
          <div
            key={card.id}
            data-testid={`battlefield-card-${card.id}`}
            data-tapped={card.tapped ? "true" : "false"}
            className={cn(
              "relative bg-white/5 rounded-lg overflow-hidden border border-white/10 transition-all",
              card.tapped && "opacity-70 rotate-6"
            )}
          >
            {/* Card image */}
            <div className="relative aspect-[3/4] overflow-hidden">
              <Image
                src={card.imageUri || CARD_BACK_URL}
                alt={card.name}
                fill
                className="object-cover"
                unoptimized
              />
            </div>

            {/* Card info */}
            <div className="p-2 space-y-2">
              <p className="text-xs text-white font-medium truncate">
                {card.name}
              </p>

              {/* Counter display */}
              {card.counters > 0 && (
                <span className="inline-block px-2 py-0.5 bg-purple-600/30 text-purple-200 rounded text-xs font-bold">
                  +{card.counters}
                </span>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => onTap(card.id)}
                  aria-label={card.tapped ? "Untap" : "Tap"}
                  className="flex items-center gap-0.5 px-1.5 py-1 bg-white/10 hover:bg-white/20 rounded text-[10px] text-white/70 transition-colors"
                >
                  <RotateCcw size={10} />
                  {card.tapped ? "Untap" : "Tap"}
                </button>
                <button
                  type="button"
                  onClick={() => onAddCounter(card.id, 1)}
                  aria-label="+1"
                  className="px-1.5 py-1 bg-green-600/20 hover:bg-green-600/40 rounded text-[10px] text-green-300 transition-colors"
                >
                  +1
                </button>
                <button
                  type="button"
                  onClick={() => onAddCounter(card.id, -1)}
                  aria-label="-1 counter"
                  className="px-1.5 py-1 bg-red-600/20 hover:bg-red-600/40 rounded text-[10px] text-red-300 transition-colors"
                >
                  -1
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(card.id)}
                  aria-label="Remove"
                  className="px-1.5 py-1 bg-red-600/20 hover:bg-red-600/40 rounded text-[10px] text-red-300 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
