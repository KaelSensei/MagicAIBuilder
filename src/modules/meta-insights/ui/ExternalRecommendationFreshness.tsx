import { Clock, Database, Radio } from "lucide-react";

function formatObservedAt(observedAt: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(observedAt);
}

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
