/**
 * Why Scryfall keeps a card out of a Commander deck, in the words the AI
 * copilot's card-data check uses.
 *
 * AI copilot, pure. The verdict stays Scryfall's (I-73 3.2); the release
 * status only names a card that is not legal because its set is not out yet
 * as a preview, with its release day, so the copilot never calls it "not
 * legal" alone (I-73 3.5).
 * Not responsible for: the release status itself (`releases/release-status`),
 * the player-facing wording of a removal (`GeneratedDeckCorrections`).
 *
 * @module ai/commander-legality-problem
 */
import { releaseStatus } from "@/lib/releases/release-status";
import type { ScryfallCard } from "@/lib/scryfall/types";

/**
 * Why a card is out of a Commander deck: banned, not legal, or a preview
 * whose set releases on `releasesOn` ("YYYY-MM-DD").
 */
export type LegalityProblem =
  | { readonly reason: "banned" | "not_legal" }
  | { readonly reason: "preview"; readonly releasesOn: string };

/**
 * Scryfall's Commander verdict on a card, or null when the card is legal.
 *
 * @param card - a printing as Scryfall sent it
 * @param today - now, read as its UTC day (`releaseDayOf`)
 * @returns the problem, a `preview` when the card's set releases after today
 */
export function commanderLegalityProblem(
  card: ScryfallCard,
  today: Date
): LegalityProblem | null {
  const legality = card.legalities?.commander;
  if (legality === "legal") return null;
  if (legality === "banned") return { reason: "banned" };
  const status = releaseStatus(card, today);
  return status.kind === "preview"
    ? { reason: "preview", releasesOn: status.releasesOn }
    : { reason: "not_legal" };
}

/**
 * The problem as the end of an English sentence about the card, for the
 * reasons a rejected build is logged with.
 *
 * @param problem - a problem from `commanderLegalityProblem`
 * @returns for example "a preview card, legal in Commander from 2027-02-05"
 */
export function describeLegalityProblem(problem: LegalityProblem): string {
  switch (problem.reason) {
    case "banned":
      return "banned in Commander";
    case "not_legal":
      return "not legal in Commander";
    case "preview":
      return `a preview card, legal in Commander from ${problem.releasesOn}`;
    default: {
      const unhandled: never = problem;
      return unhandled;
    }
  }
}
