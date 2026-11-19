/**
 * An EDHREC commander page, recorded for the URL importer's "average deck" adapter
 * (`importEdhrec` in `../url-import.ts`).
 *
 * Recorded on 2026-11-19 (08:35 UTC) with
 * `GET https://json.edhrec.com/pages/commanders/wilhelt-the-rotcleaver.json`, sent with the app's
 * User-Agent (`MagicAIBuilder/1.0 (+https://magic-ai-builder.vercel.app)`). The response came as
 * `Content-Type: application/json; charset=utf-8`, 113,809 bytes, with
 * `cache-control: public, max-age=1620, stale-while-revalidate=180`.
 *
 * The adapter reads three things only: `container.json_dict.card.name`, and the `name` of every
 * view in `container.json_dict.cardlists`, in list order. What was trimmed, and nothing else was
 * changed:
 * - every top-level field but `header` and `container.json_dict`;
 * - every field of the commander card but its `name`, and every field of a card view but its
 *   `name` (`id`, `sanitized`, `num_decks`, `synergy` and the rest);
 * - the views themselves: the live page has 12 lists and 263 views; this one keeps the same 12
 *   lists, in EDHREC's order, with the first three views of each, and the four views that also
 *   appear in a second list ("Malakir Rebirth", "Fell the Profane", "Sink into Stupor" in
 *   Instants and Lands; "Agadeem's Awakening" in Sorceries and Lands). Those modal
 *   double-faced spell-lands are the de-duplication the adapter must perform on a real page.
 *
 * The commander's own name appears in no list of the live page; the 99-card cap needs more
 * unique views than this trimmed page has. The replay test builds both cases from these views.
 *
 * @module import/fixtures/edhrec-average-deck-v1
 */

/** The commander slug the page was recorded for, as it appears in the EDHREC URL. */
export const EDHREC_IMPORT_RECORDED_SLUG = "wilhelt-the-rotcleaver";

/** The URL the recording was fetched from, and the one the adapter requests for the slug. */
export const EDHREC_IMPORT_RECORDED_URL = `https://json.edhrec.com/pages/commanders/${EDHREC_IMPORT_RECORDED_SLUG}.json`;

/** The recorded page, trimmed as the module header says. */
export const EDHREC_AVERAGE_DECK_RECORDED = {
  header: "Wilhelt, the Rotcleaver (Commander)",
  container: {
    json_dict: {
      card: { name: "Wilhelt, the Rotcleaver" },
      cardlists: [
        {
          tag: "newcards",
          header: "New Cards",
          cardviews: [
            { name: "Turbulent Wetlands" },
            { name: "Avacyn, Angel of Horror" },
            { name: "Lich's Relic" },
          ],
        },
        {
          tag: "topcards",
          header: "Top Cards",
          cardviews: [
            { name: "Diregraf Captain" },
            { name: "Rooftop Storm" },
            { name: "Gravecrawler" },
          ],
        },
        {
          tag: "highliftcards",
          header: "High Lift Cards",
          cardviews: [
            { name: "Poppet Stitcher" },
            { name: "Prowling Geistcatcher" },
            { name: "Putrid Goblin" },
          ],
        },
        {
          tag: "creatures",
          header: "Creatures",
          cardviews: [
            { name: "Cemetery Reaper" },
            { name: "Carrion Feeder" },
            { name: "Midnight Reaper" },
          ],
        },
        {
          tag: "instants",
          header: "Instants",
          cardviews: [
            { name: "Counterspell" },
            { name: "Dark Ritual" },
            { name: "Go for the Throat" },
            { name: "Malakir Rebirth" },
            { name: "Fell the Profane" },
            { name: "Sink into Stupor" },
          ],
        },
        {
          tag: "sorceries",
          header: "Sorceries",
          cardviews: [
            { name: "Zombie Apocalypse" },
            { name: "Feed the Swarm" },
            { name: "Victimize" },
            { name: "Agadeem's Awakening" },
          ],
        },
        {
          tag: "utilityartifacts",
          header: "Utility Artifacts",
          cardviews: [
            { name: "Ashnod's Altar" },
            { name: "Phyrexian Altar" },
            { name: "Skullclamp" },
          ],
        },
        {
          tag: "enchantments",
          header: "Enchantments",
          cardviews: [
            { name: "Endless Ranks of the Dead" },
            { name: "Dreadhorde Invasion" },
            { name: "Open the Graves" },
          ],
        },
        {
          tag: "planeswalkers",
          header: "Planeswalkers",
          cardviews: [
            { name: "Liliana, Death's Majesty" },
            { name: "Liliana, Dreadhorde General" },
            { name: "Liliana, Untouched by Death" },
          ],
        },
        {
          tag: "utilitylands",
          header: "Utility Lands",
          cardviews: [
            { name: "Bojuka Bog" },
            { name: "Unholy Grotto" },
            { name: "Mortuary Mire" },
          ],
        },
        {
          tag: "manaartifacts",
          header: "Mana Artifacts",
          cardviews: [
            { name: "Sol Ring" },
            { name: "Arcane Signet" },
            { name: "Talisman of Dominance" },
          ],
        },
        {
          tag: "lands",
          header: "Lands",
          cardviews: [
            { name: "Swamp" },
            { name: "Island" },
            { name: "Command Tower" },
            { name: "Malakir Rebirth" },
            { name: "Fell the Profane" },
            { name: "Agadeem's Awakening" },
            { name: "Sink into Stupor" },
          ],
        },
      ],
    },
  },
} as const;
