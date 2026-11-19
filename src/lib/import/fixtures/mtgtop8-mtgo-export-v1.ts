/**
 * MTGTop8's deck export, recorded for the URL importer's MTGTop8 adapter (`importMtgTop8` in
 * `../url-import.ts`).
 *
 * Recorded on 2026-11-19 (17:16 UTC) with the app's User-Agent
 * (`MagicAIBuilder/1.0 (+https://magic-ai-builder.vercel.app)`), one request:
 * - `GET https://www.mtgtop8.com/mtgo?d=913975`: 200, `Content-Type: text/plain;charset=ISO-8859-1`,
 *   `Content-Disposition: attachment; filename=mtgtop8_deck.txt`, 1,773 bytes. This is the export
 *   the deck page links as "MTGO"; the deck is Andrea Prati's Duel Commander list for Surrak,
 *   Elusive Hunter at event 94029 (`https://www.mtgtop8.com/event?e=94029&d=913975&f=EDH`).
 *
 * The body below is byte for byte what MTGTop8 sent: 88 "N Card Name" lines for the 99-card main
 * deck, a bare `Sideboard` heading, then the commander, every line ending in CRLF. It is ASCII
 * only, so the Latin-1 charset changes nothing. MTGTop8 files the commander under `Sideboard`, as
 * MTGO's own deck format does; the export carries no deck name and no event id.
 *
 * Replaces `mtgtop8-deck-page-v1.ts`, which recorded the deck page and the 404 of the
 * `/mtg-decks/<d>/export.txt` URL the adapter used to ask for (DI-01-F1).
 *
 * @module import/fixtures/mtgtop8-mtgo-export-v1
 */

/** The MTGTop8 deck id (`d=`) the export was recorded for. */
export const MTGTOP8_RECORDED_DECK_ID = "913975";

/** The event id (`e=`) the recorded deck belongs to. */
export const MTGTOP8_RECORDED_EVENT_ID = "94029";

/** The export URL that answered with the recorded body. */
export const MTGTOP8_EXPORT_RECORDED_URL = `https://www.mtgtop8.com/mtgo?d=${MTGTOP8_RECORDED_DECK_ID}`;

/** The recorded export's lines, in MTGTop8's order, without their CRLF endings. */
const MTGTOP8_EXPORT_RECORDED_LINES: readonly string[] = [
  "1 Allosaurus Shepherd",
  "1 Arbor Elf",
  "1 Archdruid's Charm",
  "1 Primeval Titan",
  "1 Ba Sing Se",
  "1 Badgermole Cub",
  "1 Birds of Paradise",
  "1 Blast Zone",
  "1 Boreal Druid",
  "1 Boseiju, Who Endures",
  "1 Bridgeworks Battle",
  "1 Bushwhack",
  "1 Cankerbloom",
  "1 Carnage Tyrant",
  "1 Castle Garenbrig",
  "1 Chord of Calling",
  "1 Crop Rotation",
  "1 Dark Depths",
  "1 Delighted Halfling",
  "1 Demolition Field",
  "1 Deserted Temple",
  "1 Disciple of Freyalise",
  "1 Disruptor Flute",
  "1 Dryad Arbor",
  "1 Eldrazi Confluence",
  "1 Eldritch Evolution",
  "1 Eldritch Immunity",
  "1 Elvish Mystic",
  "1 Elvish Reclaimer",
  "1 Emeritus of Abundance",
  "1 Endurance",
  "1 Expedition Map",
  "1 Fanatic of Rhonas",
  "1 Force of Vigor",
  "1 Frenzied Baloth",
  "1 Fyndhorn Elves",
  "1 Glacial Chasm",
  "1 Green Sun's Zenith",
  "1 Hashep Oasis",
  "1 Heroic Intervention",
  "1 Hexdrinker",
  "1 Hour of Promise",
  "1 Icetill Explorer",
  "1 Into the North",
  "1 Keen-Eyed Curator",
  "1 Kozilek's Command",
  "1 Lair of the Hydra",
  "1 Legolas's Quick Reflexes",
  "1 Llanowar Elves",
  "1 Maze of Ith",
  "1 Mishra's Factory",
  "1 Misty Rainforest",
  "1 Mole Man, Moloid Master",
  "1 Ominous Cemetery",
  "1 Once Upon a Time",
  "1 Petrified Field",
  "1 Prismatic Vista",
  "1 Questing Beast",
  "1 Reap and Sow",
  "1 Rogue's Passage",
  "1 Scavenging Ooze",
  "1 Sentinel of the Nameless City",
  "1 Smuggler's Surprise",
  "12 Snow-Covered Forest",
  "1 Song of the Dryads",
  "1 Sowing Mycospawn",
  "1 Spatial Contortion",
  "1 Springheart Nantuko",
  "1 Sylvan Library",
  "1 Sylvan Scrying",
  "1 Tail Swipe",
  "1 Talon Gates of Madara",
  "1 Thespian's Stage",
  "1 Thrun, Breaker of Silence",
  "1 Thrun, the Last Troll",
  "1 Titan of Industry",
  "1 Titania, Protector of Argoth",
  "1 Tyrranax Rex",
  "1 Urza's Cave",
  "1 Utopia Sprawl",
  "1 Verdant Catacombs",
  "1 War Room",
  "1 Wild Growth",
  "1 Windswept Heath",
  "1 Wooded Foothills",
  "1 Worldly Tutor",
  "1 Yavimaya Hollow",
  "1 Yavimaya, Cradle of Growth",
  "Sideboard",
  "1 Surrak, Elusive Hunter",
];

/** The recorded export body, CRLF line endings included. */
export const MTGTOP8_EXPORT_RECORDED = MTGTOP8_EXPORT_RECORDED_LINES.map(
  (line) => `${line}\r\n`
).join("");
