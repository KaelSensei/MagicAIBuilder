/**
 * What a card package would do to a deck before it is applied: each card is
 * ready or blocked by a ban, the colour identity, or a copy limit.
 *
 * Community context; read by the package preview and apply routes. Identity is
 * the deck's rule (`lib/deck/color-identity`, CR 903.5c and a rulebreaker
 * commander's exceptions, CR 903.5e), and the copy limit is the deck's
 * (`deckCopyLimit`, CR 903.5b). A ban is never lifted (CR 113.6n).
 * The copies the limit weighs are the editor's count for an add to the main
 * deck (`copiesCountedFor`): the main deck, the sideboard and the command zone
 * (CR 100.2a, CR 100.4a, CR 903.5b), never Considering.
 *
 * @module community/card-package-preview
 */
import {
  commanderNameExceptions,
  isOutsideDeckIdentity,
  type DeckIdentityRule,
} from "@/lib/deck/color-identity";
import type { DeckFormat } from "@/lib/deck/formats";
import { getFormatConfig } from "@/lib/deck/formats";
import { deckCopyLimit } from "@/lib/deck/multiples";
import { isCommanderRow } from "@/lib/deck/bulk-edit-command-zone";
import { copiesCountedFor, type CountedCopiesDeck } from "@/lib/deck/counted-copies";
import { countedDeckOf, type CopiesRow } from "@/lib/deck/copy-room-write";
import type { DeckZone } from "@/lib/deck/types";

export interface PackagePreviewCard {
  readonly scryfallId: string;
  readonly name: string;
  readonly quantity: number;
  readonly colorIdentity: readonly string[];
  readonly isBanned: boolean;
  readonly isBasicLand: boolean;
  readonly oracleText?: string;
  readonly isRestricted?: boolean;
  /** The card's type line; without it no rulebreaker exception admits the card */
  readonly typeLine?: string;
  /** The card's mana value (CR 202.3) */
  readonly manaValue?: number;
}

/** The zone a package's cards go to: the apply route writes them there. */
export const PACKAGE_ZONE: DeckZone = "main";

export interface PackagePreviewContext {
  readonly format: DeckFormat;
  readonly commanderColorIdentity: readonly string[];
  /** The deck's rows with their zones, and its commander and partner, as the copy limit counts them */
  readonly deck: CountedCopiesDeck;
  /** The commander's and partner's names, for a rulebreaker's exceptions (CR 903.5e) */
  readonly commandZoneNames?: readonly string[];
}

export type PackagePreviewIssueKind = "banned" | "colorIdentity" | "singleton" | "copyLimit";

export interface PackagePreviewIssue {
  readonly kind: PackagePreviewIssueKind;
  readonly message: string;
}

export interface PackageCardPreview {
  readonly scryfallId: string;
  readonly name: string;
  readonly quantity: number;
  readonly status: "ready" | "blocked";
  readonly issues: readonly PackagePreviewIssue[];
}

export interface CardPackagePreview {
  readonly readyCount: number;
  readonly blockedCount: number;
  readonly cards: readonly PackageCardPreview[];
}

/** Preview deterministic package violations without mutating the target deck. */
function previewCardIssues(
  card: PackagePreviewCard,
  context: PackagePreviewContext,
  identity: DeckIdentityRule,
  quantity: number
): PackagePreviewIssue[] {
  const config = getFormatConfig(context.format);
  const issues: PackagePreviewIssue[] = [];
  if (card.isBanned) {
    issues.push({ kind: "banned", message: `${card.name} is banned in ${config.label}` });
  }
  const identityCard = {
    colorIdentity: card.colorIdentity,
    typeLine: card.typeLine ?? "",
    cmc: card.manaValue ?? 0,
  };
  if (config.hasColorIdentity && isOutsideDeckIdentity(identity, identityCard)) {
    issues.push({ kind: "colorIdentity", message: `${card.name} is outside the deck's color identity` });
  }
  const limit = card.isRestricted
    ? 1
    : deckCopyLimit(
        { name: card.name, typeLine: identityCard.typeLine, oracleText: card.oracleText },
        { format: context.format, exceptions: identity.exceptions }
      );
  if (!card.isBasicLand && quantity > limit) {
    issues.push(config.isSingleton && limit === 1
      ? { kind: "singleton", message: `${card.name} exceeds the singleton limit` }
      : { kind: "copyLimit", message: `${card.name} exceeds the ${limit}-copy limit` });
  }
  return issues;
}

/**
 * The names of a stored deck's commander and partner: a rulebreaker in the 99
 * grants nothing (CR 903.5e).
 *
 * @param cards - The deck's rows with their command-zone flags
 * @returns The command zone's names, in deck order
 */
export function commandZoneNamesOf(
  cards: readonly { readonly name: string; readonly isCommander: boolean; readonly isPartner: boolean }[]
): readonly string[] {
  return cards.filter(isCommanderRow).map((card) => card.name);
}

/** A stored deck row as the package preview reads it: its copies, zone, slot flags and colours. */
export interface PackageDeckRow extends CopiesRow {
  readonly colorIdentity: readonly string[];
}

/**
 * The preview context of a stored deck. The preview and apply routes both
 * build it here, so the cards a player sees as ready are the cards the apply
 * adds.
 *
 * @param format - The deck's format, already parsed
 * @param rows - Every stored row of the deck, command zone included
 * @returns The context `previewCardPackage` reads
 */
export function packagePreviewContextOf(
  format: DeckFormat,
  rows: readonly PackageDeckRow[]
): PackagePreviewContext {
  // CR 903.4: the commanders' colour identity bounds the deck.
  const commanderColors = rows.filter(isCommanderRow).flatMap((row) => row.colorIdentity);
  return {
    format,
    commanderColorIdentity: [...new Set(commanderColors)],
    commandZoneNames: commandZoneNamesOf(rows),
    deck: countedDeckOf(rows),
  };
}

export function previewCardPackage(
  cards: readonly PackagePreviewCard[],
  context: PackagePreviewContext
): CardPackagePreview {
  const identity: DeckIdentityRule = {
    // A stored "C" means colourless, which every deck allows.
    colors: new Set([...context.commanderColorIdentity, "C"]),
    exceptions: commanderNameExceptions(context.commandZoneNames ?? []),
  };
  // A ready card's copies count against the package's later cards of its name.
  const quantities = new Map<string, number>();
  const heldCopies = (name: string) =>
    quantities.get(name) ?? copiesCountedFor(context.deck, name, PACKAGE_ZONE);
  const previews: PackageCardPreview[] = [];
  let readyCount = 0;

  for (const card of cards) {
    const quantity = heldCopies(card.name) + card.quantity;
    const issues = previewCardIssues(card, context, identity, quantity);
    if (issues.length === 0) {
      quantities.set(card.name, quantity);
      readyCount += 1;
    }
    previews.push({
      scryfallId: card.scryfallId,
      name: card.name,
      quantity: card.quantity,
      status: issues.length === 0 ? "ready" : "blocked",
      issues,
    });
  }

  return { readyCount, blockedCount: previews.length - readyCount, cards: previews };
}
