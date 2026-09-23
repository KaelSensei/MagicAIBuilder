import type { DeckFormat } from "@/lib/deck/formats";
import { getFormatConfig } from "@/lib/deck/formats";

export interface PackagePreviewCard {
  readonly scryfallId: string;
  readonly name: string;
  readonly quantity: number;
  readonly colorIdentity: readonly string[];
  readonly isBanned: boolean;
  readonly isBasicLand: boolean;
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

export type PackagePreviewIssueKind = "banned" | "colorIdentity" | "singleton";

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
  const existingNames = new Set(context.existingCards.map((card) => card.name));
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
    if (config.isSingleton && !card.isBasicLand && existingNames.has(card.name)) {
      issues.push({ kind: "singleton", message: `${card.name} is already in the deck` });
    }

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
