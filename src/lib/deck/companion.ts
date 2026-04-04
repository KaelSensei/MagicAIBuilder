// Ikoria-style Companion: detection, human-readable rules, and deck checks
import type { Deck, DeckCard } from "./types";
import type { ScryfallCard } from "@/lib/scryfall/types";

/** Banned specifically as companion in Commander (deck may still run the card). */
export const LUTRI_SPELLCHASER_NAME = "Lutri, the Spellchaser";

/**
 * Companion deck-building rule shape. Several companions use `custom` because
 * full validation would require deeper rules parsing.
 */
export type CompanionCondition =
  | { type: "none" }
  | { type: "max_cmc"; value: number }
  | { type: "singleton"; comment: string }
  | { type: "mono_color"; color: string }
  | { type: "even_cmc" }
  | { type: "nonland_maximum"; value: number }
  | { type: "custom"; description: string };

/** Cards that count toward Companion restrictions (main + sideboard; not commander/partner/companion row). */
export function deckCardsForCompanionCheck(cards: readonly DeckCard[]): readonly DeckCard[] {
  return cards.filter((c) => c.zone !== "maybeboard");
}

/** Ikoria companions we encode with explicit or custom rules */
function companionConditionByName(name: string): CompanionCondition | null {
  if (name === "Gyruda, Doom of Depths") return { type: "even_cmc" };
  if (name === "Jegantha, the Wellspring") {
    return {
      type: "custom",
      description: "Each mana cost must contain no more than one of each mana symbol",
    };
  }
  if (name === "Kaheera, the Orphanage") {
    return {
      type: "custom",
      description: "Deck may only contain creatures, lands, and cards with Companion",
    };
  }
  if (name === "Lurrus of the Dream-Den") return { type: "max_cmc", value: 2 };
  if (name === "Obosh, the Preypiercer") {
    return {
      type: "custom",
      description: "Starting deck must have only odd mana values among nonland cards",
    };
  }
  if (name === "Umori, the Collector") {
    return {
      type: "custom",
      description: "Deck must share a single card type among nonland permanents",
    };
  }
  if (name === "Yorion, Sky Nomad") {
    return {
      type: "custom",
      description: "Deck must contain at least 61 cards for Commander",
    };
  }
  if (name === "Zirda, the Dawnwaker") {
    return {
      type: "custom",
      description: "Deck must satisfy Zirda's Companion deck-building rule (see Oracle text)",
    };
  }
  return null;
}

/**
 * @param card - Scryfall card (oracle + keywords)
 * @returns Rule object, or null if the card does not appear to be a Companion
 */
export function detectCompanionCondition(card: ScryfallCard): CompanionCondition | null {
  if (!isScryfallCompanionCard(card)) return null;
  const named = companionConditionByName(card.name);
  if (named) return named;
  return {
    type: "custom",
    description: "Verify your deck matches this card's Companion rule (Oracle text)",
  };
}

/**
 * @param card - Deck card (name + oracle)
 * @returns Same as {@link detectCompanionCondition} using stored fields
 */
export function detectCompanionConditionFromDeckCard(
  card: Pick<DeckCard, "name" | "oracleText">
): CompanionCondition | null {
  const named = companionConditionByName(card.name);
  if (named) return named;
  if (!oracleIncludesCompanionKeyword(card.oracleText ?? "")) return null;
  return {
    type: "custom",
    description: "Verify your deck matches this card's Companion rule (Oracle text)",
  };
}

function oracleIncludesCompanionKeyword(oracle: string): boolean {
  return /\bCompanion\b/.test(oracle);
}

/**
 * True if Scryfall marks the card with the Companion keyword or Oracle contains Companion.
 */
export function isScryfallCompanionCard(card: ScryfallCard): boolean {
  const kw = card.keywords ?? [];
  if (kw.some((k) => k.toLowerCase() === "companion")) return true;
  return oracleIncludesCompanionKeyword(card.oracle_text ?? "");
}

export function isBannedCompanionInCommander(card: Pick<ScryfallCard, "name">): boolean {
  return card.name === LUTRI_SPELLCHASER_NAME;
}

