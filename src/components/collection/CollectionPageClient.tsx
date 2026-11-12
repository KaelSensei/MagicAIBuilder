"use client";
// Collection page — lists all owned cards with stats
import { useCallback, useEffect, useMemo, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
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
  AlertTriangle,
  RefreshCw,
  Image as ImageIcon,
} from "lucide-react";
import { useCollectionStore } from "@/lib/collection/store";
import { AddToCollectionDialog } from "./AddToCollectionDialog";
import { formatCollectionText } from "@/lib/collection/shopping-list";
import { formatCollectionPrintingCsv } from "@/lib/collection/printing-csv";
import { downloadTextFile } from "@/lib/download-text-file";
import { Button } from "@/components/ui/Button";
import { cardSurfaceClassName } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { cn } from "@/components/ui/utils";
import type { CollectionCard } from "@/lib/collection/types";
import { CardImage } from "@/components/card/CardImage";
import { PrintingSelectorModal } from "@/components/card/PrintingSelectorModal";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { getCardImageUri } from "@/lib/scryfall/images";
import { CollectionCardTooltip } from "@/components/collection/CollectionCardTooltip";
import { CollectionQuantityControl } from "@/components/collection/CollectionQuantityControl";
import { AcquisitionPlanPanel } from "@/components/collection/AcquisitionPlanPanel";
import { PrintingDeckUsage } from "@/components/collection/PrintingDeckUsage";

function CollectionLoadNotice({ onRetry }: { readonly onRetry: () => Promise<void> }) {
  const t = useTranslations("collection");
  return (
    <div role="alert" className={cn(cardSurfaceClassName, "flex flex-wrap items-center gap-3 border-amber-500/30 p-4 text-sm")}>
      <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" aria-hidden="true" />
      <span>{t("loadFailed")}</span>
      <Button type="button" variant="secondary" size="sm" onClick={() => void onRetry()}>
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        {t("retry")}
      </Button>
    </div>
  );
}

