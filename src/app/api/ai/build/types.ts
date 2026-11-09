/**
 * Wire types shared by the AI build route and its client hook.
 *
 * They live outside `route.ts` so the browser bundle never has to reach into a
 * server module just to name an event.
 */

export type BuildColor = "W" | "U" | "B" | "R" | "G" | "C";

/** Target power level. 1–4 are offered by the wizard; 5 (cEDH) is accepted by the API. */
export type Bracket = 1 | 2 | 3 | 4 | 5;

export interface BuildRequest {
  budget: number | null; // null = no limit
  colors: readonly BuildColor[];
  strategy: string; // "Aggro" | "Control" | etc.
  commanderName: string | null; // null = let AI pick
  bracket: Bracket;
}

/** Where the decklist came from — `demo` means no AI provider is configured. */
export type BuildSource = "ai" | "demo";

/** Why the server's card-data check took copies out of the model's list. */
export type DeckRemovalReason =
  /** No card in Scryfall's data has this name. */
  | "unknown_card"
  /** Outside the colour identity of the commander and partner. */
  | "outside_color_identity"
  | "banned"
  /** Not legal in Commander for a reason other than the banlist (un-cards, digital-only cards). */
  | "not_legal"
  /** Copies beyond singleton, or beyond the number the card's own text allows. */
  | "extra_copies"
  /** The commander or partner repeated among the other cards. */
  | "commander_in_list"
  /** Basic lands trimmed because the list was longer than the deck size. */
  | "over_size";

/**
 * One change the server made to the model's list after checking it against
 * card data. Basic lands are only ever added to bring the list to the deck size.
 */
export type DeckCorrection =
  | {
      readonly action: "removed";
      readonly name: string;
      readonly quantity: number;
      readonly reason: DeckRemovalReason;
    }
  | {
      readonly action: "added";
      readonly name: string;
      readonly quantity: number;
      readonly reason: "fill_to_size";
    };

export type BuildEvent =
  | { type: "status"; message: string }
  | { type: "commander"; name: string }
  | { type: "card"; name: string; category: string; quantity: number }
  | {
      type: "done";
      totalCards: number;
      source: BuildSource;
      /** Every change the card-data check made; empty when the list was legal as generated. */
      corrections: readonly DeckCorrection[];
    }
  | { type: "error"; message: string };

export interface AICard {
  name: string;
  quantity: number;
  category: string;
}

export interface AIDeckResponse {
  commander: string;
  partner: string | null;
  cards: AICard[];
}
