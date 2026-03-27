"use client";
// Collection page — lists all owned cards with stats
import { useEffect, useState } from "react";
import { Loader2, Package, Search, LayoutGrid, List, Trash2 } from "lucide-react";
import { useCollectionStore } from "@/lib/collection/store";
import { AddToCollectionDialog } from "./AddToCollectionDialog";
import { cn } from "@/components/ui/utils";
import type { CollectionCard } from "@/lib/collection/types";
import { CardImage } from "@/components/card/CardImage";

export function CollectionPageClient() {
  const { collectionCards, collectionCardsFoil, isLoading, loadCollection, removeFromCollection, updateQuantity } =
    useCollectionStore();
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center flex-1 text-[var(--text-secondary)]">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading collection…
      </div>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-[var(--accent)]" />
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              My Collection
            </h1>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <AddToCollectionDialog />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard label="Unique Cards" value={allCards.length.toString()} />
          <StatCard label="Total Cards" value={totalCards.toString()} />
          <StatCard
            label="Total Value"
            value={`$${totalValue.toFixed(2)}`}
            highlight
          />
        </div>

        {/* Search + view toggle */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Search your collection…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-secondary)]"
            />
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 rounded transition-colors",
                viewMode === "grid"
                  ? "text-[var(--accent)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2 rounded transition-colors",
                viewMode === "list"
                  ? "text-[var(--accent)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
              title="List view"
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
                <p className="text-sm">Your collection is empty.</p>
                <p className="text-xs opacity-70">
                  Add cards using the button above or from the card search.
                </p>
              </>
            ) : (
              <p className="text-sm">No cards match your search.</p>
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
              />
            ))}
          </div>
        )}
        {filtered.length > 0 && viewMode !== "grid" && (
          <div className="space-y-1">
            <div className="grid grid-cols-[1fr_80px_80px_80px_100px_40px] gap-2 px-3 py-1.5 text-xs text-[var(--text-secondary)] uppercase tracking-wide border-b border-[var(--border)]">
              <span>Card</span>
              <span>Qty</span>
              <span>Foil</span>
              <span>Condition</span>
              <span>Value</span>
              <span />
            </div>
            {filtered.map((card) => (
              <CollectionListRow
                key={card.id}
                card={card}
                onRemove={removeFromCollection}
                onQuantityChange={updateQuantity}
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
          highlight ? "text-[var(--accent)]" : "text-[var(--text-primary)]"
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
}: {
  readonly card: CollectionCard;
  readonly onRemove: (id: string) => void;
  readonly onQuantityChange: (id: string, qty: number) => void;
}) {
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
          <p className="text-xs text-center text-[var(--text-secondary)] px-1">{card.name}</p>
        </div>
      )}
      {/* Quantity badge */}
      <div className="absolute top-1 right-1 bg-[var(--accent)] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg">
        {card.quantity}
      </div>
      {/* Foil badge */}
      {card.foil && (
        <div className="absolute top-1 left-1 bg-purple-500 text-white text-[10px] rounded px-1 shadow-lg">
          Foil
        </div>
      )}
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/card:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center gap-2 p-2">
        <p className="text-white text-xs text-center font-medium leading-tight">{card.name}</p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onQuantityChange(card.id, Math.max(0, card.quantity - 1))}
            className="w-6 h-6 rounded bg-white/20 hover:bg-white/40 text-white text-sm flex items-center justify-center"
          >
            −
          </button>
          <span className="text-white text-sm w-5 text-center">{card.quantity}</span>
          <button
            onClick={() => onQuantityChange(card.id, card.quantity + 1)}
            className="w-6 h-6 rounded bg-white/20 hover:bg-white/40 text-white text-sm flex items-center justify-center"
          >
            +
          </button>
        </div>
        <button
          onClick={() => onRemove(card.id)}
          className="text-red-400 hover:text-red-300 text-xs"
          aria-label="Remove from collection"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

function CollectionListRow({
  card,
  onRemove,
  onQuantityChange,
}: {
  readonly card: CollectionCard;
  readonly onRemove: (id: string) => void;
  readonly onQuantityChange: (id: string, qty: number) => void;
}) {
  const value = card.price === null || card.price === undefined ? "—" : `$${(card.price * card.quantity).toFixed(2)}`;

  return (
    <div className="grid grid-cols-[1fr_80px_80px_80px_100px_40px] gap-2 px-3 py-2 rounded hover:bg-[var(--surface-hover)] items-center group">
      <span className="text-sm text-[var(--text-primary)] truncate">
        {card.name}
      </span>
      {/* Qty controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onQuantityChange(card.id, Math.max(0, card.quantity - 1))}
          className="w-5 h-5 rounded bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs flex items-center justify-center"
        >
          −
        </button>
        <span className="text-sm text-[var(--text-primary)] w-5 text-center">
          {card.quantity}
        </span>
        <button
          onClick={() => onQuantityChange(card.id, card.quantity + 1)}
          className="w-5 h-5 rounded bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs flex items-center justify-center"
        >
          +
        </button>
      </div>
      <span className="text-sm text-[var(--text-secondary)]">
        {card.foil ? (
          <span className="text-purple-400 text-xs font-medium">✨ Foil</span>
        ) : (
          "—"
        )}
      </span>
      <span className="text-sm text-[var(--text-secondary)]">
        {card.condition ?? "—"}
      </span>
      <span className="text-sm text-[var(--text-secondary)]">{value}</span>
      <button
        onClick={() => onRemove(card.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-500/20 text-[var(--text-secondary)] hover:text-red-400"
        aria-label="Remove from collection"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
