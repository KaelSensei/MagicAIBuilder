"use client";
// Modal to select a card printing/illustration from all available versions
import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { useCardPrintings } from "@/hooks/useCardPrintings";
import { getCardImageUri } from "@/lib/scryfall/images";

interface PrintingSelectorModalProps {
  card: ScryfallCard;
  onSelect: (card: ScryfallCard) => void;
  onClose: () => void;
}

export function PrintingSelectorModal({ card, onSelect, onClose }: PrintingSelectorModalProps) {
  const { data, isLoading } = useCardPrintings(card.name);
  const [hovered, setHovered] = useState<string | null>(null);

  const printings = data?.data ?? [card];

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
          className="bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col"
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0">
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">{card.name}</h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                {isLoading ? "Loading printings…" : `${printings.length} printing${printings.length !== 1 ? "s" : ""} available`}
              </p>
            </div>
            <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                {printings.map((printing) => (
                  <div key={printing.id} className="flex flex-col gap-1">
                    <button
                      onClick={() => { onSelect(printing); onClose(); }}
                      onMouseEnter={() => setHovered(printing.id)}
                      onMouseLeave={() => setHovered(null)}
                      className="relative rounded-[4.75%] overflow-hidden border-2 transition-all focus:outline-none"
                      style={{
                        borderColor: hovered === printing.id ? "var(--accent)" : "transparent",
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
                    <p className="text-[10px] text-[var(--text-secondary)] text-center truncate uppercase tracking-wide">
                      {printing.set}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
