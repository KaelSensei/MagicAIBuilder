/**
 * Card-data check of an AI-generated Commander deck.
 *
 * The model is asked for a legal list but never trusted with legality. Every
 * name is resolved against Scryfall card data, then checked with the rules the
 * deck editor already applies (colour identity, copy limits, partner pairing,
 * the format's deck size), Scryfall's Commander legality, and commander
 * eligibility (CR 903.3).
 *
 * Policy (I-02 spec, requirement 5.2: reject only what cannot be repaired):
 * - An illegal command zone rejects the build. Choosing another commander is
 *   a deckbuilding decision, not a repair.
 * - An illegal card in the list is removed: unknown name, banned or not legal,
 *   outside the colour identity, a copy beyond the card's limit, or the
 *   commander repeated in the list. A card not legal only because its set is
 *   not out yet is named a preview, with its release day (I-73 3.5).
 * - The list is then brought to the exact deck size with basic lands
 *   (`generated-deck-size.ts`).
 * - A rulebreaker commander's exceptions apply (CR 903.5e): a card one admits
 *   stays whatever its colour identity, and a deck with no maximum size keeps
 *   a list longer than 100. Legality is checked first and no exception
 *   reaches it (CR 113.6n).
 * - Every change is returned as a correction so the player sees it.
 *
 * @module ai/generated-deck-legality
 */
import type {
  AICard,
  AIDeckResponse,
  DeckCorrection,
  DeckRemovalCause,
  DeckRemovalReason,
} from "@/app/api/ai/build/types";
import { fetchInBatches } from "@/lib/deck/batch-fetch";
import {
  isBackground,
  isCommanderEligible,
} from "@/lib/deck/commander-eligibility";
import {
  colorsProducedBy,
  PIP_COLORS,
  type PipColor,
} from "@/lib/deck/mana-alignment";
import { deckCopyLimit } from "@/lib/deck/multiples";
import { canPairCommanders, pairingCardOf } from "@/lib/deck/pairing";
import {
  sourceTargetsByColour,
  type SpellCost,
} from "@/lib/deck/source-targets";
import {
  buildScryfallNameIndex,
  normalizeImportedName,
  scryfallCollectionLookupName,
} from "@/lib/scryfall/name-index";
import { isBasicLand } from "@/lib/scryfall/type-line";
import type { ScryfallCard } from "@/lib/scryfall/types";
import {
  commanderLegalityProblem,
  describeLegalityProblem,
} from "./commander-legality-problem";
import {
  commandZoneIdentityOf,
  isOutsideCommandZoneIdentity,
  repairedListSize,
  type CommandZoneIdentity,
} from "./generated-deck-construction";
import {
  fitToDeckSize,
  type KeptCard,
  type SourceNeed,
} from "./generated-deck-size";

/** The outcome of checking a generated deck against card data. */
export type GeneratedDeckVerdict =
  | {
      readonly status: "accepted";
      /** The list after repair: every card resolves and is legal, at the exact deck size. */
      readonly deck: AIDeckResponse;
      /** What changed between the model's list and `deck`, in list order. */
      readonly corrections: readonly DeckCorrection[];
    }
  | { readonly status: "rejected"; readonly reasons: readonly string[] };

type Rejected = Extract<GeneratedDeckVerdict, { status: "rejected" }>;

/** The resolved commander and, when the deck has one, its partner or Background. */
interface CommandZone {
  readonly status: "resolved";
  readonly commander: ScryfallCard;
  readonly partner: ScryfallCard | null;
}
type Resolve = (name: string) => ScryfallCard | undefined;

/** The card data a generated deck is checked against, and the day it is read on. */
interface CardData {
  readonly resolve: Resolve;
  /** Today: whether a not-yet-legal card is a preview depends on it (I-73 3.1) */
  readonly today: Date;
}

function rejected(reason: string): Rejected {
  return { status: "rejected", reasons: [reason] };
}

function removal(
  name: string,
  quantity: number,
  reason: DeckRemovalReason
): DeckCorrection {
  return { action: "removed", name, quantity, reason };
}

/**
 * Whether the partner may join the commander: a partner ability allows the
 * pair (CR 702.124), and a partner that is not a Background can be a
 * commander on its own (CR 903.3).
 */
function canShareCommandZone(
  commander: ScryfallCard,
  partner: ScryfallCard
): boolean {
  return (
    canPairCommanders(pairingCardOf(commander), pairingCardOf(partner)) &&
    (isBackground(partner) || isCommanderEligible(partner))
  );
}

