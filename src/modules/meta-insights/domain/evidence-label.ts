/**
 * The kinds of evidence behind a recommendation.
 *
 * Meta insights context. `RecommendationProvenance` badges a recommendation
 * with its kind, and `MetaSourceDisclosure` picks the kind of an EDHREC or
 * tournament source. The visible label is translated under
 * `deck.meta.evidence.<kind>` in every locale; it is not built here.
 *
 * @module meta-insights/domain/evidence-label
 */

/**
 * Where a recommendation's evidence comes from. The kinds are not equally
 * strong evidence, so the UI names the kind beside each recommendation.
 *
 * - `popular`: EDHREC recommendations (the default for an EDHREC source);
 * - `synergy`: high-synergy recommendations; nothing produces it today;
 * - `tournament`: MTGTop8 / MTGDecks observations;
 * - `ai`: the AI copilot's suggestions.
 */
export type MetaEvidenceKind = "popular" | "synergy" | "tournament" | "ai";
