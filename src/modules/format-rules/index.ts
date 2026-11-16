/**
 * Format rules context: the pure entry point (ADR 0002).
 *
 * The Commander and format rules the server and the browser share, as pure
 * functions from `domain/` that report and never refuse (ADR 0009). Today it
 * holds the side-deck construction checks (I-103) and the deck size rule; the
 * Commander deck's other rules still live under `src/lib/deck/` until they
 * move here.
 *
 * @module format-rules
 */
export {
  deckSizeRule,
  deckSizeStatus,
  type DeckSizeRule,
  type DeckSizeStatus,
} from "@/modules/format-rules/domain/deck-size";
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
