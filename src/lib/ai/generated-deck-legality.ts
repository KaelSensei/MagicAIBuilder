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
 *   commander repeated in the list.
 * - The list is then brought to the exact deck size with basic lands
 *   (`generated-deck-size.ts`).
 * - Every change is returned as a correction so the player sees it.
 *
 * @module ai/generated-deck-legality
 */
import type {
  AICard,
  AIDeckResponse,
  DeckCorrection,
  DeckRemovalReason,
} from "@/app/api/ai/build/types";
import { fetchInBatches } from "@/lib/deck/batch-fetch";
import { isCardOutsideColorIdentity } from "@/lib/deck/color-identity";
import {
  isBackground,
  isCommanderEligible,
} from "@/lib/deck/commander-eligibility";
import { getFormatConfig } from "@/lib/deck/formats";
import { PIP_COLORS } from "@/lib/deck/mana-alignment";
import { maxQuantity } from "@/lib/deck/multiples";
import { canPairWith, detectPairingType } from "@/lib/deck/pairing";
import {
  buildScryfallNameIndex,
  normalizeImportedName,
  scryfallCollectionLookupName,
} from "@/lib/scryfall/name-index";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { fitToDeckSize, type KeptCard } from "./generated-deck-size";

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

const COMMANDER_DECK_SIZE = getFormatConfig("commander").deckSize;

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

function commanderLegalityProblem(
  card: ScryfallCard
): "banned" | "not_legal" | null {
  const legality = card.legalities?.commander;
  if (legality === "legal") return null;
  return legality === "banned" ? "banned" : "not_legal";
}

function describeLegalityProblem(problem: "banned" | "not_legal"): string {
  return problem === "banned" ? "banned" : "not legal";
}

/** A Background only fits beside a "Choose a Background" commander; other pairs use the editor's pairing rules. */
function canShareCommandZone(
  commander: ScryfallCard,
  partner: ScryfallCard
): boolean {
  const commanderPairing = detectPairingType(commander);
  if (commanderPairing === "background") return isBackground(partner);
  const partnerPairing = detectPairingType(partner);
  return (
    partner.name !== commander.name &&
    isCommanderEligible(partner) &&
    (canPairWith(commanderPairing, partnerPairing) ||
      canPairWith(partnerPairing, commanderPairing))
  );
}

/** Why a resolved commander cannot lead the deck, or null when it can. */
function commanderProblem(commander: ScryfallCard): string | null {
  if (!isCommanderEligible(commander)) {
    return `${commander.name} cannot be a commander.`;
  }
  const problem = commanderLegalityProblem(commander);
  return problem
    ? `${commander.name} is ${describeLegalityProblem(problem)} in Commander.`
    : null;
}

/** Why a resolved partner cannot join the commander, or null when it can. */
function partnerProblem(
  partner: ScryfallCard,
  commander: ScryfallCard
): string | null {
  if (!canShareCommandZone(commander, partner)) {
    return `${partner.name} cannot share the command zone with ${commander.name}.`;
  }
  const problem = commanderLegalityProblem(partner);
  return problem
    ? `${partner.name} is ${describeLegalityProblem(problem)} in Commander.`
    : null;
}

/** Resolves the commander and partner, or rejects a command zone no repair can fix. */
function resolveCommandZone(
  deck: AIDeckResponse,
  resolve: Resolve
): CommandZone | Rejected {
  const commander = resolve(deck.commander);
  if (!commander) {
    return rejected(
      `The commander ${deck.commander.trim()} is not a known card.`
    );
  }
  const commanderIssue = commanderProblem(commander);
  if (commanderIssue) return rejected(commanderIssue);

  const partnerName = deck.partner?.trim();
  if (!partnerName) return { status: "resolved", commander, partner: null };
  const partner = resolve(partnerName);
  if (!partner) {
    return rejected(`The partner ${partnerName} is not a known card.`);
  }
  const partnerIssue = partnerProblem(partner, commander);
  if (partnerIssue) return rejected(partnerIssue);
  return { status: "resolved", commander, partner };
}

function removalReason(
  card: ScryfallCard,
  identity: ReadonlySet<string>,
  commandZoneNames: ReadonlySet<string>
): DeckRemovalReason | null {
  if (commandZoneNames.has(card.name)) return "commander_in_list";
  const problem = commanderLegalityProblem(card);
  if (problem) return problem;
  if (
    isCardOutsideColorIdentity(identity, { colorIdentity: card.color_identity })
  ) {
    return "outside_color_identity";
  }
  return null;
}

/** Keeps the legal copies of each listed card and records every copy removed. */
function filterListedCards(
  entries: readonly AICard[],
  commandZone: readonly ScryfallCard[],
  resolve: Resolve
): {
  readonly kept: readonly KeptCard[];
  readonly corrections: readonly DeckCorrection[];
} {
  const identity: ReadonlySet<string> = new Set(
    commandZone.flatMap((card) => card.color_identity)
  );
  const commandZoneNames: ReadonlySet<string> = new Set(
    commandZone.map((card) => card.name)
  );
  const copiesByName = new Map<string, number>();
  const kept: KeptCard[] = [];
  const corrections: DeckCorrection[] = [];

  for (const entry of entries) {
    const card = resolve(entry.name);
    if (!card) {
      corrections.push(
        removal(entry.name.trim(), entry.quantity, "unknown_card")
      );
      continue;
    }
    const reason = removalReason(card, identity, commandZoneNames);
    if (reason) {
      corrections.push(removal(card.name, entry.quantity, reason));
      continue;
    }

    const copiesSoFar = copiesByName.get(card.name) ?? 0;
    const limit = maxQuantity(
      card.name,
      card.type_line,
      card.oracle_text ?? "",
      "commander"
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
      isBasicLand: card.type_line.toLowerCase().includes("basic land"),
    });
  }

  return { kept, corrections };
}

/**
 * Checks a generated deck against card data and repairs what can be repaired.
 *
 * @param deck - The model's reply, already past the shape check of `validateGeneratedDeck`
 * @param cardData - Scryfall cards indexed by `buildScryfallNameIndex`
 * @returns The repaired deck with every correction made, or the reasons it cannot be repaired
 */
export function checkGeneratedDeckLegality(
  deck: AIDeckResponse,
  cardData: ReadonlyMap<string, ScryfallCard>
): GeneratedDeckVerdict {
  const resolve: Resolve = (name) => cardData.get(normalizeImportedName(name));
  const commandZone = resolveCommandZone(deck, resolve);
  if (commandZone.status === "rejected") return commandZone;

  const { commander, partner } = commandZone;
  const commandCards = partner ? [commander, partner] : [commander];
  const listed = filterListedCards(deck.cards, commandCards, resolve);
  const identity = new Set(commandCards.flatMap((card) => card.color_identity));
  const sized = fitToDeckSize(
    listed.kept,
    COMMANDER_DECK_SIZE - commandCards.length,
    PIP_COLORS.filter((color) => identity.has(color))
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
 * @returns The verdict of `checkGeneratedDeckLegality`
 * @throws When Scryfall cannot be reached: a deck that was not checked is never accepted
 */
export async function verifyGeneratedDeck(
  deck: AIDeckResponse
): Promise<GeneratedDeckVerdict> {
  const names = new Set(
    [deck.commander, deck.partner ?? "", ...deck.cards.map((card) => card.name)]
      .map((name) => name.trim())
      .filter((name) => name.length > 0)
  );
  const cards = await fetchInBatches([...names].map((name) => ({ name })));
  return checkGeneratedDeckLegality(deck, buildScryfallNameIndex(cards));
}
