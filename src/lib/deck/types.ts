// Core deck and card types for MagicAIBuilder
export type CardCategory = | "commander" | "companion" | "creature" | "instant" | "sorcery" | "artifact" | "enchantment" | "planeswalker" | "land" | "ramp" | "draw" | "removal" | "boardWipe" | "winCondition" | "protection" | "other";
export type DeckZone = "main" | "sideboard" | "maybeboard";
export type BracketLevel = 1 | 2 | 3 | 4;
export interface CardFace { name: string; manaCost: string; typeLine: string; oracleText: string; imageUri: string; artCropUri: string; }
export interface DeckCard {
  id: string; scryfallId?: string; name: string; manaCost: string; cmc: number;
  typeLine: string; oracleText: string; colorIdentity: string[];
  isGameChanger: boolean; isBanned: boolean; price: number | null;
  imageUri: string; artCropUri: string; category: CardCategory;
  quantity: number; notes?: string | null; zone: DeckZone;
  isMaybeboard?: boolean; layout?: string; cardFaces?: [CardFace, CardFace]; isFlexibleLand?: boolean;
}
export type CommanderPairingType = | "none" | "partner" | "partner_with" | "friends_forever" | "background" | "doctor" | "character_select";
export interface Deck {
  id: string; name: string; commander: DeckCard | null; partner: DeckCard | null;
  companion: DeckCard | null; pairingType: CommanderPairingType;
  cards: DeckCard[]; maybeboard: DeckCard[]; format: "commander" | "brawl";
  targetBracket: 1|2|3|4; manualBracket: 1|2|3|4|null; budget: number | null;
  description: string; tags: string[]; shareToken: string | null;
  shareEnabled: boolean; isPublic: boolean; isAIGenerated: boolean; createdAt: Date; updatedAt: Date;
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

// ─── Playtest ───────────────────────────────────────────────────────────────

export interface PlaytestState {
  hand: DeckCard[];
  library: DeckCard[]; // remaining shuffled deck
  turn: number;
  mulliganCount: number;
}

export type ViewMode = "grid" | "list";
export type ColorMode = "or" | "and" | "exact";
export type CmcMode = "range" | "exact" | "min" | "max";
export type InteractionType = "removal" | "counterspell" | "wipe" | "tutor" | "draw" | "ramp";

export interface SearchFilters {
  colors: string[];
  colorMode?: ColorMode;
  colorlessFilter?: boolean;
  landFilter?: boolean;
  types: string[];
  cmcMin: number | null;
  cmcMax: number | null;
  cmcMode?: CmcMode;
  cmcExact: number | null;
  priceMin: number | null;
  priceMax: number | null;
  powerMin: number | null;
  powerMax: number | null;
  toughnessMin: number | null;
  toughnessMax: number | null;
  subtype: string;
  keyword: string;
  interactionType: InteractionType | null;
  collectionOnly?: boolean;
}

export interface CardFace {
  name: string;
  manaCost: string;
  typeLine: string;
  oracleText: string;
  imageUri: string;
  artCropUri: string;
}
