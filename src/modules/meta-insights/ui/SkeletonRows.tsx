/**
 * The placeholder rows a meta section shows while its source loads and it has
 * nothing to list yet.
 *
 * Meta-insights context, `ui/`. Presentational; each section passes the number
 * of rows its source usually returns.
 *
 * @module meta-insights/ui/SkeletonRows
 */

/** How many placeholder rows to draw. */
export interface SkeletonRowsProps {
  readonly count: number;
}

/** `count` pulsing rows the shape of a card row, with no text for assistive technology. */
export function SkeletonRows({ count }: SkeletonRowsProps) {
  return (
    <div className="space-y-1">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="flex items-center gap-2 p-2 animate-pulse">
          <div className="w-8 h-11 rounded bg-[var(--border)] shrink-0" />
          <div className="flex-1 space-y-1">
            <div className="h-2.5 bg-[var(--border)] rounded w-3/4" />
            <div className="h-2 bg-[var(--border)] rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