function isLandTypeLine(typeLine: string): boolean {
  return typeLine.toLowerCase().includes("land");
}

/**
 * Validates deck + commander + partner against a known Companion rule.
 * Unknown / custom rules return valid (manual check).
 */
export function validateCompanionCondition(
  companion: CompanionCondition,
  deckCards: readonly DeckCard[],
  commander: DeckCard | null,
  partner: DeckCard | null
): { valid: boolean; reason?: string } {
  const pool = deckCardsForCompanionCheck(deckCards);
  const allCards = [...(commander ? [commander] : []), ...(partner ? [partner] : []), ...pool];

  switch (companion.type) {
    case "none":
      return { valid: true };

    case "max_cmc": {
      const violators = allCards.filter((c) => c.cmc > companion.value);
      if (violators.length > 0) {
        const sample = violators
          .slice(0, 3)
          .map((c) => c.name)
          .join(", ");
        const suffix = violators.length > 3 ? ", …" : "";
        return {
          valid: false,
          reason: `Companion needs mana value ≤ ${companion.value} on each card; check: ${sample}${suffix}`,
        };
      }
      return { valid: true };
    }

    case "even_cmc": {
      const violators = allCards.filter(
        (c) => !isLandTypeLine(c.typeLine) && c.cmc > 0 && c.cmc % 2 !== 0
      );
      if (violators.length > 0) {
        return {
          valid: false,
          reason: `Companion needs even mana values on nonland cards; ${violators.length} card(s) have odd mana value`,
        };
      }
      return { valid: true };
    }

    case "singleton":
      return { valid: true };

    case "mono_color": {
      const violators = allCards.filter((c) => c.colorIdentity.length > 1);
      if (violators.length > 0) {
        return {
          valid: false,
          reason: `Companion needs mono-color identity on each card; ${violators.length} multicolor card(s)`,
        };
      }
      return { valid: true };
    }

    case "nonland_maximum": {
      const nonlands = allCards.filter((c) => !isLandTypeLine(c.typeLine));
      if (nonlands.length > companion.value) {
        return {
          valid: false,
          reason: `Companion allows at most ${companion.value} nonlands; you have ${nonlands.length}`,
        };
      }
      return { valid: true };
    }

    case "custom":
      return { valid: true };

    default: {
      const _exhaustive: never = companion;
      return _exhaustive;
    }
  }
}

/**
 * @returns Human-readable summary of the Companion rule
 */
export function describeCompanionCondition(condition: CompanionCondition): string {
  switch (condition.type) {
    case "none":
      return "No deck-building restriction";
    case "max_cmc":
      return `Each card's mana value ≤ ${condition.value}`;
    case "even_cmc":
      return "Each nonland card's mana value is even";
    case "mono_color":
      return "Each card is exactly one color";
    case "nonland_maximum":
      return `At most ${condition.value} nonland cards`;
    case "singleton":
      return condition.comment;
    case "custom":
      return condition.description;
    default: {
      const _exhaustive: never = condition;
      return _exhaustive;
    }
  }
}

/** Warnings for stats / bracket / validateDeck (not hard errors). */
export function getCompanionDeckWarnings(deck: Deck): readonly string[] {
  const out: string[] = [];
  const comp = deck.companion;
  if (!comp) return out;

  if (comp.name === LUTRI_SPELLCHASER_NAME) {
    out.push("Lutri is banned as a companion in Commander.");
  }

  if (deck.commander) {
    const allowed = new Set([
      ...deck.commander.colorIdentity,
      ...(deck.partner?.colorIdentity ?? []),
    ]);
    const bad = comp.colorIdentity.filter((c) => !allowed.has(c));
    if (bad.length > 0) {
      out.push(
        `Companion color identity (${bad.join(", ")}) is outside commander identity`
      );
    }
  }

  const condition = detectCompanionConditionFromDeckCard(comp);
  if (condition) {
    const result = validateCompanionCondition(
      condition,
      deck.cards,
      deck.commander,
      deck.partner
    );
    if (!result.valid && result.reason) {
      out.push(result.reason);
    }
  }

  return out;
}
