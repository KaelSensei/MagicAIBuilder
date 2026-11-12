/**
 * The requests the AI route suites post for one mono-blue deck led by
 * Talrand, Sky Summoner: a suggestion request as the builder page sends it,
 * and a build request as the deck wizard sends it.
 *
 * Shared by the prompt approvals (`route.prompt.test.ts`) and the golden
 * event streams (`route.stream.test.ts`) of both routes, so an approved prompt
 * and a golden stream describe the same request.
 */

/**
 * `POST /api/ai/suggest` for an 11-card spellslinger list, with no budget,
 * brief or question. The fields mirror `buildSuggestPayload` in
 * `lib/ai/suggest-payload.ts`, minus the `cardPrices` the route never reads.
 */
export const TALRAND_SUGGEST_REQUEST = {
  deckId: "deck-talrand",
  commanderName: "Talrand, Sky Summoner",
  partnerName: null,
  colorIdentity: ["U"],
  cardNames: [
    "Sol Ring",
    "Arcane Signet",
    "Brainstorm",
    "Ponder",
    "Preordain",
    "Rhystic Study",
    "Mystic Remora",
    "Counterspell",
    "Cyclonic Rift",
    "Murmuring Mystic",
    "Island",
  ],
  categories: {
    ramp: 2,
    draw: 5,
    removal: 2,
    boardWipe: 0,
    creatures: 1,
    lands: 1,
  },
  avgCmc: 1.909,
  bracket: 3,
  bracketDimensions: { ramp: 2, draw: 4, removal: 2, winSpeed: 2, avgCmc: 4 },
  bracketWarnings: ["Only 1 land: Commander decks usually run 36 or more"],
  targetBracket: 3,
  budget: null,
  gameChangersCount: 2,
  gameChangersList: ["Rhystic Study", "Cyclonic Rift"],
  detectedThemes: ["Spellslinger", "Card draw"],
  archetype: "Spellslinger",
  budgetPerCard: null,
} as const;

/** `POST /api/ai/build` for a Bracket 2 control deck around a chosen commander. */
export const TALRAND_BUILD_REQUEST = {
  budget: null,
  colors: ["U"],
  strategy: "Control",
  commanderName: "Talrand, Sky Summoner",
  bracket: 2,
} as const;
