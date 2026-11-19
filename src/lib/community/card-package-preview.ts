/**
 * What a card package would do to a deck before it is applied: each card is
 * ready or blocked by a ban, the colour identity, or a copy limit.
 *
 * Community context; read by the package preview and apply routes. Identity is
 * the deck's rule (`lib/deck/color-identity`, CR 903.5c and a rulebreaker
 * commander's exceptions, CR 903.5e), and the copy limit is the deck's
 * (`deckCopyLimit`, CR 903.5b). A ban is never lifted (CR 113.6n).
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

export interface ExistingPreviewCard {
  readonly name: string;
  readonly quantity: number;
  readonly isBasicLand: boolean;
}

export interface PackagePreviewContext {
  readonly format: DeckFormat;
  readonly commanderColorIdentity: readonly string[];
  readonly existingCards: readonly ExistingPreviewCard[];
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

export function previewCardPackage(
  cards: readonly PackagePreviewCard[],
  context: PackagePreviewContext
): CardPackagePreview {
  const identity: DeckIdentityRule = {
    // A stored "C" means colourless, which every deck allows.
    colors: new Set([...context.commanderColorIdentity, "C"]),
    exceptions: commanderNameExceptions(context.commandZoneNames ?? []),
  };
  const quantities = new Map<string, number>();
  for (const card of context.existingCards) {
    quantities.set(card.name, (quantities.get(card.name) ?? 0) + card.quantity);
  }
  const previews: PackageCardPreview[] = [];
  let readyCount = 0;

  for (const card of cards) {
    const quantity = (quantities.get(card.name) ?? 0) + card.quantity;
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
