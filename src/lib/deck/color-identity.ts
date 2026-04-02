import type { Deck, DeckCard } from "./types";

export interface ColorIdentityViolation {
  readonly cardId: string;
  readonly cardName: string;
}

function buildCommanderIdentitySet(deck: Deck): ReadonlySet<string> {
  return new Set([...(deck.commander?.colorIdentity ?? []), ...(deck.partner?.colorIdentity ?? [])]);
}

export function getColorIdentityViolations(deck: Deck): readonly ColorIdentityViolation[] {
  if (!deck.commander) return [];
  const commanderIdentity = buildCommanderIdentitySet(deck);
  const mainCards = deck.cards.filter((c) => c.zone === "main");

  const violations: ColorIdentityViolation[] = [];
  for (const c of mainCards) {
    const violates = c.colorIdentity.some((color) => !commanderIdentity.has(color));
    if (!violates) continue;
    violations.push({ cardId: c.id, cardName: c.name });
  }
  return violations;
}

export function isCardOutsideColorIdentity(
  commanderIdentity: ReadonlySet<string>,
  card: Pick<DeckCard, "colorIdentity">
): boolean {
  return card.colorIdentity.some((color) => !commanderIdentity.has(color));
}

