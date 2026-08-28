"use client";
/**
 * ShoppingListModal — lists all missing cards with prices, copy/export.
 */
import { useMemo } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { X, Copy, Download, Check } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import type { Deck } from "@/lib/deck/types";
import {
  buildShoppingList,
  formatShoppingListText,
  formatShoppingListCsv,
} from "@/lib/collection/shopping-list";
import type { ShoppingListItem } from "@/lib/collection/shopping-list";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";

interface ShoppingListModalProps {
  readonly deck: Deck;
  readonly ownedScryfallIds: ReadonlySet<string>;
  readonly onClose: () => void;
}

function downloadFile(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ShoppingListModal({
  deck,
  ownedScryfallIds,
  onClose,
}: ShoppingListModalProps) {
  const t = useTranslations("deck");
  const format = useFormatter();
  const [copied, copy] = useCopyToClipboard();

  // USD, like every other price surface — see BudgetOptimizationModal.
  const money = (value: number) =>
    format.number(value, { style: "currency", currency: "USD" });

  const items = useMemo(
    () =>
      buildShoppingList(
        deck.cards,
        deck.commander,
        deck.partner,
        ownedScryfallIds
      ),
    [deck.cards, deck.commander, deck.partner, ownedScryfallIds]
  );

  const totalCost = useMemo(
    () =>
      items.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0),
    [items]
  );

  const unknownPriceCount = items.filter((item) => item.price === null).length;

  const handleCopy = () => {
    const text = formatShoppingListText(items);
    void copy(text);
  };

  const handleExportCsv = () => {
    const csv = formatShoppingListCsv(items);
    const deckSlug = deck.name.replaceAll(/[^a-z0-9]/gi, "_").toLowerCase();
    downloadFile(csv, `${deckSlug}-shopping.csv`, "text/csv");
  };

  return (
    <Dialog.Root
      open
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[520px] max-w-[92vw] max-h-[85vh] bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
            <Dialog.Title className="text-base font-semibold text-[var(--text-primary)]">
              {t("buyList.title", { count: items.length })}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="p-1.5 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            {t("buyList.description")}
          </Dialog.Description>

          {/* Card list */}
          <div className="flex-1 overflow-y-auto px-5 py-3">
            {items.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)] text-center py-8">
                {t("buyList.ownAll")}
              </p>
            ) : (
              <div className="space-y-1">
                {items.map((item) => (
                  <ShoppingRow key={item.scryfallId} item={item} money={money} />
                ))}
              </div>
            )}
          </div>

          {/* Footer — totals + actions */}
          <div className="border-t border-[var(--border)] px-5 py-3 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--text-secondary)]">
                {t("buyList.totalToBuy")}
                {unknownPriceCount > 0 && (
                  <span className="text-[10px] ml-1 text-amber-400">
                    {t("buyList.withoutPrice", { count: unknownPriceCount })}
                  </span>
                )}
              </span>
              <span className="font-semibold text-[var(--text-primary)]">
                {t("buyList.approx", { amount: money(totalCost) })}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                disabled={items.length === 0}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border border-[var(--border)] hover:border-[var(--accent)] text-sm text-[var(--text-primary)] transition-colors disabled:opacity-40"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-green-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copied ? t("buyList.copied") : t("buyList.copy")}
              </button>
              <button
                type="button"
                onClick={handleExportCsv}
                disabled={items.length === 0}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium transition-colors disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5" />
                {t("buyList.exportCsv")}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ShoppingRow({
  item,
  money,
}: {
  readonly item: ShoppingListItem;
  readonly money: (value: number) => string;
}) {
  const lineTotal = item.price === null ? null : item.price * item.quantity;

  return (
    <div className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-[var(--surface-hover)] transition-colors">
      <span className="text-xs text-[var(--text-secondary)] w-5 text-center shrink-0">
        {item.quantity}×
      </span>
      <span className="flex-1 text-sm text-[var(--text-primary)] truncate">
        {item.name}
      </span>
      <span className="text-xs text-[var(--text-secondary)] shrink-0 tabular-nums">
        {item.price === null ? "—" : money(item.price)}
      </span>
      {typeof lineTotal === "number" && item.quantity > 1 ? (
        <span className="text-[10px] text-[var(--text-secondary)] shrink-0 tabular-nums w-14 text-right">
          ({money(lineTotal)})
        </span>
      ) : null}
    </div>
  );
}
