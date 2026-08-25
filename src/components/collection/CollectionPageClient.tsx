"use client";
// Collection page — lists all owned cards with stats
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Loader2,
  Package,
  Search,
  LayoutGrid,
  List,
  Trash2,
  Download,
  Copy,
  Check,
  Image as ImageIcon,
} from "lucide-react";
import { useCollectionStore } from "@/lib/collection/store";
import { AddToCollectionDialog } from "./AddToCollectionDialog";
import {
  formatCollectionCsv,
  formatCollectionText,
} from "@/lib/collection/shopping-list";
import { cn } from "@/components/ui/utils";
import type { CollectionCard } from "@/lib/collection/types";
import { CardImage } from "@/components/card/CardImage";
import { PrintingSelectorModal } from "@/components/card/PrintingSelectorModal";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { getCardImageUri } from "@/lib/scryfall/images";
import { CollectionCardTooltip } from "@/components/collection/CollectionCardTooltip";
import { formatUsd } from "@/lib/i18n/currency";

export function CollectionPageClient() {
  const locale = useLocale();
  const t = useTranslations("collection");
  const {
    collectionCards,
    collectionCardsFoil,
    isLoading,
    loadCollection,
    removeFromCollection,
    updateQuantity,
    swapPrinting,
  } = useCollectionStore();
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadCollection();
  }, [loadCollection]);

  const allCards = [
    ...Object.values(collectionCards),
    ...Object.values(collectionCardsFoil),
  ].sort((a, b) => a.name.localeCompare(b.name));

  const filtered = allCards.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCards = allCards.reduce((sum, c) => sum + c.quantity, 0);
  const totalValue = allCards.reduce(
    (sum, c) => sum + (c.price ?? 0) * c.quantity,
    0
  );

  const [copied, setCopied] = useState(false);
  const [printingsTarget, setPrintingsTarget] = useState<CollectionCard | null>(
    null
  );
  const [printingsCard, setPrintingsCard] = useState<ScryfallCard | null>(null);

  const exportCards = useMemo(
    () =>
      allCards.map((c) => ({
        name: c.name,
        quantity: c.quantity,
        foil: c.foil,
        condition: c.condition,
        price: c.price,
      })),
    [allCards]
  );

  const handleCopyText = useCallback(async () => {
    const text = formatCollectionText(exportCards);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }, [exportCards]);

  const handleExportCsv = useCallback(() => {
    const csv = formatCollectionCsv(exportCards);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-collection.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [exportCards]);

  const openPrintingsModal = useCallback(async (card: CollectionCard) => {
    try {
      const { getCardById } = await import("@/lib/scryfall/client");
      const scryfallCard = await getCardById(card.scryfallId);
      setPrintingsTarget(card);
      setPrintingsCard(scryfallCard);
    } catch {
      // If Scryfall lookup fails, do nothing (user can retry)
    }
  }, []);

  const handleSelectPrinting = useCallback(
    async (printing: ScryfallCard) => {
      if (!printingsTarget) return;
      await swapPrinting(printingsTarget.id, {
        scryfallId: printing.id,
        name: printing.name,
        imageUri: getCardImageUri(printing, "normal"),
        price: printing.prices?.usd
          ? Number.parseFloat(printing.prices.usd)
          : null,
      });
      setPrintingsCard(null);
      setPrintingsTarget(null);
    },
    [printingsTarget, swapPrinting]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center flex-1 text-[var(--text-secondary)]">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        {t("loading")}
      </div>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto p-6">
      {/* Printings modal */}
      {printingsCard && (
        <PrintingSelectorModal
          card={printingsCard}
          onSelect={handleSelectPrinting}
          onClose={() => {
            setPrintingsCard(null);
            setPrintingsTarget(null);
          }}
        />
      )}
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-[var(--accent-text)]" />
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              {t("title")}
            </h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {allCards.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors"
                  title={t("actions.copyText")}
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-green-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copied ? t("actions.copied") : t("actions.copy")}
                </button>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors"
                  title={t("actions.exportCsv")}
                >
                  <Download className="w-3.5 h-3.5" />
                  {t("actions.csv")}
                </button>
              </>
            )}
            <AddToCollectionDialog />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard
            label={t("stats.uniqueCards")}
            value={allCards.length.toString()}
          />
          <StatCard
            label={t("stats.totalCards")}
            value={totalCards.toString()}
          />
          <StatCard
            label={t("stats.totalValue")}
            value={formatUsd(locale, totalValue)}
            highlight
          />
        </div>

        {/* Search + view toggle */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-secondary)]"
            />
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 rounded transition-colors",
                viewMode === "grid"
                  ? "text-[var(--accent-text)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
              title={t("viewMode.gridView")}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2 rounded transition-colors",
                viewMode === "list"
                  ? "text-[var(--accent-text)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
              title={t("viewMode.listView")}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Cards */}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-[var(--text-secondary)] gap-3">
            <Package className="w-10 h-10 opacity-40" />
            {allCards.length === 0 ? (
              <>
                <p className="text-sm">{t("empty.title")}</p>
                <p className="text-xs opacity-70">{t("empty.hint")}</p>
              </>
            ) : (
              <p className="text-sm">{t("empty.noMatch")}</p>
            )}
          </div>
        )}
        {filtered.length > 0 && viewMode === "grid" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {filtered.map((card) => (
              <CollectionGridCard
                key={card.id}
                card={card}
                onRemove={removeFromCollection}
                onQuantityChange={updateQuantity}
                onOpenPrintings={openPrintingsModal}
              />
            ))}
          </div>
        )}
        {filtered.length > 0 && viewMode !== "grid" && (
          <div className="space-y-1">
            <div className="grid grid-cols-[1fr_80px_80px_80px_100px_40px] gap-2 px-3 py-1.5 text-xs text-[var(--text-secondary)] uppercase tracking-wide border-b border-[var(--border)]">
              <span>{t("listHeaders.card")}</span>
              <span>{t("listHeaders.qty")}</span>
              <span>{t("listHeaders.foil")}</span>
              <span>{t("listHeaders.condition")}</span>
              <span>{t("listHeaders.value")}</span>
              <span />
            </div>
            {filtered.map((card) => (
              <CollectionListRow
                key={card.id}
                card={card}
                locale={locale}
                onRemove={removeFromCollection}
                onQuantityChange={updateQuantity}
                onOpenPrintings={openPrintingsModal}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

// --- Sub-components ---

function StatCard({
  label,
  value,
  highlight,
}: {
  readonly label: string;
  readonly value: string;
  readonly highlight?: boolean;
}) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4">
      <p className="text-xs text-[var(--text-secondary)] mb-1">{label}</p>
      <p
        className={cn(
          "text-2xl font-bold",
          highlight ? "text-[var(--accent-text)]" : "text-[var(--text-primary)]"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function CollectionGridCard({
  card,
  onRemove,
  onQuantityChange,
  onOpenPrintings,
}: {
  readonly card: CollectionCard;
  readonly onRemove: (id: string) => void;
  readonly onQuantityChange: (id: string, qty: number) => void;
  readonly onOpenPrintings: (card: CollectionCard) => void;
}) {
  const t = useTranslations("collection");
  return (
    <div className="relative group/card">
      {card.imageUri ? (
        <CardImage
          imageUri={card.imageUri}
          name={card.name}
          className="w-full"
        />
      ) : (
        <div className="aspect-[488/680] bg-[var(--surface)] border border-[var(--border)] rounded-lg flex items-center justify-center">
          <p className="text-xs text-center text-[var(--text-secondary)] px-1">
            {card.name}
          </p>
        </div>
      )}
      {/* Quantity badge */}
      <div className="absolute top-1 right-1 bg-[var(--accent)] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg">
        {card.quantity}
      </div>
      {/* Foil badge */}
      {card.foil && (
        <div className="absolute top-1 left-1 bg-purple-500 text-white text-[10px] rounded px-1 shadow-lg">
          {t("foilBadge")}
        </div>
      )}
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/card:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center gap-2 p-2">
        <p className="text-white text-xs text-center font-medium leading-tight">
          {card.name}
        </p>
        <button
          type="button"
          onClick={() => {
            onOpenPrintings(card);
          }}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-white/15 hover:bg-white/25 text-white"
          title={t("actions.changeArt")}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          {t("actions.art")}
        </button>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() =>
              onQuantityChange(card.id, Math.max(0, card.quantity - 1))
            }
            className="w-6 h-6 rounded bg-white/20 hover:bg-white/40 text-white text-sm flex items-center justify-center"
          >
            −
          </button>
          <span className="text-white text-sm w-5 text-center">
            {card.quantity}
          </span>
          <button
            type="button"
            onClick={() => onQuantityChange(card.id, card.quantity + 1)}
            className="w-6 h-6 rounded bg-white/20 hover:bg-white/40 text-white text-sm flex items-center justify-center"
          >
            +
          </button>
        </div>
        <button
          type="button"
          onClick={() => onRemove(card.id)}
          className="text-red-400 hover:text-red-300 text-xs"
          aria-label={t("actions.removeFromCollection")}
        >
          {t("actions.remove")}
        </button>
      </div>
    </div>
  );
}

function CollectionListRow({
  card,
  locale,
  onRemove,
  onQuantityChange,
  onOpenPrintings,
}: {
  readonly card: CollectionCard;
  readonly locale: string;
  readonly onRemove: (id: string) => void;
  readonly onQuantityChange: (id: string, qty: number) => void;
  readonly onOpenPrintings: (card: CollectionCard) => void;
}) {
  const t = useTranslations("collection");
  const value =
    card.price === null || card.price === undefined
      ? "—"
      : formatUsd(locale, card.price * card.quantity);

  return (
    <div className="grid grid-cols-[1fr_80px_80px_80px_100px_40px] gap-2 px-3 py-2 rounded hover:bg-[var(--surface-hover)] items-center group">
      <div className="min-w-0 flex items-center gap-2">
        <CollectionCardTooltip card={card}>
          <span className="text-sm text-[var(--text-primary)] truncate cursor-default">
            {card.name}
          </span>
        </CollectionCardTooltip>
        <button
          type="button"
          onClick={() => {
            onOpenPrintings(card);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-[var(--surface)] border border-transparent hover:border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          title={t("actions.changeArt")}
          aria-label={t("actions.changeArtFor", { name: card.name })}
        >
          <ImageIcon className="w-3.5 h-3.5" />
        </button>
      </div>
      {/* Qty controls */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() =>
            onQuantityChange(card.id, Math.max(0, card.quantity - 1))
          }
          className="w-5 h-5 rounded bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs flex items-center justify-center"
        >
          −
        </button>
        <span className="text-sm text-[var(--text-primary)] w-5 text-center">
          {card.quantity}
        </span>
        <button
          type="button"
          onClick={() => onQuantityChange(card.id, card.quantity + 1)}
          className="w-5 h-5 rounded bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs flex items-center justify-center"
        >
          +
        </button>
      </div>
      <span className="text-sm text-[var(--text-secondary)]">
        {card.foil ? (
          <span className="text-purple-400 text-xs font-medium">
            ✨ {t("foilBadge")}
          </span>
        ) : (
          "—"
        )}
      </span>
      <span className="text-sm text-[var(--text-secondary)]">
        {card.condition ?? "—"}
      </span>
      <span className="text-sm text-[var(--text-secondary)]">{value}</span>
      <button
        type="button"
        onClick={() => onRemove(card.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-500/20 text-[var(--text-secondary)] hover:text-red-400"
        aria-label={t("actions.removeFromCollection")}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
