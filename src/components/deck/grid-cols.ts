import { cn } from "@/components/ui/utils";

/**
 * Tailwind column classes for the deck grid, keyed by the column counts the
 * grid selector offers.
 *
 * Tailwind scans source text, so these have to be written out — a computed
 * `grid-cols-${n}` would not survive the build.
 */
const GRID_COLS_MAP: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  6: "grid-cols-6",
  8: "grid-cols-8",
};

/**
 * Grid classes for a deck card grid.
 *
 * @param cols - column count from the store; anything unmapped falls back to 4
 */
export function gridColsClass(cols: number): string {
  return cn("grid gap-1 p-1", GRID_COLS_MAP[cols] ?? "grid-cols-4");
}
