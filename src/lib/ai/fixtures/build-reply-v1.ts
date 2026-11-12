/**
 * A model's decklist for `TALRAND_BUILD_REQUEST`, in the JSON shape the build
 * prompt asks for (approved in `app/api/ai/build/__prompts__/commander-only.txt`).
 *
 * Hand-written; no model was called. It sums to 99 as asked, and it carries
 * one of each mistake the server's card-data check repairs, so the golden
 * stream pins every correction: two Counterspells (singleton), Lightning Bolt
 * (red, outside the identity), Mana Crypt (banned) and "Talrand's Invocation"
 * (not a card). Persistent Petitioners may run four copies by its own text.
 * Every real name is in `ALL_GENERATED_DECK_CARDS`, the card data the suites
 * serve as Scryfall.
 */

/** The decklist object, in the order the model wrote it. */
export const BUILD_REPLY_V1 = {
  commander: "Talrand, Sky Summoner",
  partner: null,
  cards: [
    { name: "Sol Ring", quantity: 1, category: "ramp" },
    { name: "Counterspell", quantity: 2, category: "removal" },
    { name: "Persistent Petitioners", quantity: 4, category: "creature" },
    { name: "Lightning Bolt", quantity: 1, category: "removal" },
    { name: "Mana Crypt", quantity: 1, category: "ramp" },
    { name: "Talrand's Invocation", quantity: 1, category: "winCondition" },
    { name: "Island", quantity: 89, category: "land" },
  ],
} as const;

/** The decklist as OpenAI's JSON mode returns it: bare JSON. */
export const BUILD_REPLY_TEXT_V1 = JSON.stringify(BUILD_REPLY_V1, null, 2);

/** The same decklist wrapped in a markdown fence, as Anthropic models often reply. */
export const BUILD_REPLY_FENCED_TEXT_V1 = `\`\`\`json\n${BUILD_REPLY_TEXT_V1}\n\`\`\``;
