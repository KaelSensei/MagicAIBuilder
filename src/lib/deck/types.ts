// Core deck and card types for MagicAIBuilder

export type CardCategory =
  | "commander"
  | "companion"
  | "creature"
  | "instant"
  | "sorcery"
  | "artifact"
  | "enchantment"
  | "planeswalker"
  | "land"
  | "ramp"
  | "draw"
  | "removal"
  | "boardWipe"
  | "winCondition"
  | "protection"
  | "other";

export interface DeckCard {
  id: string; // Scryfall card ID
  name: string;
  manaCost: string; // e.g., "{2}{U}{U}"
  cmc: number;
  typeLine: string;
  oracleText: string;
  colorIdentity: string[]; // ["W", "U", "B", "R", "G"]
  isGameChanger: boolean;
  isBanned: boolean;
  price: number | null; // USD
  imageUri: string; // Scryfall image URL (normal)
  artCropUri: string; // Art crop for backgrounds
  category: CardCategory; // Auto-assigned or manual
  quantity: number; // Always 1 in Commander (except basics)
  notes?: string | null; // Private annotation on this card slot
}

export type CommanderPairingType =
  | "none"            // Single commander
  | "partner"         // Generic "Partner" keyword
  | "partner_with"    // "Partner with [specific card]"
  | "friends_forever" // "Friends forever"
  | "background"      // "Choose a Background"
  | "doctor";         // "Doctor's companion"

export interface Deck {
  id: string;
  name: string;
  description?: string | null; // Optional deck description (markdown)
  tags: string[]; // Deck tags e.g. "casual", "cEDH", "WIP"
  commander: DeckCard | null;
  partner: DeckCard | null; // For partner commanders
  companion: DeckCard | null; // Companion (sideboard, outside the 99)
  pairingType: CommanderPairingType; // Detected from commander keywords
  cards: DeckCard[]; // The 99 (or 98 with partner)
  format: "commander" | "brawl";
  targetBracket: 1 | 2 | 3 | 4;
  budget: number | null; // Max price per card in USD
  createdAt: Date;
  updatedAt: Date;
}

export interface DeckStats {
  totalCards: number; // Should be 100
  lands: number;
  creatures: number;
  ramp: number;
  draw: number;
  removal: number;
  boardWipes: number;
  avgCmc: number;
  manaCurve: Record<number, number>; // CMC -> count
  colorDistribution: Record<string, number>; // Color -> count
  gameChangersCount: number;
  gameChangersList: string[]; // Card names
  totalPrice: number;
  overBudgetCards: string[]; // Cards exceeding budget
  bannedCards: string[]; // Banned cards in deck
  colorIdentityViolations: string[]; // Cards outside commander identity
  themes?: import("./themes").DetectedTheme[]; // Detected archetypes
}

export interface BracketScore {
  overall: 1 | 2 | 3 | 4;
  dimensions: {
    ramp: number;
    draw: number;
    removal: number;
    tutors: number;
    winSpeed: number;
    avgCmc: number;
  };
  gameChangers: number;
  warnings: string[]; // Human-readable bracket warnings
}

export type ViewMode = "grid" | "list";

export interface SearchFilters {
  colors: string[];
  types: string[];
  cmcMin: number | null;
  cmcMax: number | null;
  priceMax: number | null;
}
