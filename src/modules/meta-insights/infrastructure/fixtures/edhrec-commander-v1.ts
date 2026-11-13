/**
 * An EDHREC commander page, recorded verbatim from the JSON endpoint the adapter reads.
 *
 * Recorded on 2026-11-12 (12:01 UTC) with
 * `GET https://json.edhrec.com/pages/commanders/atraxa-praetors-voice.json`, sent with the app's
 * User-Agent (`MagicAIBuilder/1.0 (+https://magic-ai-builder.vercel.app)`). The response came as
 * `Content-Type: application/json; charset=utf-8`, 130,809 bytes, served from S3 through
 * CloudFront with `cache-control: public, max-age=1620`.
 *
 * What was trimmed, and nothing else was changed:
 * - the top-level type counts, `similar`, `bracket_counts`, `budget_counts`, `tag_counts`,
 *   `savedate_counts`, `panels` and `description`, which the adapter never reads;
 * - `container.json_dict.card`: the prices, images and set data of the commander itself;
 * - the card lists: the live page has 11 lists and 288 card views; this one keeps 6 lists and
 *   10 views, every value copied as EDHREC sent it. "New Cards" is kept because its
 *   `potential_decks` (6,031: the decks saved since the card's release) differs from the
 *   46,229 decks every other list divides by, and "Mana Artifacts" and "Lands" because they hold
 *   the highest inclusion figures, which the adapter's ranking must put first.
 *
 * No card appears in two lists on the live page, so the de-duplication rule has no recorded
 * example; the replay test builds one from these views.
 *
 * @module meta-insights/infrastructure/fixtures/edhrec-commander-v1
 */

/** The commander slug the page was recorded for, as the adapter puts it in the URL. */
export const EDHREC_RECORDED_COMMANDER_SLUG = "atraxa-praetors-voice";

/** The URL the recording was fetched from. */
export const EDHREC_RECORDED_URL = `https://json.edhrec.com/pages/commanders/${EDHREC_RECORDED_COMMANDER_SLUG}.json`;

