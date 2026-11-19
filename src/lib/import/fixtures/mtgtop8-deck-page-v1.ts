/**
 * MTGTop8 deck page and text export, recorded for the URL importer's MTGTop8 adapter
 * (`importMtgTop8` in `../url-import.ts`).
 *
 * Recorded on 2026-11-19 (08:30 UTC) with the app's User-Agent
 * (`MagicAIBuilder/1.0 (+https://magic-ai-builder.vercel.app)`):
 * - `GET https://www.mtgtop8.com/event?e=94029&d=913975&f=EDH`: 200,
 *   `Content-Type: text/html; charset=ISO-8859-1`, 39,970 bytes. The deck is Andrea Prati's
 *   Duel Commander list for Surrak, Elusive Hunter (99 main-deck cards and the commander).
 * - `GET https://www.mtgtop8.com/mtg-decks/913975/export.txt`, the export the adapter asks for
 *   first: 404 with the 16-byte body kept below.
 *
 * What was trimmed from the page, and nothing else was changed: everything outside the deck
 * block (the page shell, the scripts, the event table), and all deck lines but the first one or
 * two of each section. The five section headings, the four columns and the markup of each kept
 * line are byte for byte what MTGTop8 sent; the deck block is ASCII only, so the Latin-1 charset
 * changes nothing. The block is one line on the page; it is split here only to be readable, and joins
 * back without separators.
 *
 * Every card name sits in a `<span class=L14>` after its quantity, so the adapter's HTML
 * fallback, which looks for "N Card Name" in running text, finds the section headings instead.
 *
 * @module import/fixtures/mtgtop8-deck-page-v1
 */

/** The MTGTop8 deck id (`d=`) the page was recorded for. */
export const MTGTOP8_RECORDED_DECK_ID = "913975";

/** The event id (`e=`) the recorded deck belongs to. */
export const MTGTOP8_RECORDED_EVENT_ID = "94029";

/** The body MTGTop8 sent with its 404 for the export the adapter requests. */
export const MTGTOP8_EXPORT_NOT_FOUND_BODY = "File not found.\n";

/** The deck block of the recorded page, trimmed as the module header says. */
export const MTGTOP8_DECK_BLOCK_RECORDED = [
  '<div style="display:flex;align-content:stretch;">',
  '<div style="margin:3px;flex:1;" align=left>',
  "<div class=O14>COMMANDER</div>",
  "<div id=sbtdm161 class=\"deck_line hover_tr\" onclick=\"AffCard('tdm161','Surrak,+Elusive+Hunter','','');\">1 <span class=L14>Surrak, Elusive Hunter</span> </div>",
  '<div class=O14 style="margin-top:5px;">39 LANDS (41)</div>',
  "<div id=mdtla266 class=\"deck_line hover_tr\" onclick=\"AffCard('tla266','Ba+Sing+Se','','');\">1 <span class=L14>Ba Sing Se</span> </div>",
  "<div id=mdwar244 class=\"deck_line hover_tr\" onclick=\"AffCard('war244','Blast+Zone','','');\">1 <span class=L14>Blast Zone</span> </div>",
  "</div>",
  '<div style="margin:3px;flex:1;" align=left>',
  '<div class=O14 style="margin-top:5px;">32 CREATURES</div>',
  "<div id=mdjmp028 class=\"deck_line hover_tr\" onclick=\"AffCard('jmp028','Allosaurus+Shepherd','','');\">1 <span class=L14>Allosaurus Shepherd</span> </div>",
  "<div id=mdwwk095 class=\"deck_line hover_tr\" onclick=\"AffCard('wwk095','Arbor+Elf','','');\">1 <span class=L14>Arbor Elf</span> </div>",
  "</div>",
  '<div style="margin:3px;flex:1;" align=left>',
  '<div class=O14 style="margin-top:5px;">22 INSTANTS and SORC.</div>',
  "<div id=mdmkm151 class=\"deck_line hover_tr\" onclick=\"AffCard('mkm151','Archdruid\\'s+Charm','','');\">1 <span class=L14>Archdruid's Charm</span> </div>",
  "<div id=mdmh3249 class=\"deck_line hover_tr\" onclick=\"AffCard('mh3249','Bridgeworks+Battle','','');\">1 <span class=L14>Bridgeworks Battle</span> <img style=\"display:inline-block;height:14px;vertical-align:-10%;\" src=/graph/manas_c/land.png></div>",
  "</div>",
  '<div style="margin:3px;flex:1;" align=left>',
  '<div class=O14 style="margin-top:5px;">6 OTHER SPELLS</div>',
  "<div id=mdmh3209 class=\"deck_line hover_tr\" onclick=\"AffCard('mh3209','Disruptor+Flute','','');\">1 <span class=L14>Disruptor Flute</span> </div>",
  "<div id=mdzen201 class=\"deck_line hover_tr\" onclick=\"AffCard('zen201','Expedition+Map','','');\">1 <span class=L14>Expedition Map</span> </div>",
  "</div></div>",
].join("");
