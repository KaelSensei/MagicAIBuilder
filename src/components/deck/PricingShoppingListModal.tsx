"use client";
import { useState } from "react";
import { X, Download, Copy, Check } from "lucide-react";
import type { DeckCard } from "@/lib/deck/types";
import { generateShoppingListCSV } from "@/lib/deck/pricing";

interface ShoppingListModalProps {
  readonly isOpen: boolean;
  readonly deckName: string;
  readonly cards: readonly DeckCard[];
  readonly onClose: () => void;
}

export function PricingShoppingListModal({
  isOpen,
  deckName,
  cards,
  onClose,
}: ShoppingListModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Sort by total price descending (qty * unit price)
  const sortedCards = [...cards]
    .filter((c) => c.price !== null)
    .sort((a, b) => (b.price ?? 0) * b.quantity - (a.price ?? 0) * a.quantity);

  const cardsWithoutPrice = cards.filter((c) => c.price === null).length;
  const subtotal = sortedCards.reduce(
    (sum, c) => sum + (c.price ?? 0) * c.quantity,
    0
  );

  function handleDownloadCSV() {
    const csv = generateShoppingListCSV(cards);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${deckName.replaceAll(/\s+/g, "-").toLowerCase()}-shopping.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleCopy() {
    const lines = sortedCards.map(
      (c) =>
        `${c.quantity}x ${c.name} — €${((c.price ?? 0) * c.quantity).toFixed(2)}`
    );
    const text = lines.join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close shopping list modal"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <dialog
        open
        aria-labelledby="pricing-shopping-list-title"
        onCancel={(event) => {
          event.preventDefault();
          onClose();
        }}
        className="relative z-10 m-0 rounded-xl border-none bg-[var(--background)] p-0 shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2
            id="pricing-shopping-list-title"
            className="text-lg font-bold text-white"
          >
            Shopping List
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5 sticky top-0">
              <tr>
                <th className="text-left px-4 py-2 text-white/50 font-medium">
                  Card
                </th>
                <th className="text-center px-3 py-2 text-white/50 font-medium">
                  Qty
                </th>
                <th className="text-right px-3 py-2 text-white/50 font-medium">
                  Unit
                </th>
                <th className="text-right px-4 py-2 text-white/50 font-medium">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedCards.map((card) => (
                <tr
                  key={card.id}
                  className="border-t border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-2 text-white font-medium truncate max-w-[200px]">
                    {card.name}
                  </td>
                  <td className="px-3 py-2 text-center text-white/60">
                    {card.quantity}
                  </td>
                  <td className="px-3 py-2 text-right text-white/60">
                    €{(card.price ?? 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-right text-white font-semibold">
                    €{((card.price ?? 0) * card.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 p-4 space-y-3">
          {cardsWithoutPrice > 0 && (
            <p className="text-xs text-white/40">
              {cardsWithoutPrice} card{cardsWithoutPrice > 1 ? "s" : ""} —
              unknown price (excluded)
            </p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-white font-bold">
              Subtotal: €{subtotal.toFixed(2)}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopy}
                aria-label="Copy"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs text-white transition-colors"
              >
                {copied ? (
                  <Check size={14} className="text-green-400" />
                ) : (
                  <Copy size={14} />
                )}
                {copied ? "Copied!" : "Copy"}
              </button>
              <button
                type="button"
                onClick={handleDownloadCSV}
                aria-label="Download CSV"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 rounded-lg text-xs font-medium transition-colors"
              >
                <Download size={14} />
                Download CSV
              </button>
            </div>
          </div>
        </div>
      </dialog>
    </div>
  );
}