/** The recorded page, trimmed as the module header says. */
export const EDHREC_COMMANDER_RECORDED = {
  header: "Atraxa, Praetors' Voice (Commander)",
  container: {
    breadcrumb: [
      {
        "/commanders": "Commanders",
      },
      {
        "/commanders/atraxa-praetors-voice": "Atraxa, Praetors' Voice",
      },
    ],
    description: "Popular decks and cards for Atraxa, Praetors&#x27; Voice",
    json_dict: {
      card: {
        name: "Atraxa, Praetors' Voice",
        sanitized: "atraxa-praetors-voice",
        slug: "atraxa-praetors-voice",
        url: "/commanders/atraxa-praetors-voice",
        num_decks: 46229,
        rank: 4,
        cmc: 4.0,
        color_identity: ["G", "W", "U", "B"],
        id: "d0d33d52-3d28-4635-b985-51e126289259",
        primary_type: "Creature",
        type_line: "Legendary Creature — Phyrexian Angel Horror",
        is_commander: true,
        legal_commander: true,
      },
      cardlists: [
        {
          header: "New Cards",
          tag: "newcards",
          cardviews: [
            {
              id: "2185c08f-bb4d-49d5-8b6c-c629a48bb61c",
              name: "Sanctum Lurker",
              sanitized: "sanctum-lurker",
              slug: "sanctum-lurker",
              url: "/cards/sanctum-lurker",
              image_version: "1789556729",
              synergy: 0.04172518150918887,
              lift: 1.6944688795225726,
              num_decks: 614,
              potential_decks: 6031,
              trend_zscore: 9.803944664107977,
            },
          ],
        },
        {
          header: "Top Cards",
          tag: "topcards",
          cardviews: [
            {
              id: "2d389264-e2d2-4589-9636-faa11fe46710",
              name: "Tekuthal, Inquiry Dominus",
              sanitized: "tekuthal-inquiry-dominus",
              slug: "tekuthal-inquiry-dominus",
              url: "/cards/tekuthal-inquiry-dominus",
              image_version: "1783906040",
              synergy: 0.2702909321627779,
              lift: 1.6768576288748782,
              num_decks: 30956,
              potential_decks: 46229,
              trend_zscore: -0.048627237504858416,
            },
            {
              id: "1d58d08d-cd62-416d-8d8e-7d9c56d5c4da",
              name: "Evolution Sage",
              sanitized: "evolution-sage",
              slug: "evolution-sage",
              url: "/cards/evolution-sage",
              image_version: "1783904546",
              synergy: 0.23785146855520678,
              lift: 1.6680068091111317,
              num_decks: 27456,
              potential_decks: 46229,
              trend_zscore: -0.14856945935300916,
            },
            {
              id: "4645eebf-c9fc-4ee7-b646-61dc1205b4b0",
              name: "Swords to Plowshares",
              sanitized: "swords-to-plowshares",
              slug: "swords-to-plowshares",
              url: "/cards/swords-to-plowshares",
              image_version: "1793111861",
              synergy: -0.016164563535159715,
              lift: 0.9719221469336914,
              num_decks: 25867,
              potential_decks: 46229,
              trend_zscore: 0.7852919446487117,
            },
          ],
        },
        {
          header: "Creatures",
          tag: "creatures",
          cardviews: [
            {
              id: "3c520263-6bad-4521-ba9e-192ca8223b07",
              name: "Flux Channeler",
              sanitized: "flux-channeler",
              slug: "flux-channeler",
              url: "/cards/flux-channeler",
              image_version: "1783915442",
              synergy: 0.17134327539293526,
              lift: 1.7271687176277248,
              num_decks: 18814,
              potential_decks: 46229,
              trend_zscore: 0.16416584161877595,
            },
          ],
        },
        {
          header: "Enchantments",
          tag: "enchantments",
          cardviews: [
            {
              id: "9f37c5b6-a59c-45cd-9a99-e9357fe9ea1b",
              name: "Rhystic Study",
              sanitized: "rhystic-study",
              slug: "rhystic-study",
              url: "/cards/rhystic-study",
              image_version: "1783919146",
              synergy: -0.09953799509338751,
              lift: 0.7396514160516244,
              num_decks: 13073,
              potential_decks: 46229,
              trend_zscore: -0.28451736844941844,
            },
          ],
        },
        {
          header: "Mana Artifacts",
          tag: "manaartifacts",
          cardviews: [
            {
              id: "fc817e07-c1f3-469f-9cf7-0945dea7400f",
              name: "Sol Ring",
              sanitized: "sol-ring",
              slug: "sol-ring",
              url: "/cards/sol-ring",
              image_version: "1793021181",
              synergy: -0.017861169272591293,
              lift: 0.9794261702229169,
              num_decks: 39308,
              potential_decks: 46229,
              trend_zscore: 0.0,
            },
            {
              id: "795df2ee-fbfc-4961-852c-e3ec50cc52da",
              name: "Arcane Signet",
              sanitized: "arcane-signet",
              slug: "arcane-signet",
              url: "/cards/arcane-signet",
              image_version: "1793021117",
              synergy: 0.004958198241494682,
              lift: 1.0063269816518687,
              num_decks: 36457,
              potential_decks: 46229,
              trend_zscore: 0.0,
            },
          ],
        },
        {
          header: "Lands",
          tag: "lands",
          cardviews: [
            {
              id: "2e781bfd-f8cb-4d20-b977-4359f3a21311",
              name: "Forest",
              sanitized: "forest",
              slug: "forest",
              url: "/cards/forest",
              image_version: "1791578317",
              synergy: 0.1287254727347238,
              lift: 1.1628712107910675,
              num_decks: 42488,
              potential_decks: 46229,
              trend_zscore: 0.0,
            },
            {
              id: "a73297d2-580c-4174-a427-265f6916d09f",
              name: "Command Tower",
              sanitized: "command-tower",
              slug: "command-tower",
              url: "/cards/command-tower",
              image_version: "1793021256",
              synergy: -0.00384719449210269,
              lift: 0.9958285821433434,
              num_decks: 42458,
              potential_decks: 46229,
              trend_zscore: 0.0,
            },
          ],
        },
      ],
    },
    keywords: "Atraxa,Praetors&#x27;,Voice,Commander",
    title: "Atraxa, Praetors' Voice (Commander)",
  },
};
