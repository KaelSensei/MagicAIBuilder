/**
 * Wire types shared by the AI build route and its client hook.
 *
 * They live outside `route.ts` so the browser bundle never has to reach into a
 * server module just to name an event.
 */

import type { BuildStep } from "@/lib/ai/build-step";
import type { BracketLevel } from "@/lib/constants/brackets";

export type BuildColor = "W" | "U" | "B" | "R" | "G" | "C";

/** Target power level: one of the five official brackets, 5 being cEDH. */
export type Bracket = BracketLevel;

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
 * Why copies were removed, with the facts its sentence needs. A preview card
 * carries the day its set releases, so the player reads "a preview card,
 * legal in Commander from <date>", never "not legal" alone (I-73 3.2, 3.5).
 */
export type DeckRemovalCause =
  | { readonly reason: DeckRemovalReason }
  | {
      /** Scryfall does not mark the card legal yet because its set is not out (I-73 3.1). */
      readonly reason: "preview";
      /** The set's release day, "YYYY-MM-DD" */
      readonly releasesOn: string;
    }
  | {
      /** A Game Changer beyond the most the requested bracket allows (I-02 5.1). */
      readonly reason: "game_changer";
      /** The bracket the player asked for */
      readonly bracket: Bracket;
      /** That bracket's most Game Changers, the commanders included; finite whenever a card is removed */
      readonly limit: number;
    };

/**
 * One change the server made to the model's list after checking it against
 * card data. Basic lands are only ever added to bring the list to the deck size.
 */
export type DeckCorrection =
  | ({
      readonly action: "removed";
      readonly name: string;
      readonly quantity: number;
    } & DeckRemovalCause)
  | {
      readonly action: "added";
      readonly name: string;
      readonly quantity: number;
      readonly reason: "fill_to_size";
    };

export type BuildEvent =
  | {
      type: "status";
      /** What the build is doing; the client words it in the player's language. */
      step: BuildStep;
      /** The step's English line, for a client loaded before steps existed; kept one release (`status-event.ts`). */
      message: string;
    }
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
