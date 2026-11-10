/**
 * Commander pairing: whether two cards can share the command zone, and which
 * partner ability lets them (CR 702.124).
 *
 * This module is the single place that decides a pairing. The deck store,
 * the bulk editor, the AI build check and the deck API all ask it. Commander
 * eligibility (CR 903.3) is a separate check, in `commander-eligibility.ts`.
 *
 * @module deck/pairing
 */
import type { ScryfallCard } from "@/lib/scryfall/types";
import type { CommanderPairingType } from "./types";
import {
  isCardNamed,
  isLegendaryBackground,
  isLegendaryCreature,
  isTimeLordDoctor,
  readPartnerAbilities,
  type PairingCard,
  type PartnerAbility,
  type PartnerQuality,
} from "./partner-abilities";

/** The pairing two commanders use: every pairing type but "none". */
export type CommanderPairing = Exclude<CommanderPairingType, "none">;

/** What the second commander must be, for one way a commander can pair. */
export type PartnerRequirement =
  | { readonly kind: "partner" }
  | { readonly kind: "partnerQuality"; readonly quality: PartnerQuality }
  | { readonly kind: "namedPartner"; readonly name: string }
  | { readonly kind: "background" }
  | { readonly kind: "backgroundChooser" }
  | { readonly kind: "timeLordDoctor" }
  | { readonly kind: "doctorsCompanion" };

const QUALITY_PAIRING: Readonly<Record<PartnerQuality, CommanderPairing>> = {
  "Character select": "character_select",
  "Father & son": "father_son",
  "Friends forever": "friends_forever",
  Survivors: "survivors",
};

function requirementOf(ability: PartnerAbility): PartnerRequirement {
  switch (ability.kind) {
    case "partner":
      return { kind: "partner" };
    case "partnerQuality":
      return { kind: "partnerQuality", quality: ability.quality };
    case "partnerWith":
      return { kind: "namedPartner", name: ability.name };
    case "chooseBackground":
      return { kind: "background" };
    case "doctorsCompanion":
      return { kind: "timeLordDoctor" };
    default: {
      const exhaustive: never = ability;
      return exhaustive;
    }
  }
}

/**
 * Lists every way a commander can take a second commander, in Oracle order.
 *
 * @param card - the commander
 * @returns one requirement per pairing it allows, empty when it allows none
 */
export function partnerRequirements(
  card: PairingCard
): readonly PartnerRequirement[] {
  const fromAbilities = readPartnerAbilities(card).map(requirementOf);
  // CR 702.124k: a Background has no partner ability, yet it is a commander
  // beside a commander that has "choose a Background".
  if (isLegendaryBackground(card)) {
    return [...fromAbilities, { kind: "backgroundChooser" }];
  }
  // CR 702.124m: a Time Lord Doctor has no partner ability, yet a Doctor's
  // companion can be the commander beside it.
  if (isTimeLordDoctor(card)) {
    return [...fromAbilities, { kind: "doctorsCompanion" }];
  }
  return fromAbilities;
}

function hasAbility(
  card: PairingCard,
  matches: (ability: PartnerAbility) => boolean
): boolean {
  return readPartnerAbilities(card).some(matches);
}

function meetsRequirement(
  requirement: PartnerRequirement,
  candidate: PairingCard,
  holder: PairingCard
): boolean {
  switch (requirement.kind) {
    // CR 702.124h: partner pairs only with another card that has partner.
    case "partner":
      return hasAbility(candidate, (ability) => ability.kind === "partner");
    // CR 702.124i: partner—[text] pairs only with the same partner—[text].
    case "partnerQuality":
      return hasAbility(
        candidate,
        (ability) =>
          ability.kind === "partnerQuality" &&
          ability.quality === requirement.quality
      );
    // CR 702.124j: each card has "partner with" naming the other.
    case "namedPartner":
      return (
        isCardNamed(candidate.name, requirement.name) &&
        hasAbility(
          candidate,
          (ability) =>
            ability.kind === "partnerWith" &&
            isCardNamed(holder.name, ability.name)
        )
      );
    // CR 702.124k: the other card is a legendary Background enchantment card.
    case "background":
      return isLegendaryBackground(candidate);
    case "backgroundChooser":
      return hasAbility(
        candidate,
        (ability) => ability.kind === "chooseBackground"
      );
    // CR 702.124m: both are legendary creature cards, and the other is a
    // Time Lord Doctor with no other creature types.
    case "timeLordDoctor":
      return isLegendaryCreature(holder) && isTimeLordDoctor(candidate);
    case "doctorsCompanion":
      return (
        isLegendaryCreature(candidate) &&
        hasAbility(candidate, (ability) => ability.kind === "doctorsCompanion")
      );
    default: {
      const exhaustive: never = requirement;
      return exhaustive;
    }
  }
}