/** Why a command-zone card is not legal, or null when it is. */
function legalitySentence(card: ScryfallCard, today: Date): string | null {
  const problem = commanderLegalityProblem(card, today);
  return problem
    ? `${card.name} is ${describeLegalityProblem(problem)}.`
    : null;
}

/** Why a resolved commander cannot lead the deck, or null when it can. */
function commanderProblem(commander: ScryfallCard, today: Date): string | null {
  if (!isCommanderEligible(commander)) {
    return `${commander.name} cannot be a commander.`;
  }
  return legalitySentence(commander, today);
}

/** Why a resolved partner cannot join the commander, or null when it can. */
function partnerProblem(
  partner: ScryfallCard,
  commander: ScryfallCard,
  today: Date
): string | null {
  if (!canShareCommandZone(commander, partner)) {
    return `${partner.name} cannot share the command zone with ${commander.name}.`;
  }
  return legalitySentence(partner, today);
}

/** Resolves the commander and partner, or rejects a command zone no repair can fix. */
function resolveCommandZone(
  deck: AIDeckResponse,
  { resolve, today }: CardData
): CommandZone | Rejected {
  const commander = resolve(deck.commander);
  if (!commander) {
    return rejected(
      `The commander ${deck.commander.trim()} is not a known card.`
    );
  }
  const commanderIssue = commanderProblem(commander, today);
  if (commanderIssue) return rejected(commanderIssue);

  const partnerName = deck.partner?.trim();
  if (!partnerName) return { status: "resolved", commander, partner: null };
  const partner = resolve(partnerName);
  if (!partner) {
    return rejected(`The partner ${partnerName} is not a known card.`);
  }
  const partnerIssue = partnerProblem(partner, commander, today);
  if (partnerIssue) return rejected(partnerIssue);
  return { status: "resolved", commander, partner };
}

/**
 * What a listed card is checked against: the command zone's identity and
 * rulebreaker exceptions (CR 903.5e), its names, and the day.
 */
interface ListRules {
  readonly identity: CommandZoneIdentity;
  readonly commandZoneNames: ReadonlySet<string>;
  readonly today: Date;
}

// Legality is checked before identity and no exception reaches it (CR 113.6n).
function removalCause(
  card: ScryfallCard,
  { identity, commandZoneNames, today }: ListRules
): DeckRemovalCause | null {
  if (commandZoneNames.has(card.name)) return { reason: "commander_in_list" };
  const problem = commanderLegalityProblem(card, today);
  if (problem) return problem;
  if (isOutsideCommandZoneIdentity(card, identity)) {
    return { reason: "outside_color_identity" };
  }
  return null;
}

/** The cost of the face a player casts first: the front face of a card with faces. */
function frontFaceCost(card: ScryfallCard): SpellCost {
  return {
    name: card.name,
    manaCost: card.card_faces?.[0]?.mana_cost ?? card.mana_cost ?? "",
  };
}

/** The colours a card taps for when its front face is a land; empty otherwise. */
function producedColoursOf(card: ScryfallCard): readonly PipColor[] {
  const [frontTypeLine = ""] = card.type_line.split("//", 1);
  if (!/\bLand\b/.test(frontTypeLine)) return [];
  return [
    ...colorsProducedBy({
      typeLine: card.type_line,
      oracleText: card.oracle_text ?? "",
      colorIdentity: card.color_identity,
    }),
  ];
}

/**
 * Each colour of the command zone with its source target, set by the most
 * demanding of the commanders' and the kept cards' costs (I-58 requirement 3).
 */
function sourceNeeds(
  commandZone: readonly ScryfallCard[],
  kept: readonly ScryfallCard[]
): readonly SourceNeed[] {
  const identity = new Set(commandZone.flatMap((card) => card.color_identity));
  const targets = sourceTargetsByColour(
    [...commandZone, ...kept].map(frontFaceCost)
  );
  return PIP_COLORS.filter((colour) => identity.has(colour)).map((colour) => ({
    colour,
    target: targets.get(colour)?.sources ?? 0,
  }));
}

