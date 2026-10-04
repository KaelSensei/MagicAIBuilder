import type { DeckFormat } from "@/lib/deck/formats";
import { getFormatConfig } from "@/lib/deck/formats";
import { maxQuantity } from "@/lib/deck/multiples";

export interface PackagePreviewCard {
  readonly scryfallId: string;
  readonly name: string;
  readonly quantity: number;
  readonly colorIdentity: readonly string[];
  readonly isBanned: boolean;
  readonly isBasicLand: boolean;
  readonly oracleText?: string;
  readonly isRestricted?: boolean;
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
export function previewCardPackage(
  cards: readonly PackagePreviewCard[],
  context: PackagePreviewContext
): CardPackagePreview {
  const config = getFormatConfig(context.format);
  const allowedColors = new Set(context.commanderColorIdentity);
  const quantities = new Map<string, number>();
  for (const card of context.existingCards) {
    quantities.set(card.name, (quantities.get(card.name) ?? 0) + card.quantity);
  }
  const previews: PackageCardPreview[] = [];
  let readyCount = 0;

  for (const card of cards) {
    const issues: PackagePreviewIssue[] = [];
    if (card.isBanned) {
      issues.push({ kind: "banned", message: `${card.name} is banned in ${config.label}` });
    }
    if (
      config.hasColorIdentity &&
      card.colorIdentity.some((color) => color !== "C" && !allowedColors.has(color))
    ) {
      issues.push({
        kind: "colorIdentity",
        message: `${card.name} is outside the deck's color identity`,
      });
    }
    const quantity = (quantities.get(card.name) ?? 0) + card.quantity;
    const limit = card.isRestricted ? 1 : maxQuantity(card.name, "", card.oracleText ?? "", context.format);
    if (!card.isBasicLand && quantity > limit) {
      issues.push(config.isSingleton && limit === 1
        ? { kind: "singleton", message: `${card.name} exceeds the singleton limit` }
        : { kind: "copyLimit", message: `${card.name} exceeds the ${limit}-copy limit` });
    }
    quantities.set(card.name, quantity);

    if (issues.length === 0) readyCount += 1;
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
