import { useTranslations } from "next-intl";

import type { MetaEvidenceKind } from "@/lib/meta/evidence-label";
import { cn } from "@/components/ui/utils";

const PROVENANCE_STYLES: Record<MetaEvidenceKind, string> = {
  popular: "border-sky-400/30 bg-sky-400/10 text-sky-300",
  synergy: "border-violet-400/30 bg-violet-400/10 text-violet-300",
  tournament: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  ai: "border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-300",
};

/**
 * Shows the origin category of a recommendation without implying equal evidence.
 *
 * @param props - Recommendation provenance selected by the recommendation source
 * @returns A concise, accessible provenance badge
 */
export function RecommendationProvenance({
  kind,
}: {
  readonly kind: MetaEvidenceKind;
}) {
  const t = useTranslations("deck");
  const label = t(`meta.evidence.${kind}`);

  return (
    <span
      aria-label={`Recommendation provenance: ${label}`}
      className={cn(
        "inline-flex rounded-full border px-1.5 py-0.5 text-[9px] font-semibold leading-none",
        PROVENANCE_STYLES[kind]
      )}
    >
      {label}
    </span>
  );
}
