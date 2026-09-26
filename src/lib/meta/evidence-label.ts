export type MetaEvidenceKind = "popular" | "synergy" | "tournament" | "ai";

const EVIDENCE_LABELS: Record<MetaEvidenceKind, string> = {
  popular: "popular recommendations",
  synergy: "high-synergy recommendations",
  tournament: "tournament observations",
  ai: "AI suggestions",
};

/**
 * Return the human-readable evidence category for a recommendation.
 *
 * @param kind - provenance category shown beside a recommendation source
 * @returns stable evidence category label
 */
export function evidenceLabel(kind: MetaEvidenceKind): string {
  return EVIDENCE_LABELS[kind];
}
