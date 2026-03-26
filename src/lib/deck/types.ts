// Core deck and card types for MagicAIBuilder
export type CardCategory = | "commander" | "companion" | "creature" | "instant" | "sorcery" | "artifact" | "enchantment" | "planeswalker" | "land" | "ramp" | "draw" | "removal" | "boardWipe" | "winCondition" | "protection" | "other";
export interface CardFace { name: string; manaCost: string; typeLine: string; oracleText: string; imageUri: string; artCropUri: string; }
export interface DeckCard {
  id: string; scryfallId?: string; name: string; manaCost: string; cmc: number;
  typeLine: string; oracleText: string; colorIdentity: string[];
  isGameChanger: boolean; isBanned: boolean; price: number | null;
  imageUri: string; artCropUri: string; category: CardCategory;
  quantity: number; notes?: string | null; zone: "main" | "sideboard" | "maybeboard";
  isMaybeboard?: boolean; layout?: string; cardFaces?: [CardFace, CardFace]; isFlexibleLand?: boolean;
}
export type CommanderPairingType = | "none" | "partner" | "partner_with" | "friends_forever" | "background" | "doctor" | "character_select";
export interface Deck {
  id: string; name: string; commander: DeckCard | null; partner: DeckCard | null;
  companion: DeckCard | null; pairingType: CommanderPairingType;
  cards: DeckCard[]; maybeboard: DeckCard[]; format: "commander" | "brawl";
  targetBracket: 1|2|3|4; manualBracket: 1|2|3|4|null; budget: number | null;
  description: string; tags: string[]; shareToken: string | null;
  shareEnabled: boolean; isAIGenerated: boolean; createdAt: Date; updatedAt: Date;
}
export interface DeckStats {
  totalCards: number; lands: number; creatures: number; ramp: number; draw: number;
  removal: number; boardWipes: number; avgCmc: number;
  manaCurve: Record<number, number>; colorDistribution: Record<string, number>;
  gameChangersCount: number; gameChangersList: string[]; totalPrice: number;
  overBudgetCards: string[]; bannedCards: string[]; colorIdentityViolations: string[];
  themes?: import("./themes").DetectedTheme[];
  flexibleLands: number;
}
export interface BracketScore {
  overall: 1|2|3|4;
  dimensions: { ramp: number; draw: number; removal: number; tutors: number; winSpeed: number; avgCmc: number };
  gameChangers: number; twoCardInfiniteCombos: number; warnings: string[];
}
export interface PlaytestState { hand: DeckCard[]; library: DeckCard[]; turn: number; mulliganCount: number; }
export type ViewMode = "grid" | "list";
export interface SearchFilters {
  colors: string[]; types: string[]; cmcMin: number|null; cmcMax: number|null;
  priceMax: number|null; collectionOnly?: boolean;
}
