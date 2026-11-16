/**
 * Scryfall's answers to a described search for green Angels in a Seluma,
 * Light of Aysen deck (white-black): once with the identity clause widened by
 * Seluma's rulebreaker exceptions, once with the bare `id<=WB` it replaced.
 *
 * Recorded on 2026-11-16 (23:10 UTC), two requests with the User-Agent
 * `MagicAIBuilder/1.0 (+https://magic-ai-builder.vercel.app)` and the
 * parameters `searchCards` sends (`page=1`, `order=edhrec`):
 * - `GET https://api.scryfall.com/cards/search?q=t:angel c:g (id<=WB OR t:angel OR t:basic) legal:commander`
 *   answered 200 with `total_cards: 14`, `has_more: false`;
 * - `GET https://api.scryfall.com/cards/search?q=t:angel c:g id<=WB legal:commander`
 *   answered 404 with the error object below.
 *
 * Each card keeps the fields `ScryfallCard` requires plus `oracle_id`, with
 * Scryfall's values, in Scryfall's order. Nothing else was edited.
 *
 * Test data only.
 *
 * @module search/fixtures/rulebreaker-search-v1
 */
import type { ScryfallSearchResponse } from "@/lib/scryfall/types";

/** The query the described search writes for "t:angel c:g" under Seluma. */
export const WIDENED_SELUMA_QUERY =
  "t:angel c:g (id<=WB OR t:angel OR t:basic) legal:commander";

/** The same query with the bare identity clause the widening replaced. */
export const PLAIN_SELUMA_QUERY = "t:angel c:g id<=WB legal:commander";

/** Scryfall's page for {@link WIDENED_SELUMA_QUERY}. */
export const RECORDED_WIDENED_PAGE: ScryfallSearchResponse = {
  object: "list",
  total_cards: 14,
  has_more: false,
  data: [
    {
      id: "d0d33d52-3d28-4635-b985-51e126289259",
      oracle_id: "7e6b9b59-cd68-4e3c-827b-38833c92d6eb",
      name: "Atraxa, Praetors' Voice",
      cmc: 4,
      type_line: "Legendary Creature — Phyrexian Angel Horror",
      color_identity: ["B", "G", "U", "W"],
    },
    {
      id: "cba71725-d6df-44d7-a93b-934573759711",
      oracle_id: "5fe07a76-f261-4f16-8a15-571bed707261",
      name: "Sigarda, Font of Blessings",
      cmc: 4,
      type_line: "Legendary Creature — Angel",
      color_identity: ["G", "W"],
    },
    {
      id: "4a1f905f-1d55-4d02-9d24-e58070793d3f",
      oracle_id: "abbcb153-0763-44c6-964f-b4ff0eb64257",
      name: "Atraxa, Grand Unifier",
      cmc: 7,
      type_line: "Legendary Creature — Phyrexian Angel",
      color_identity: ["B", "G", "U", "W"],
    },
    {
      id: "80804f25-efc3-44a2-bbae-9a97fec98009",
      oracle_id: "e7604cd9-d00d-4957-82c9-46a7cdb88209",
      name: "Shalai and Hallar",
      cmc: 4,
      type_line: "Legendary Creature — Angel Elf",
      color_identity: ["G", "R", "W"],
    },
    {
      id: "8f7a6f6d-dfe3-40d3-90dc-58baa8924baf",
      oracle_id: "e55104e2-4900-48de-b288-d3e6abd5e09e",
      name: "Sigarda, Host of Herons",
      cmc: 5,
      type_line: "Legendary Creature — Angel",
      color_identity: ["G", "W"],
    },
    {
      id: "ab866ec4-dcb4-47ef-8de1-a369986609c0",
      oracle_id: "9fb7982f-fe35-4dea-a515-a0039ddbbaec",
      name: "Ixhel, Scion of Atraxa",
      cmc: 4,
      type_line: "Legendary Creature — Phyrexian Angel",
      color_identity: ["B", "G", "W"],
    },
    {
      id: "95ea2a05-207d-4330-bcbe-bcaacd6657f4",
      oracle_id: "ac50ef98-1791-4dd4-9c1f-8cea7db7ade5",
      name: "Maelstrom Archangel",
      cmc: 5,
      type_line: "Creature — Angel",
      color_identity: ["B", "G", "R", "U", "W"],
    },
    {
      id: "78660bdf-0edb-4fd0-a737-1c95f93cced1",
      oracle_id: "1ef2415f-f88f-41fb-b084-ea52631a60c1",
      name: "Rienne, Angel of Rebirth",
      cmc: 5,
      type_line: "Legendary Creature — Angel",
      color_identity: ["G", "R", "W"],
    },
    {
      id: "a1de7031-f589-4af5-9c63-06fb7ec7a6b5",
      oracle_id: "79b56cf8-d573-40cf-b797-6b4eef2bed23",
      name: "Sigarda, Heron's Grace",
      cmc: 5,
      type_line: "Legendary Creature — Angel",
      color_identity: ["G", "W"],
    },
    {
      id: "5c6cf357-c231-4512-aa9a-ab4a60007136",
      oracle_id: "24919141-82d2-42ad-963c-e53511a868b3",
      name: "Sigarda, Champion of Light",
      cmc: 4,
      type_line: "Legendary Creature — Angel",
      color_identity: ["G", "W"],
    },
    {
      id: "37fd303a-0a51-4931-9735-704ce8179a98",
      oracle_id: "b50c865b-705f-489e-9ffc-ba8060ba262f",
      name: "Stoic Angel",
      cmc: 4,
      type_line: "Creature — Angel",
      color_identity: ["G", "U", "W"],
    },
    {
      id: "4bcf5b5f-b908-4975-91f7-c4c6f819e0a6",
      oracle_id: "d06cd670-7ffc-4295-97d1-0eff042fb6d5",
      name: "Jenara, Asura of War",
      cmc: 3,
      type_line: "Legendary Creature — Angel",
      color_identity: ["G", "U", "W"],
    },
    {
      id: "d908d523-1911-4a49-9e3f-ea1b719a8f0b",
      oracle_id: "3a105959-dfce-4202-b37f-ae635dfcb30b",
      name: "Empyrial Archangel",
      cmc: 8,
      type_line: "Creature — Angel",
      color_identity: ["G", "U", "W"],
    },
    {
      id: "2e349074-1402-44cf-be19-33a661cff3b6",
      oracle_id: "e8521fdf-0896-4747-8c66-ea3bb69eb876",
      name: "Gabriel Angelfire",
      cmc: 7,
      type_line: "Legendary Creature — Angel",
      color_identity: ["G", "W"],
    },
  ],
};

/** Scryfall's 404 body for {@link PLAIN_SELUMA_QUERY}: no card matched. */
export const RECORDED_PLAIN_NOT_FOUND = {
  object: "error",
  code: "not_found",
  status: 404,
  details:
    "Your query didn’t match any cards. Adjust your search terms or refer to the syntax guide at https://scryfall.com/docs/reference",
} as const;
