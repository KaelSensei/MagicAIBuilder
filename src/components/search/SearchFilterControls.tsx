"use client";
/**
 * The two primitive controls of the advanced search filters panel: a tab-like mode button and a
 * bounded number field. `SearchFilters.tsx` composes them; they hold no filter logic themselves.
 *
 * @module components/search/SearchFilterControls
 */
import { cn } from "@/components/ui/utils";

/** The shared look of every field in the panel: the controls here and the text fields and lists in `SearchFilters.tsx`. */
export const inputCls =
  "text-xs bg-[var(--surface)] border border-[var(--border)] rounded px-2 py-1 " +
  "text-[var(--text-primary)] outline-none focus:border-[var(--accent)]";

/**
 * A small mode button, highlighted while `active`. Used for the colour match (Any / All / Exact)
 * and the mana value mode (Range / Exact / Min / Max).
 *
 * @param props.active - whether this mode is the chosen one
 * @param props.onClick - picks this mode
 * @param props.title - an optional tooltip, which also becomes the button's description
 */
export function TabButton({
  active,
  onClick,
  title,
  children,
}: {
  readonly active: boolean;
  readonly onClick: () => void;
  readonly title?: string;
  readonly children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "px-2 py-0.5 text-xs rounded transition-colors",
        active
          ? "bg-[var(--accent)] text-white"
          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5"
      )}
    >
      {children}
    </button>
  );
}
TabButton.displayName = "TabButton";

/**
 * A number field for one bound of a filter. An emptied field reports `null`, so the bound is
 * dropped rather than read as zero.
 *
 * @param props.label - the accessible name; the placeholder is a hint, not a name, and the
 *   visible word next to a pair of bounds cannot name both of them
 * @param props.value - the current bound, or `null` for none
 * @param props.onChange - receives the typed number, or `null` when the field is emptied
 * @param props.placeholder - the hint shown while the field is empty
 * @param props.min - the lowest accepted value; defaults to 0, since no filter bound is negative
 * @param props.max - the highest accepted value, when the filter has one
 */
export function NumInput({
  label,
  value,
  onChange,
  placeholder,
  min = 0,
  max,
  className,
}: {
  readonly label: string;
  readonly value: number | null;
  readonly onChange: (v: number | null) => void;
  readonly placeholder: string;
  readonly min?: number;
  readonly max?: number;
  readonly className?: string;
}) {
  return (
    <input
      type="number"
      aria-label={label}
      min={min}
      max={max}
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) =>
        onChange(e.target.value === "" ? null : Number(e.target.value))
      }
      className={cn(inputCls, className)}
    />
  );
}
NumInput.displayName = "NumInput";
