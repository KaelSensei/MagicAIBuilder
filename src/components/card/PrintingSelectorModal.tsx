"use client";
// Modal to select a card printing — shows oracle text alongside all printings
import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { useCardPrintings } from "@/hooks/useCardPrintings";
import { getCardImageUri } from "@/lib/scryfall/images";

function getPrintingsLabel(count: number): string {
  return `${count} printing${count !== 1 ? "s" : ""} available`;
}

interface PrintingSelectorModalProps {
  readonly card: ScryfallCard;
  readonly onSelect: (card: ScryfallCard) => void;
  readonly onClose: () => void;
}

/** Render a raw mana cost string like "{2}{U}{B}" with thin spans */
function ManaCost({ cost }: { cost: string }) {
  const tokens = cost.match(/\{[^}]+\}|[^{]+/g) ?? [cost];
  return (
    <span className="font-mono text-xs text-(--text-secondary) tracking-wider">
      {tokens.join(" ").replaceAll(/[{}]/g, "")}
    </span>
  );
}

export function PrintingSelectorModal({ card, onSelect, onClose }: PrintingSelectorModalProps) {
  const { data, isLoading } = useCardPrintings(card.name);
  const [hovered, setHovered] = useState<string | null>(null);

  const printings = data?.data ?? [card];

  // Resolve oracle text — handle double-faced cards
  const face = card.card_faces?.[0];
  const manaCost = face?.mana_cost ?? card.mana_cost ?? "";
  const typeLine = face?.type_line ?? card.type_line ?? "";
  const oracleText = face?.oracle_text ?? card.oracle_text ?? "";

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-(--surface) border border-(--border) rounded-xl shadow-2xl w-full max-w-3xl mx-4 max-h-[85vh] flex flex-col"
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-(--border) shrink-0">
            <div>
              <h2 className="text-base font-semibold text-(--text-primary)">{card.name}</h2>
              <p className="text-xs text-(--text-secondary) mt-0.5">
                {isLoading ? "Loading printings…" : getPrintingsLabel(printings.length)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-(--text-secondary) hover:text-(--text-primary) transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body: two columns */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left — Oracle text */}
            <div className="w-56 shrink-0 border-r border-(--border) p-4 flex flex-col gap-3 overflow-y-auto">
              {/* Mana cost + type */}
              {manaCost && (
                <div>
                  <ManaCost cost={manaCost} />
                </div>
              )}
              <p className="text-xs font-medium text-(--text-primary) italic border-b border-(--border) pb-2">
                {typeLine}
              </p>

              {/* Oracle text */}
              {oracleText ? (
                <p className="text-xs text-(--text-secondary) leading-relaxed whitespace-pre-line">
                  {oracleText}
                </p>
              ) : (
                <p className="text-xs text-(--text-secondary) italic opacity-50">No text</p>
              )}

              {/* Price */}
              {card.prices?.usd && (
                <p className="text-xs text-(--accent) mt-auto pt-2 border-t border-(--border)">
                  ${card.prices.usd}
                </p>
              )}
            </div>

            {/* Right — Printings grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="w-6 h-6 animate-spin text-(--accent)" />
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {printings.map((printing) => (
                    <div key={printing.id} className="flex flex-col gap-1">
                      <button
                        onClick={() => {
                          onSelect(printing);
                          onClose();
                        }}
                        onMouseEnter={() => setHovered(printing.id)}
                        onMouseLeave={() => setHovered(null)}
                        className="relative rounded-[4.75%] overflow-hidden border-2 transition-all focus:outline-none"
                        style={{
                          borderColor:
                            hovered === printing.id ? "var(--accent)" : "transparent",
                          transform: hovered === printing.id ? "scale(1.04)" : "scale(1)",
                        }}
                      >
                        <Image
                          src={getCardImageUri(printing, "normal")}
                          alt={`${printing.name} — ${printing.set_name}`}
                          width={150}
                          height={209}
                          className="block w-full h-auto"
                          unoptimized
                        />
                      </button>
                      <p className="text-[10px] text-(--text-secondary) text-center truncate uppercase tracking-wide">
                        {printing.set}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
