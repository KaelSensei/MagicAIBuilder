"use client";
// Dialog for adding a card to the collection via search
import { useState, useCallback, useRef } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Plus, Search, Loader2, Check } from "lucide-react";
import { useCollectionStore } from "@/lib/collection/store";
import { CARD_CONDITIONS, type CardCondition } from "@/lib/collection/types";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { searchCards } from "@/lib/scryfall/client";
import { getCardImageUri } from "@/lib/scryfall/images";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal, ModalTitle } from "@/components/ui/Modal";
import { cn } from "@/components/ui/utils";

export function AddToCollectionDialog() {
  const t = useTranslations("collection.dialog");
  const format = useFormatter();
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
      price: selected.prices?.usd
        ? Number.parseFloat(selected.prices.usd)
        : null,
      imageUri: getCardImageUri(selected, "grid"),
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
      <Button type="button" variant="primary" size="sm" onClick={() => setOpen(true)}>
        <Plus className="w-3.5 h-3.5" />
        {t("trigger")}
      </Button>

      <Modal
        open={open}
        onClose={handleClose}
        maxWidth="max-w-md"
        className="p-6"
        showClose={false}
      >
        <ModalTitle className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          {t("title")}
        </ModalTitle>

        {/* Card search */}
        <div className="relative mb-4">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
          <Input
            type="text"
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10"
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
                type="button"
                key={card.id}
                onClick={() => handleSelect(card)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-[var(--surface-hover)] transition-colors"
              >
                <span className="flex-1 text-[var(--text-primary)] truncate">
                  {card.name}
                </span>
                <span className="text-xs text-[var(--text-secondary)] shrink-0">
                  {card.prices?.usd
                    ? format.number(Number.parseFloat(card.prices.usd), {
                        style: "currency",
                        currency: "USD",
                      })
                    : ""}
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
              <span className="text-xs text-[var(--text-secondary)] w-20">
                {t("quantity")}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-[var(--lumen-radius-pill)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                >
                  −
                </button>
                <span className="text-sm text-[var(--text-primary)] w-6 text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-[var(--lumen-radius-pill)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                >
                  +
                </button>
              </div>
            </div>

            {/* Condition */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-[var(--text-secondary)] w-20">
                {t("condition")}
              </span>
              <div className="flex gap-1">
                {CARD_CONDITIONS.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setCondition(c)}
                    className={cn(
                      "rounded-[var(--lumen-radius-pill)] border px-2 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
                      condition === c
                        ? "border-[var(--accent)] text-[var(--accent-text)] bg-[var(--accent)]/10"
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
              <span className="text-xs text-[var(--text-secondary)] w-20">
                {t("foilLabel")}
              </span>
              <button
                type="button"
                onClick={() => setFoil((f) => !f)}
                className={cn(
                  "rounded-[var(--lumen-radius-pill)] border px-3 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
                  foil
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-text)]"
                    : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]"
                )}
              >
                ✨ {foil ? t("foil") : t("nonFoil")}
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 justify-end">
          <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
            {t("cancel")}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleAdd}
            disabled={!selected || isSyncing || added}
            className={added ? "bg-green-600 hover:bg-green-600" : undefined}
          >
            {added && (
              <>
                <Check className="w-3.5 h-3.5" />
                Added!
              </>
            )}
            {!added && isSyncing && (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Adding…
              </>
            )}
            {!added && !isSyncing && (
              <>
                <Plus className="w-3.5 h-3.5" />
                {t("submit")}
              </>
            )}
          </Button>
        </div>
      </Modal>
    </>
  );
}
