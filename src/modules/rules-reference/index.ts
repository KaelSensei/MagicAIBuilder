/**
 * Rules reference context: the pure entry point (ADR 0002).
 *
 * The parsed shape of the Comprehensive Rules and the search over it, as
 * readonly data and pure functions from `domain/`, safe on the server, in the
 * browser and in the Edge middleware. Reading the bundled file is in
 * `server.ts`; the pages are imported by path under `ui/`.
 *
 * @module rules-reference
 */
export {
  searchComprehensiveRules,
  type ComprehensiveRules,
  type GlossaryEntry,
  type RuleParagraph,
  type RulesChapter,
  type RulesSearchResult,
  type RulesSection,
} from "@/modules/rules-reference/domain/comprehensive-rules";
