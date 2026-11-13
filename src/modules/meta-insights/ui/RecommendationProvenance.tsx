/**
 * The badge that names the kind of evidence behind a recommendation: popular
 * (EDHREC), high-synergy, tournament, or AI.
 *
 * Meta-insights context, `ui/`. Presentational. The meta sections render it
 * through `MetaSourceDisclosure`; the AI suggestions panel (ai-copilot
 * context) imports it by path to badge its own suggestions `ai`, so the four
 * kinds read the same across the builder page.
 *
 * @module meta-insights/ui/RecommendationProvenance
 */
import { useTranslations } from "next-intl";

import type { MetaEvidenceKind } from "@/modules/meta-insights/domain/evidence-label";
import { cn } from "@/components/ui/utils";

/** One colour per kind, so a reader tells the kinds apart before reading the label. */
const PROVENANCE_STYLES: Record<MetaEvidenceKind, string> = {
  popular: "border-sky-400/30 bg-sky-400/10 text-sky-300",
  synergy: "border-violet-400/30 bg-violet-400/10 text-violet-300",
  tournament: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  ai: "border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-300",
};

/**
 * The badge for one evidence kind, labelled "Recommendation provenance: <kind>"
 * for assistive technology. The kinds are not equally strong evidence, which
 * is why the badge exists: a reader should see at a glance whether a card is
 * recommended by inclusion counts, by a tournament result or by a model.
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
