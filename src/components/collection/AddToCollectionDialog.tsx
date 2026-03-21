"use client";
// Dialog for adding a card to the collection via search
import { useState, useCallback, useRef } from "react";
import { Plus, Search, Loader2, Check } from "lucide-react";
import { useCollectionStore } from "@/lib/collection/store";
import type { CardCondition } from "@/lib/collection/types";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { searchCards } from "@/lib/scryfall/client";
import { getCardImageUri } from "@/lib/scryfall/images";
import { cn } from "@/components/ui/utils";

const CONDITIONS: readonly CardCondition[] = ["NM", "LP", "MP", "HP", "DMG"];

export function AddToCollectionDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ScryfallCard[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selected, setSelected] = useState<ScryfallCard | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [foil, setFoil] = useState(false);
  const [condition, setCondition] = useState<CardCondition>("NM");
  const [added, setAdded] = useState(false);

  const { addToCollection, isSyncing } = useCollectionStore();
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await searchCards(q);
        setResults(data.data?.slice(0, 10) ?? []);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  }, []);

  const handleSelect = (card: ScryfallCard) => {
    setSelected(card);
    setResults([]);
    setQuery(card.name);
  };

  const handleAdd = async () => {
    if (!selected) return;
    await addToCollection({
      scryfallId: selected.id,
      name: selected.name,
      quantity,
      foil,
      condition,
      price: selected.prices?.usd ? Number.parseFloat(selected.prices.usd) : null,
      imageUri: getCardImageUri(selected, "normal"),
    });
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      setSelected(null);
      setQuery("");
      setQuantity(1);
      setFoil(false);
      setCondition("NM");
    }, 1200);
  };

  const handleClose = () => {
    setOpen(false);
    setSelected(null);
    setQuery("");
    setResults([]);
    setQuantity(1);
    setFoil(false);
    setCondition("NM");
    setAdded(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-3 py-1.5 rounded transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Add Card
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              Add to Collection
            </h2>

            {/* Card search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
              <input
                type="text"
                autoFocus
                placeholder="Search for a card…"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-secondary)]"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[var(--text-secondary)]" />
              )}
            </div>

            {/* Search dropdown */}
            {results.length > 0 && (
              <div className="border border-[var(--border)] rounded-lg overflow-hidden mb-4 max-h-48 overflow-y-auto">
                {results.map((card) => (
                  <button
                    key={card.id}
                    onClick={() => handleSelect(card)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    <span className="flex-1 text-[var(--text-primary)] truncate">{card.name}</span>
                    <span className="text-xs text-[var(--text-secondary)] shrink-0">
                      {card.prices?.usd ? `$${card.prices.usd}` : ""}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Card options */}
            {selected && (
              <div className="space-y-3 mb-5">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {selected.name}
                </p>

                {/* Quantity */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[var(--text-secondary)] w-20">Quantity</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-7 h-7 rounded border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center"
                    >
                      −
                    </button>
                    <span className="text-sm text-[var(--text-primary)] w-6 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      className="w-7 h-7 rounded border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Condition */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[var(--text-secondary)] w-20">Condition</span>
                  <div className="flex gap-1">
                    {CONDITIONS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setCondition(c)}
                        className={cn(
                          "px-2 py-1 text-xs rounded border transition-colors",
                          condition === c
                            ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10"
                            : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]/50"
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Foil */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[var(--text-secondary)] w-20">Foil</span>
                  <button
                    onClick={() => setFoil((f) => !f)}
                    className={cn(
                      "px-3 py-1 text-xs rounded border transition-colors",
                      foil
                        ? "border-purple-500 text-purple-400 bg-purple-500/10"
                        : "border-[var(--border)] text-[var(--text-secondary)] hover:border-purple-500/50"
                    )}
                  >
                    ✨ {foil ? "Foil" : "Non-Foil"}
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!selected || isSyncing || added}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 text-sm rounded transition-colors",
                  added
                    ? "bg-green-600 text-white"
                    : "bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {added && <><Check className="w-3.5 h-3.5" />Added!</>}
                {!added && isSyncing && <><Loader2 className="w-3.5 h-3.5 animate-spin" />Adding…</>}
                {!added && !isSyncing && <><Plus className="w-3.5 h-3.5" />Add to Collection</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
