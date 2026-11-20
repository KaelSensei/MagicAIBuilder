/**
 * Classifies one deck card into a Deck Lab card: its kind, the rule that decided it, and its
 * cost, coloured pips and mana facts (I-31 requirement 2.1). Deterministic and pure: the same
 * card always gives the same lab card, and no model is called.
 *
 * Context: deck analysis, Deck Lab. The land rules are in `land-rules.ts`, the others in
 * `spell-rules.ts`; this module picks between them and fills in the defaults.
 *
 * @module deck-lab/classify-card
 */
import { PIP_COLORS } from "@/lib/deck/mana-alignment";
import type { DeckCard } from "@/lib/deck/types";
import { extractColorPips } from "@/lib/mana/parse";

import { facesOf, hasCardType, type LabFacts } from "./card-faces";
import { classifyLandFace, classifyModalLand } from "./land-rules";
import { classifySpellFace } from "./spell-rules";
import type { LabCard, LabPips } from "./types";

/**
 * The front face's mana cost. CR 712.8a: a double-faced card in the library or the hand has only
 * its front face's characteristics. A row without faces stores `Front // Back`.
 */
function frontManaCost(card: DeckCard): string {
  const [front = ""] = card.manaCost.split(" // ", 1);
  return card.cardFaces?.[0].manaCost ?? front;
}

/** The coloured pips of a mana cost, hybrid symbols counted as halves (`extractColorPips`). */
function pipsOf(manaCost: string): LabPips {
  const pips = extractColorPips(manaCost);
  const [W = 0, U = 0, B = 0, R = 0, G = 0] = PIP_COLORS.map(
    (colour) => pips[colour] ?? 0
  );
  return { W, U, B, R, G };
}

/** The kind, rule and facts of a card: a land face, a modal land back, or a spell. */
function factsOf(card: DeckCard): LabFacts {
  const faces = facesOf(card);
  if (hasCardType(faces.front, "Land")) return classifyLandFace(faces.front);
  return (
    classifyModalLand(faces, card.layout) ?? classifySpellFace(faces.front)
  );
}

/**
 * Classifies one copy of a deck card.
 *
 * @param card - a deck card; its quantity is not read
 * @returns its lab card, not overridden and not a key card
 */
export function classifyCard(card: DeckCard): LabCard {
  return {
    name: card.name,
    cost: card.cmc,
    pips: pipsOf(frontManaCost(card)),
    produces: { kind: "colours", colours: [] },
    dependsOnOpponents: false,
    out: 0,
    entersTapped: false,
    fetchTypes: [],
    drawN: 0,
    toHand: 0,
    key: false,
    overridden: false,
    ...factsOf(card),
  };
}
