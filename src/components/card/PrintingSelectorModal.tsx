"use client";
// Modal to select a card printing — shows oracle text alongside all printings
import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import Image from "next/image";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { useCardPrintings } from "@/hooks/useCardPrintings";
import { getCardImageUri } from "@/lib/scryfall/images";
import { Modal } from "@/components/ui/Modal";

function getPrintingsLabel(count: number): string {
  return `${count} printing${count === 1 ? "" : "s"} available`;
}

interface PrintingSelectorModalProps {
  readonly card: ScryfallCard;
  readonly onSelect: (card: ScryfallCard) => void;
  readonly onClose: () => void;
}

import { ManaCostDisplay } from "./ManaSymbol";

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
    <Modal
      open
      onClose={onClose}
      maxWidth="max-w-5xl"
      showClose={false}
      className="max-h-[90vh] flex flex-col"
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
        <div className="w-64 shrink-0 border-r border-(--border) p-4 flex flex-col gap-3 overflow-y-auto">
          {manaCost && (
            <div>
              <ManaCostDisplay manaCost={manaCost} />
            </div>
          )}
          <p className="text-xs font-medium text-(--text-primary) italic border-b border-(--border) pb-2">
            {typeLine}
          </p>

          {oracleText ? (
            <p className="text-xs text-(--text-secondary) leading-relaxed whitespace-pre-line">
              {oracleText}
            </p>
          ) : (
            <p className="text-xs text-(--text-secondary) italic opacity-50">No text</p>
          )}

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
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-4">
              {printings.map((printing) => (
                <div key={printing.id} className="flex flex-col gap-1.5">
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
                      boxShadow: hovered === printing.id ? "0 0 12px var(--accent)40" : "none",
                    }}
                  >
                    <Image
                      src={getCardImageUri(printing, "normal")}
                      alt={`${printing.name} — ${printing.set_name}`}
                      width={220}
                      height={308}
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
    </Modal>
  );
}
