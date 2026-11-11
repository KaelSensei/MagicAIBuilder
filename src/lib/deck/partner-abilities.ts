/**
 * The partner abilities printed on a card, and the card types the partner
 * rules ask for (CR 702.124).
 *
 * Abilities are read from the Oracle text, one line at a time, not from
 * Scryfall's keyword list: Scryfall also tags every "Partner with" and
 * "Partner—[text]" card with the plain "Partner" keyword, which would merge
 * abilities that CR 702.124f keeps apart.
 *
 * @module deck/partner-abilities
 */

/** The card fields that decide whether two cards can share the command zone. */
export interface PairingCard {
  readonly name: string;
  /** The full type line. A two-faced card is judged by its front face. */
  readonly typeLine: string;
  readonly oracleText: string;
}

/** The "partner—[text]" abilities. CR 702.124i lists exactly these four. */
export type PartnerQuality =
  "Character select" | "Father & son" | "Friends forever" | "Survivors";

const PARTNER_QUALITIES: readonly PartnerQuality[] = [
  "Character select",
  "Father & son",
  "Friends forever",
  "Survivors",
];

/** One partner ability printed on a card (CR 702.124a). */
export type PartnerAbility =
  | { readonly kind: "partner" }
  | { readonly kind: "partnerQuality"; readonly quality: PartnerQuality }
  | { readonly kind: "partnerWith"; readonly name: string }
  | { readonly kind: "chooseBackground" }
  | { readonly kind: "doctorsCompanion" };

const PARTNER_WITH_LINE = /^partner with (.+)$/i;
const PARTNER_QUALITY_LINE = /^partner\s*—\s*(.+)$/i;
const REMINDER_TEXT = /\([^()]*\)$/;
// "Time Lord" is the one creature type two words long (CR 205.3m).
const TIME_LORD = "time lord";

function normalized(text: string): string {
  return text.replaceAll("’", "'").trim().toLowerCase();
}

function qualityNamed(text: string): PartnerQuality | undefined {
  const wanted = normalized(text);
  return PARTNER_QUALITIES.find((quality) => normalized(quality) === wanted);
}

function abilityOnLine(line: string): PartnerAbility | null {
  const text = line.replace(REMINDER_TEXT, "").trim();
  const lower = normalized(text);
  if (lower === "partner") return { kind: "partner" };
  if (lower === "choose a background") return { kind: "chooseBackground" };
  if (lower === "doctor's companion") return { kind: "doctorsCompanion" };
  // Oracle text read "Friends forever" before it became "Partner—Friends
  // forever"; deck rows saved earlier still hold the old line.
  if (lower === "friends forever") {
    return { kind: "partnerQuality", quality: "Friends forever" };
  }
  const partnerWith = PARTNER_WITH_LINE.exec(text);
  if (partnerWith) return { kind: "partnerWith", name: partnerWith[1].trim() };
  const quality = PARTNER_QUALITY_LINE.exec(text);
  const known = quality ? qualityNamed(quality[1]) : undefined;
  return known ? { kind: "partnerQuality", quality: known } : null;
}

/**
 * Reads the partner abilities a card prints, in Oracle order. A card can have
 * more than one, as Amy Pond does (CR 702.124g).
 *
 * @param card - the card to read
 * @returns every partner ability on the card, possibly none
 */
export function readPartnerAbilities(
  card: PairingCard
): readonly PartnerAbility[] {
  return card.oracleText.split("\n").flatMap((line) => {
    const ability = abilityOnLine(line);
    return ability ? [ability] : [];
  });
}

/**
 * Whether two names are one card's name, ignoring case and apostrophe style.
 * A two-faced card also answers to its front face's name.
 *
 * @param cardName - the card's full name
 * @param name - the name to compare, as another card prints it
 * @returns true when the names match
 */
export function isCardNamed(cardName: string, name: string): boolean {
  const wanted = normalized(name);
  const [front] = cardName.split(" // ");
  return normalized(cardName) === wanted || normalized(front) === wanted;
}

interface TypeLineParts {
  /** Supertypes and card types, lower case. */
  readonly types: readonly string[];
  /** Subtypes, lower case, with "time lord" kept as one entry. */
  readonly subtypes: readonly string[];
}

function frontTypeLine(card: PairingCard): TypeLineParts {
  const [front] = card.typeLine.split(" // ");
  const [types, subtypes = ""] = front.toLowerCase().split("—");
  const hasTimeLord = subtypes.includes(TIME_LORD);
  const others = subtypes.replace(TIME_LORD, " ").split(/\s+/).filter(Boolean);
  return {
    types: types.split(/\s+/).filter(Boolean),
    subtypes: hasTimeLord ? [TIME_LORD, ...others] : others,
  };
}

/**
 * Whether a card is a legendary creature card.
 *
 * @param card - the card to check
 * @returns true when its front face is legendary and a creature
 */
export function isLegendaryCreature(card: PairingCard): boolean {
  const { types } = frontTypeLine(card);
  return types.includes("legendary") && types.includes("creature");
}

/**
 * Whether a card is a legendary Background enchantment card, the only card a
 * "choose a Background" commander pairs with (CR 702.124k).
 *
 * @param card - the card to check
 * @returns true for a legendary enchantment with the Background subtype
 */
export function isLegendaryBackground(card: PairingCard): boolean {
  const { types, subtypes } = frontTypeLine(card);
  return (
    types.includes("legendary") &&
    types.includes("enchantment") &&
    subtypes.includes("background")
  );
}

/**
 * Whether a card is a legendary Time Lord Doctor creature card with no other
 * creature types, the only card a Doctor's companion pairs with (CR 702.124m).
 *
 * @param card - the card to check
 * @returns true when its creature types are exactly Time Lord and Doctor
 */
export function isTimeLordDoctor(card: PairingCard): boolean {
  const { subtypes } = frontTypeLine(card);
  return (
    isLegendaryCreature(card) &&
    subtypes.length === 2 &&
    subtypes.includes(TIME_LORD) &&
    subtypes.includes("doctor")
  );
}
