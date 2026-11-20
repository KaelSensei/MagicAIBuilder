/**
 * Format rules context: the pure entry point (ADR 0002).
 *
 * The Commander and format rules the server and the browser share, as pure
 * functions from `domain/` that report and never refuse (ADR 0009). Today it
 * holds the side-deck construction checks (I-103), the deck size rule and the
 * league round allowance (I-104); the Commander deck's other rules still live
 * under `src/lib/deck/` until they move here.
 *
 * @module format-rules
 */
export {
  checkRoundAllowance,
  type AllowancePart,
  type AllowancePartReport,
  type AllowanceReport,
  type AllowanceVerdict,
  type DatedCardPrice,
  type LeagueListCard,
  type LeagueListPair,
  type PriceMarket,
  type SwapPair,
} from "@/modules/format-rules/domain/league-allowance";
export {
  deckSizeRule,
  deckSizeStatus,
  type DeckSizeBound,
  type DeckSizeRule,
  type DeckSizeStatus,
  type FormatDeckSize,
} from "@/modules/format-rules/domain/deck-size";
export {
  deckConstructionExceptions,
  isIdentityExempt,
  liftsMaximumDeckSize,
  RULEBREAKERS,
  RULEBREAKERS_SOURCE,
  RULEBREAKERS_VERSION,
  rulebreakerAdmission,
  type AdmittingExceptionKind,
  type CommandZoneCard,
  type ConstructionCard,
  type Rulebreaker,
  type RulebreakerAdmission,
  type RulebreakerCardTest,
  type RulebreakerException,
} from "@/modules/format-rules/domain/rulebreakers";
export {
  checkSideDeck,
  type CommunalPlayerCount,
  type PlanarDeckOption,
  type SchemeDeckOption,
  type SideCardLegality,
  type SideDeck,
  type SideDeckCard,
  type SideDeckKind,
  type SideDeckOption,
  type SideDeckReport,
  type SideRuleDetail,
  type SideRuleId,
  type SideRuleResult,
  type SideRuleVerdict,
} from "@/modules/format-rules/domain/side-decks";
