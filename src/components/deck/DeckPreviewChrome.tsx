"use client";

import Image from "next/image";
import { useCallback } from "react";
import { previewCardImages, type DeckPreviewCard } from "@/lib/deck/deck-preview";
import { cn } from "@/components/ui/utils";

/** One category chip beside All. */
export interface CategoryChip {
  readonly id: string;
  readonly label: string;
  readonly count: number;
}

interface CategoryFilterProps {
  readonly options: readonly CategoryChip[];
  readonly value: string;
  readonly allLabel: string;
  readonly onChange: (categoryId: string) => void;
}

/**
 * Category chips for a deck that is already on the page.
 *
 * @param props - chip labels and the selected id
 * @returns the filter toolbar
 */
export function CategoryFilter({
  options,
  value,
  allLabel,
  onChange,
}: CategoryFilterProps) {
  const selectAll = useCallback(() => onChange("all"), [onChange]);

  return (
    <div className="flex gap-2 overflow-x-auto pb-1" role="toolbar" aria-label={allLabel}>
      <ChipButton pressed={value === "all"} label={allLabel} onSelect={selectAll} />
      {options.map((option) => (
        <CategoryChipButton
          key={option.id}
          option={option}
          pressed={value === option.id}
          onChange={onChange}
        />
      ))}
    </div>
  );
}

/**
 * Horizontal card faces for the visible slice of a deck.
 *
 * @param props - cards that may or may not have images
 * @returns the imagery strip
 */
export function DeckCardStrip({
  cards,
}: {
  readonly cards: readonly DeckPreviewCard[];
}) {
  const pictured = previewCardImages(cards);
  if (pictured.length === 0) return null;

  return (
    <ul className="flex gap-3 overflow-x-auto pb-2">
      {pictured.map((card) => (
        <li key={card.id} className="w-24 shrink-0">
          <Image
            src={card.imageUri}
            alt={card.name}
            width={96}
            height={134}
            unoptimized
            className="h-[134px] w-24 rounded-[var(--lumen-radius-lg)] border border-[var(--border)] object-cover shadow-[var(--lumen-shadow-sm)]"
          />
          <p className="mt-1 truncate text-xs text-[var(--text-secondary)]">{card.name}</p>
        </li>
      ))}
    </ul>
  );
}

function ChipButton({
  pressed,
  label,
  onSelect,
}: {
  readonly pressed: boolean;
  readonly label: string;
  readonly onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onSelect}
      className={cn(
        "shrink-0 rounded-[var(--lumen-radius-pill)] border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
        pressed
          ? "border-[var(--accent)] bg-[var(--accent)] text-white"
          : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      )}
    >
      {label}
    </button>
  );
}

function CategoryChipButton({
  option,
  pressed,
  onChange,
}: {
  readonly option: CategoryChip;
  readonly pressed: boolean;
  readonly onChange: (categoryId: string) => void;
}) {
  const select = useCallback(() => onChange(option.id), [onChange, option.id]);
  return (
    <ChipButton
      pressed={pressed}
      label={`${option.label} (${option.count})`}
      onSelect={select}
    />
  );
}