function pairingOf(requirement: PartnerRequirement): CommanderPairing {
  switch (requirement.kind) {
    case "partner":
      return "partner";
    case "partnerQuality":
      return QUALITY_PAIRING[requirement.quality];
    case "namedPartner":
      return "partner_with";
    case "background":
    case "backgroundChooser":
      return "background";
    case "timeLordDoctor":
    case "doctorsCompanion":
      return "doctor";
    default: {
      const exhaustive: never = requirement;
      return exhaustive;
    }
  }
}

/**
 * Finds the partner ability that lets two cards be one deck's two commanders.
 * Either card may sit in the commander slot: the answer does not depend on
 * the order.
 *
 * @param a - one commander
 * @param b - the other commander
 * @returns the pairing they use, or null when no partner ability allows it
 */
export function pairCommanders(
  a: PairingCard,
  b: PairingCard
): CommanderPairing | null {
  // CR 903.5b: a Commander deck holds one card of each English name.
  if (isCardNamed(a.name, b.name)) return null;
  // CR 702.124f and 702.124g: abilities never combine, but a card with two
  // partner abilities may use either one.
  const used = partnerRequirements(a).find((requirement) =>
    meetsRequirement(requirement, b, a)
  );
  return used ? pairingOf(used) : null;
}

/**
 * Whether two cards can be one deck's two commanders (CR 702.124).
 *
 * @param a - one commander
 * @param b - the other commander
 * @returns true when a partner ability allows the pair
 */
export function canPairCommanders(a: PairingCard, b: PairingCard): boolean {
  return pairCommanders(a, b) !== null;
}

/**
 * The second commander slot a lone commander opens: its first pairing in
 * Oracle order. The pairing a pair actually uses comes from `pairCommanders`.
 *
 * @param card - the commander
 * @returns its pairing type, or "none" when it cannot take a second commander
 */
export function detectPairingType(card: PairingCard): CommanderPairingType {
  const [first] = partnerRequirements(card);
  return first ? pairingOf(first) : "none";
}

/**
 * The pairing fields of a Scryfall card.
 *
 * @param card - Scryfall card data
 * @returns its name, type line and Oracle text (the front face's for a two-faced card)
 */
export function pairingCardOf(card: ScryfallCard): PairingCard {
  const front = card.card_faces?.[0];
  return {
    name: card.name,
    typeLine: card.type_line,
    oracleText: card.oracle_text ?? front?.oracle_text ?? "",
  };
}

/** Human-readable label for the partner slot based on pairing type */
export function partnerSlotLabel(pairingType: CommanderPairingType): string {
  switch (pairingType) {
    case "partner":
      return "Partner";
    case "partner_with":
      return "Partner With";
    case "friends_forever":
      return "Friends Forever";
    case "background":
      return "Background";
    case "doctor":
      return "Doctor's Companion";
    case "character_select":
      return "Character Select Partner";
    case "father_son":
      return "Father & Son Partner";
    case "survivors":
      return "Survivors Partner";
    default:
      return "Partner";
  }
}

/** Whether this commander supports a 2nd commander slot */
export function supportsPartner(pairingType: CommanderPairingType): boolean {
  return pairingType !== "none";
}