export function CollectionPageClient() {
  const t = useTranslations("collection");
  const format = useFormatter();
  const {
    collectionCards,
    collectionCardsFoil,
    isLoading,
    loadError,
    loadCollection,
    removeFromCollection,
    updateQuantity,
    swapPrinting,
  } = useCollectionStore();
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    void loadCollection();
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
        scryfallId: c.scryfallId,
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
    const csv = formatCollectionPrintingCsv(exportCards);
    downloadTextFile(csv, "my-collection.csv", "text/csv;charset=utf-8;");
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
        imageUri: getCardImageUri(printing, "grid"),
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

  if (loadError && allCards.length === 0) {
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <CollectionLoadNotice onRetry={loadCollection} />
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
      {loadError && (
        <div className="mx-auto mb-6 max-w-6xl">
          <CollectionLoadNotice onRetry={loadCollection} />
        </div>
      )}
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
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-[var(--accent-text)]" />
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
              {t("title")}
            </h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {allCards.length > 0 && (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleCopyText}
                  title={t("actions.copyText")}
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-green-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copied ? t("actions.copied") : t("actions.copy")}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleExportCsv}
                  title={t("actions.exportCsv")}
                >
                  <Download className="w-3.5 h-3.5" />
                  {t("actions.csv")}
                </Button>
              </>
            )}
            <AddToCollectionDialog />
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
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
            value={format.number(totalValue, {
              style: "currency",
              currency: "USD",
            })}
            highlight
          />
        </div>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div>
        {/* Search + view toggle */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
            <Input
              type="text"
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10"
            />
          </div>
          <div className="ml-auto flex items-center gap-1 rounded-[var(--lumen-radius-pill)] border border-[var(--border)] bg-[var(--background)] p-1">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              aria-pressed={viewMode === "grid"}
              className={cn(
                "rounded-[var(--lumen-radius-pill)] p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
                viewMode === "grid"
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
              title={t("viewMode.gridView")}
              aria-label={t("viewMode.gridView")}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              aria-pressed={viewMode === "list"}
              className={cn(
                "rounded-[var(--lumen-radius-pill)] p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
                viewMode === "list"
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
              title={t("viewMode.listView")}
              aria-label={t("viewMode.listView")}
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
          <div className={cn(cardSurfaceClassName, "overflow-x-auto")}>
            <div className="min-w-[40rem] space-y-1">
              <div className="grid grid-cols-[1fr_120px_80px_80px_100px_40px] gap-2 border-b border-[var(--border)] px-3 py-2 text-xs tracking-wide text-[var(--text-secondary)] uppercase">
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
                  onRemove={removeFromCollection}
                  onQuantityChange={updateQuantity}
                  onOpenPrintings={openPrintingsModal}
                />
              ))}
            </div>
          </div>
        )}
        </div>
        <AcquisitionPlanPanel />
        </div>
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
    <div className={cn(cardSurfaceClassName, "p-4")}>
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
  const handleQuantityChange = useCallback(
    (quantity: number) => onQuantityChange(card.id, quantity),
    [card.id, onQuantityChange]
  );
  return (
    <div>
    <div className="relative group/card">
      {card.imageUri ? (
        <CardImage
          imageUri={card.imageUri}
          name={card.name}
          className="w-full"
        />
      ) : (
        <div className="flex aspect-[488/680] items-center justify-center rounded-[var(--lumen-radius-lg)] border border-[var(--border)] bg-[var(--surface)]">
          <p className="text-xs text-center text-[var(--text-secondary)] px-1">
            {card.name}
          </p>
        </div>
      )}
      {/* Quantity badge */}
      <div className="absolute top-1 right-1 flex h-5 min-w-5 items-center justify-center rounded-[var(--lumen-radius-pill)] bg-[var(--accent)] px-1 text-xs font-bold text-white shadow-[var(--lumen-shadow-sm)]">
        {card.quantity}
      </div>
      {/* Foil badge */}
      {card.foil && (
        <div className="absolute top-1 left-1 rounded-[var(--lumen-radius-pill)] bg-[var(--accent)] px-1.5 text-[10px] text-white shadow-[var(--lumen-shadow-sm)]">
          {t("foilBadge")}
        </div>
      )}
      {/* Hover overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-[var(--lumen-radius-lg)] bg-black/60 p-2 opacity-0 transition-opacity group-hover/card:opacity-100 focus-within:opacity-100">
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
        <PrintingDeckUsage
          scryfallId={card.scryfallId}
          cardName={card.name}
          compact
        />
        <CollectionQuantityControl
          cardName={card.name}
          quantity={card.quantity}
          onQuantityChange={handleQuantityChange}
        />
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
    <p className="mt-2 truncate text-xs font-medium text-[var(--text-primary)]">{card.name}</p>
    </div>
  );
}

function CollectionListRow({
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
  const format = useFormatter();
  const handleQuantityChange = useCallback(
    (quantity: number) => onQuantityChange(card.id, quantity),
    [card.id, onQuantityChange]
  );
  const value =
    card.price === null || card.price === undefined
      ? "—"
      : format.number(card.price * card.quantity, {
          style: "currency",
          currency: "USD",
        });

  return (
    <div className="grid grid-cols-[1fr_120px_80px_80px_100px_40px] gap-2 px-3 py-2 rounded hover:bg-[var(--surface-hover)] items-center group">
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
          className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity p-1 rounded hover:bg-[var(--surface)] border border-transparent hover:border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          title={t("actions.changeArt")}
          aria-label={t("actions.changeArtFor", { name: card.name })}
        >
          <ImageIcon className="w-3.5 h-3.5" />
        </button>
        <PrintingDeckUsage scryfallId={card.scryfallId} cardName={card.name} />
      </div>
      {/* Qty controls */}
      <CollectionQuantityControl
        cardName={card.name}
        quantity={card.quantity}
        onQuantityChange={handleQuantityChange}
      />
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
        className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity p-1 rounded hover:bg-red-500/20 text-[var(--text-secondary)] hover:text-red-400"
        aria-label={t("actions.removeFromCollection")}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
