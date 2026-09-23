"use client";
import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Copy, Plus, RotateCcw } from "lucide-react";
import { cn } from "@/components/ui/utils";
import { CARD_BACK_URL } from "@/lib/scryfall/images";
import type { BattlefieldCard } from "@/lib/playtest/engine";
import { useLocalizeDeckCard } from "@/components/card/LocalizedDeckTextContext";
import type { TokenLibraryEntry } from "@/lib/deck/token-library";

interface BattlefieldZoneProps {
  readonly battlefield: readonly BattlefieldCard[];
  readonly onTap: (cardId: string) => void;
  readonly onAddCounter: (cardId: string, amount: number) => void;
  readonly onCreateCopy: (cardId: string) => void;
  readonly requiredTokens: readonly TokenLibraryEntry[];
  readonly onCreateToken: (token: TokenLibraryEntry) => void;
  readonly onRemove: (cardId: string) => void;
}

export function BattlefieldZone({
  battlefield,
  onTap,
  onAddCounter,
  onCreateCopy,
  requiredTokens,
  onCreateToken,
  onRemove,
}: BattlefieldZoneProps) {
  const t = useTranslations("playtest.battlefield");
  const localize = useLocalizeDeckCard();
  const [selectedTokenIndex, setSelectedTokenIndex] = useState(0);
  const selectedToken = requiredTokens[selectedTokenIndex];

  return (
    <div className="bg-[var(--surface)] rounded-xl p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-white font-semibold text-sm">
          {t("title", { count: battlefield.length })}
        </h3>
        {selectedToken && (
          <div className="flex items-center gap-2">
            <select
              value={selectedTokenIndex}
              onChange={(event) => setSelectedTokenIndex(Number(event.target.value))}
              aria-label={t("tokenChoice")}
              className="rounded-md border border-white/15 bg-black/30 px-2 py-1 text-xs text-white/80"
            >
              {requiredTokens.map((token, index) => (
                <option key={`${token.kind}-${token.name}-${token.power ?? ""}`} value={index}>
                  {[token.power, token.name].filter(Boolean).join(" ")}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => onCreateToken(selectedToken)}
              className="flex items-center gap-1 rounded-md bg-purple-500/15 px-2 py-1 text-xs text-purple-200 transition-colors hover:bg-purple-500/25"
            >
              <Plus size={12} aria-hidden="true" />
              {t("addToken")}
            </button>
          </div>
        )}
      </div>
      {battlefield.length === 0 ? (
        <p className="py-8 text-center text-sm text-white/30">{t("empty")}</p>
      ) : (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {battlefield.map((card) => {
          const view = localize(card);
          return (
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
                src={view.imageUri || CARD_BACK_URL}
                alt={view.name}
                fill
                className="object-cover"
                unoptimized
              />
            </div>

            {/* Card info */}
            <div className="p-2 space-y-2">
              <p className="text-xs text-white font-medium truncate">
                {view.name}
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
                  aria-label={card.tapped ? t("untap") : t("tap")}
                  className="flex items-center gap-0.5 px-1.5 py-1 bg-white/10 hover:bg-white/20 rounded text-[10px] text-white/70 transition-colors"
                >
                  <RotateCcw size={10} />
                  {card.tapped ? t("untap") : t("tap")}
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
                  onClick={() => onCreateCopy(card.id)}
                  aria-label={t("copy")}
                  className="flex items-center gap-0.5 px-1.5 py-1 bg-white/10 hover:bg-white/20 rounded text-[10px] text-white/70 transition-colors"
                >
                  <Copy size={10} aria-hidden="true" />
                  {t("copy")}
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(card.id)}
                  aria-label={t("remove")}
                  className="px-1.5 py-1 bg-red-600/20 hover:bg-red-600/40 rounded text-[10px] text-red-300 transition-colors"
                >
                  {t("remove")}
                </button>
              </div>
            </div>
          </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
