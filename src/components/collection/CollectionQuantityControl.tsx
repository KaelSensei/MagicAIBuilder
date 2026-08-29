"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

/** Props for editing the owned quantity of a collection card. */
interface CollectionQuantityControlProps {
  readonly cardName: string;
  readonly quantity: number;
  readonly onQuantityChange: (quantity: number) => void;
}

/**
 * Renders an accessible quantity editor with direct numeric entry.
 *
 * @param props - Current card quantity and change callback.
 * @returns Quantity controls for a collection card.
 */
export function CollectionQuantityControl({
  cardName,
  quantity,
  onQuantityChange,
}: CollectionQuantityControlProps) {
  const t = useTranslations("collection.quantityControl");
  const [draft, setDraft] = useState(quantity.toString());

  useEffect(() => {
    setDraft(quantity.toString());
  }, [quantity]);

  const commitDraft = useCallback(() => {
    const nextQuantity = Number.parseInt(draft, 10);
    if (!Number.isInteger(nextQuantity) || nextQuantity < 0) {
      setDraft(quantity.toString());
      return;
    }
    if (nextQuantity !== quantity) {
      onQuantityChange(nextQuantity);
    }
  }, [draft, onQuantityChange, quantity]);

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label={t("decrease", { name: cardName })}
        disabled={quantity === 0}
        onClick={() => onQuantityChange(quantity - 1)}
        className="flex h-7 w-7 items-center justify-center rounded border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        −
      </button>
      <input
        type="number"
        min={0}
        step={1}
        inputMode="numeric"
        aria-label={t("input", { name: cardName })}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commitDraft}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
        className="h-7 w-12 rounded border border-[var(--border)] bg-[var(--surface)] px-1 text-center text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
      />
      <button
        type="button"
        aria-label={t("increase", { name: cardName })}
        onClick={() => onQuantityChange(quantity + 1)}
        className="flex h-7 w-7 items-center justify-center rounded border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
      >
        +
      </button>
    </div>
  );
}
