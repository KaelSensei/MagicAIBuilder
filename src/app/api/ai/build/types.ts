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

export type BuildEvent =
  | { type: "status"; message: string }
  | { type: "commander"; name: string }
  | { type: "card"; name: string; category: string; quantity: number }
  | { type: "done"; totalCards: number; source: BuildSource }
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