/** Keeps the legal copies of each listed card and records every copy removed. */
function filterListedCards(
  entries: readonly AICard[],
  commandZone: readonly ScryfallCard[],
  { resolve, today }: CardData
): {
  readonly kept: readonly KeptCard[];
  /** The card data of each kept entry, in list order */
  readonly keptCards: readonly ScryfallCard[];
  readonly corrections: readonly DeckCorrection[];
} {
  const rules: ListRules = {
    identity: commandZoneIdentityOf(commandZone),
    commandZoneNames: new Set(commandZone.map((card) => card.name)),
    today,
  };
  const copiesByName = new Map<string, number>();
  const kept: KeptCard[] = [];
  const keptCards: ScryfallCard[] = [];
  const corrections: DeckCorrection[] = [];

  for (const entry of entries) {
    const card = resolve(entry.name);
    if (!card) {
      corrections.push(
        removal(entry.name.trim(), entry.quantity, "unknown_card")
      );
      continue;
    }
    const cause = removalCause(card, rules);
    if (cause) {
      corrections.push({
        action: "removed",
        name: card.name,
        quantity: entry.quantity,
        ...cause,
      });
      continue;
    }

    const copiesSoFar = copiesByName.get(card.name) ?? 0;
    const limit = deckCopyLimit(
      {
        name: card.name,
        typeLine: card.type_line,
        oracleText: card.oracle_text,
      },
      { format: "commander", exceptions: rules.identity.exceptions }
    );
    const quantity = Math.min(entry.quantity, Math.max(0, limit - copiesSoFar));
    if (quantity < entry.quantity) {
      corrections.push(
        removal(card.name, entry.quantity - quantity, "extra_copies")
      );
    }
    if (quantity === 0) continue;

    copiesByName.set(card.name, copiesSoFar + quantity);
    kept.push({
      // The front-face name is the one Scryfall's collection lookup resolves.
      card: {
        name: scryfallCollectionLookupName(card.name),
        quantity,
        category: entry.category,
      },
      isBasicLand: isBasicLand(card.type_line),
      producedColours: producedColoursOf(card),
    });
    keptCards.push(card);
  }

  return { kept, keptCards, corrections };
}

/**
 * Checks a generated deck against card data and repairs what can be repaired.
 *
 * @param deck - The model's reply, already past the shape check of `validateGeneratedDeck`
 * @param cardData - Scryfall cards indexed by `buildScryfallNameIndex`
 * @param today - Now, read as its UTC day: a card Scryfall does not mark legal
 *   whose set releases later is removed as a `preview` with its release day,
 *   not as `not_legal` (I-73 3.5)
 * @returns The repaired deck with every correction made, or the reasons it cannot be repaired
 */
export function checkGeneratedDeckLegality(
  deck: AIDeckResponse,
  cardData: ReadonlyMap<string, ScryfallCard>,
  today: Date
): GeneratedDeckVerdict {
  const data: CardData = {
    resolve: (name) => cardData.get(normalizeImportedName(name)),
    today,
  };
  const commandZone = resolveCommandZone(deck, data);
  if (commandZone.status === "rejected") return commandZone;

  const { commander, partner } = commandZone;
  const commandCards = partner ? [commander, partner] : [commander];
  const listed = filterListedCards(deck.cards, commandCards, data);
  const sized = fitToDeckSize(
    listed.kept,
    repairedListSize(commandCards, listed.kept),
    sourceNeeds(commandCards, listed.keptCards)
  );
  if (sized.status === "rejected") return sized;

  return {
    status: "accepted",
    deck: {
      commander: scryfallCollectionLookupName(commander.name),
      partner: partner ? scryfallCollectionLookupName(partner.name) : null,
      cards: [...sized.cards],
    },
    corrections: [...listed.corrections, ...sized.corrections],
  };
}

/**
 * Resolves every name of a generated deck through Scryfall's collection
 * endpoint, in batches of 75 names, then checks the deck against that data.
 *
 * @param deck - The model's reply, already past the shape check of `validateGeneratedDeck`
 * @param today - Now; the day a preview card's status is read on
 * @returns The verdict of `checkGeneratedDeckLegality`
 * @throws When Scryfall cannot be reached: a deck that was not checked is never accepted
 */
export async function verifyGeneratedDeck(
  deck: AIDeckResponse,
  today: Date = new Date()
): Promise<GeneratedDeckVerdict> {
  const names = new Set(
    [deck.commander, deck.partner ?? "", ...deck.cards.map((card) => card.name)]
      .map((name) => name.trim())
      .filter((name) => name.length > 0)
  );
  const cards = await fetchInBatches([...names].map((name) => ({ name })));
  return checkGeneratedDeckLegality(deck, buildScryfallNameIndex(cards), today);
}
