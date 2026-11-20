/**
 * Deck Lab's rules for a card that is not a land: mana creature, mana rock, land ramp, burst
 * draw, draw engine, and the spell every other card falls back to (I-31 requirements 2.1, 2.3).
 *
 * Context: deck analysis, Deck Lab. The first rule that matches wins, in the order of
 * `SPELL_RULES`: a mana ability decides before a search or a draw, so a creature that taps for
 * mana is a dork whatever else it does.
 *
 * @module deck-lab/spell-rules
 */
import { hasCardType, type FaceText, type LabFacts } from "./card-faces";
import {
  cardsDrawnBy,
  landSearchOf,
  manaAbilityOf,
  searchedColours,
} from "./oracle-text";

/** One rule: the facts it decides for a face, or `undefined` when it does not apply. */
type SpellRule = (face: FaceText) => LabFacts | undefined;

/** A creature that taps for mana: usable from the turn after it lands (CR 302.6). */
const manaCreature: SpellRule = (face) => {
  const ability = manaAbilityOf(face.oracleText);
  if (!ability || !hasCardType(face, "Creature")) return undefined;
  const { produces, dependsOnOpponents, out } = ability;
  return {
    kind: "dork",
    ruleId: "mana-creature",
    produces,
    dependsOnOpponents,
    out,
  };
};

/** An artifact that taps for mana; a filter such as a Signet nets one mana for the one it pays. */
const manaRock: SpellRule = (face) => {
  const ability = manaAbilityOf(face.oracleText);
  if (!ability || !hasCardType(face, "Artifact")) return undefined;
  const { produces, dependsOnOpponents, out, filters } = ability;
  const ruleId = filters ? "filter-rock" : "mana-rock";
  return { kind: "rock", ruleId, produces, dependsOnOpponents, out };
};

/**
 * A spell that puts lands from the library onto the battlefield. Cultivate's "put one onto the
 * battlefield tapped and the other into your hand" puts one land out and one in hand.
 */
const landSearchRamp: SpellRule = (face) => {
  const search = landSearchOf(face.oracleText);
  if (!search) return undefined;
  const splitsToHand = face.oracleText
    .toLowerCase()
    .includes("the other into your hand");
  return {
    kind: "lramp",
    ruleId: "land-search-ramp",
    out: splitsToHand ? 1 : search.count,
    toHand: splitsToHand ? search.count - 1 : 0,
    entersTapped: search.foundTapped,
    fetchTypes: search.targets,
    produces: searchedColours(search.targets),
  };
};

/** An instant or sorcery that draws cards once. */
const burstDraw: SpellRule = (face) => {
  const drawN = cardsDrawnBy(face.oracleText);
  const isOneShot =
    hasCardType(face, "Instant") || hasCardType(face, "Sorcery");
  if (drawN === undefined || !isOneShot) return undefined;
  return { kind: "draw", ruleId: "burst-draw", drawN };
};

/** A permanent that draws at the beginning of each of its controller's turns, as Phyrexian Arena. */
const drawEngine: SpellRule = (face) => {
  const drawN = cardsDrawnBy(face.oracleText);
  const eachTurn = face.oracleText
    .toLowerCase()
    .includes("at the beginning of your");
  if (drawN === undefined || !eachTurn) return undefined;
  return { kind: "engine", ruleId: "draw-engine", drawN };
};

/** The rules for a card that is not a land, first match wins. */
const SPELL_RULES: readonly SpellRule[] = [
  manaCreature,
  manaRock,
  landSearchRamp,
  burstDraw,
  drawEngine,
];

/**
 * Classifies the front face of a card that is not a land. A card no rule matches is a spell at
 * its mana value (requirement 2.3).
 *
 * @param face - the card's front face
 * @returns its kind, rule and facts
 */
export function classifySpellFace(face: FaceText): LabFacts {
  for (const rule of SPELL_RULES) {
    const facts = rule(face);
    if (facts) return facts;
  }
  return { kind: "spell", ruleId: "spell-fallback" };
}
