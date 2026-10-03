import type { DeckFormat } from "@/lib/deck/formats";
import { getCardCollection } from "@/lib/scryfall/client";

export interface StoredPackageCard {
  readonly scryfallId: string;
  readonly name: string;
  readonly quantity: number;
  readonly colorIdentity: readonly string[];
  readonly isBanned: boolean;
  readonly isBasicLand: boolean;
  readonly imageUri?: string;
}

export interface VerifiedPackageCard extends StoredPackageCard {
  readonly imageUri: string;
}

/** Resolve legality from Scryfall at review time; stored package metadata is user input. */
export async function verifyPackageCards(
  cards: readonly StoredPackageCard[],
  format: DeckFormat
): Promise<readonly VerifiedPackageCard[]> {
  const ids = [...new Set(cards.map((card) => card.scryfallId))];
  const verified = new Map<string, VerifiedPackageCard>();

  for (let offset = 0; offset < ids.length; offset += 75) {
    const result = await getCardCollection(
      ids.slice(offset, offset + 75).map((id) => ({ id }))
    );
    for (const card of result.data) {
      const legality = card.legalities?.[format];
      verified.set(card.id, {
        scryfallId: card.id,
        name: card.name,
        quantity: 1,
        colorIdentity: card.color_identity,
        isBanned: legality !== "legal" && legality !== "restricted",
        isBasicLand: /\bbasic land\b/i.test(card.type_line),
        imageUri: card.image_uris?.normal ?? card.card_faces?.[0]?.image_uris?.normal ?? "",
      });
    }
  }

  return cards.map((stored) => {
    const card = verified.get(stored.scryfallId);
    if (!card) throw new Error("Unable to verify package card");
    return { ...card, quantity: stored.quantity };
  });
}
