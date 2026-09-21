import type { DeckZone } from "./types";

/** Minimal public deck shape needed to create an attributed fork. */
export interface ForkSourceDeck {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly format: string;
  readonly targetBracket: number;
  readonly manualBracket: number | null;
  readonly budget: number | null;
  readonly commanderId: string | null;
  readonly commanderName: string | null;
  readonly partnerId: string | null;
  readonly companionId: string | null;
  readonly pairingType: string;
  readonly userId: string | null;
  readonly userName: string | null;
  readonly isPublic?: boolean;
  readonly shareEnabled?: boolean;
  readonly cards: readonly ForkSourceCard[];
}

interface ForkSourceCard {
  readonly scryfallId: string;
  readonly name: string;
  readonly manaCost: string;
  readonly cmc: number;
  readonly typeLine: string;
  readonly oracleText: string;
  readonly power: string | null;
  readonly toughness: string | null;
  readonly colorIdentity: readonly string[];
  readonly isGameChanger: boolean;
  readonly isBanned: boolean;
  readonly price: number | null;
  readonly imageUri: string;
  readonly artCropUri: string;
  readonly category: string;
  readonly quantity: number;
  readonly isCommander: boolean;
  readonly isPartner: boolean;
  readonly zone: DeckZone;
  readonly notes?: string | null;
}

interface ForkCardData {
  readonly scryfallId: string;
  readonly name: string;
  readonly manaCost: string;
  readonly cmc: number;
  readonly typeLine: string;
  readonly oracleText: string;
  readonly power: string | null;
  readonly toughness: string | null;
  readonly colorIdentity: string[];
  readonly isGameChanger: boolean;
  readonly isBanned: boolean;
  readonly price: number | null;
  readonly imageUri: string;
  readonly artCropUri: string;
  readonly category: string;
  readonly quantity: number;
  readonly isCommander: boolean;
  readonly isPartner: boolean;
  readonly zone: DeckZone;
  readonly notes: string | null | undefined;
}

export interface ForkData {
  readonly name: string;
  readonly description: string | null;
  readonly format: string;
  readonly targetBracket: number;
  readonly manualBracket: number | null;
  readonly budget: number | null;
  readonly commanderId: string | null;
  readonly commanderName: string | null;
  readonly partnerId: string | null;
  readonly companionId: string | null;
  readonly pairingType: string;
  readonly userId: string;
  readonly shareToken: null;
  readonly shareEnabled: false;
  readonly isPublic: false;
  readonly forkedFromDeckId: string;
  readonly forkedFromDeckName: string;
  readonly forkedFromUserName: string | null;
  readonly cards: readonly ForkCardData[];
}

/**
 * Build a private, attributed copy of a public deck.
 *
 * @param source - public deck and its complete card list
 * @param userId - account that will own the new deck
 * @returns Prisma-compatible deck creation data
 */
export function buildForkData(source: ForkSourceDeck, userId: string): ForkData {
  return {
    name: `${source.name} (Fork)`,
    description: source.description,
    format: source.format,
    targetBracket: source.targetBracket,
    manualBracket: source.manualBracket,
    budget: source.budget,
    commanderId: source.commanderId,
    commanderName: source.commanderName,
    partnerId: source.partnerId,
    companionId: source.companionId,
    pairingType: source.pairingType,
    userId,
    shareToken: null,
    shareEnabled: false,
    isPublic: false,
    forkedFromDeckId: source.id,
    forkedFromDeckName: source.name,
    forkedFromUserName: source.userName,
    cards: source.cards.map((card) => ({
      scryfallId: card.scryfallId,
      name: card.name,
      manaCost: card.manaCost,
      cmc: card.cmc,
      typeLine: card.typeLine,
      oracleText: card.oracleText,
      power: card.power,
      toughness: card.toughness,
      colorIdentity: [...card.colorIdentity],
      isGameChanger: card.isGameChanger,
      isBanned: card.isBanned,
      price: card.price,
      imageUri: card.imageUri,
      artCropUri: card.artCropUri,
      category: card.category,
      quantity: card.quantity,
      isCommander: card.isCommander,
      isPartner: card.isPartner,
      zone: card.zone,
      notes: card.notes,
    })),
  };
}
