/**
 * The freshness line under an externally sourced recommendation: the source's
 * name, the exact time it was observed and the size of the deck snapshot it
 * was computed from.
 *
 * Meta-insights context, `ui/`. Presentational. Its one importer today is the
 * AI suggestions panel (ai-copilot context), which prints the model provider,
 * the analysis time and the deck's card count; the meta panel states its own
 * freshness through `MetaSourceDisclosure`. The line is fixed English and
 * US-formatted on purpose: it reads as a technical data stamp, like the
 * `_meta` envelope it reflects, not as translated copy.
 *
 * @module meta-insights/ui/ExternalRecommendationFreshness
 */
import { Clock, Database, Radio } from "lucide-react";

/** "Nov 13, 2026, 9:05 AM": the exact instant, to the minute, in the reader's zone. */
function formatObservedAt(observedAt: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(observedAt);
}

/**
 * Three stamps on one line, labelled "Recommendation freshness" for assistive
 * technology: `Source: <source>`, `Observed: <date and time>` and
 * `Deck snapshot: <n> cards`.
 *
 * @param source - the provider's display name, as the caller labels it
 * @param observedAt - when the recommendation was computed or the provider observed
 * @param sampleSize - how many cards the deck held at that moment
 */
export function ExternalRecommendationFreshness({
  source,
  observedAt,
  sampleSize,
}: {
  readonly source: string;
  readonly observedAt: Date;
  readonly sampleSize: number;
}) {
  return (
    <div
      aria-label="Recommendation freshness"
      className="mt-1.5 flex flex-wrap gap-x-2 gap-y-1 text-[9px] text-[var(--text-secondary)]"
    >
      <span className="inline-flex items-center gap-1">
        <Radio className="h-2.5 w-2.5" aria-hidden="true" />
        Source: {source}
      </span>
      <span className="inline-flex items-center gap-1">
        <Clock className="h-2.5 w-2.5" aria-hidden="true" />
        Observed: {formatObservedAt(observedAt)}
      </span>
      <span className="inline-flex items-center gap-1">
        <Database className="h-2.5 w-2.5" aria-hidden="true" />
        Deck snapshot: {sampleSize} cards
      </span>
    </div>
  );
}
