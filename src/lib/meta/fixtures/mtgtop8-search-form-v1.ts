/**
 * The EDH archetype select of MTGTop8's search form, recorded from the live site.
 *
 * Recorded on 2026-11-12 (10:07 UTC) with `GET https://www.mtgtop8.com/search`. The response
 * came as `Content-Type: text/html; charset=ISO-8859-1`, which is why the adapter decodes the
 * body as Latin-1 and why {@link searchFormLatin1Bytes} re-encodes this fixture the same way.
 * The live select holds 852 options on one line; this one keeps the five whose name has an
 * accent (every accented commander MTGTop8 listed that day), four plain neighbours and the two
 * sibling selects the parser must ignore. The ids and spellings are the site's own; the line
 * breaks between options are the only edit.
 *
 * @module meta/fixtures/mtgtop8-search-form-v1
 */

/** The search form, as text, after Latin-1 decoding. */
export const RECORDED_SEARCH_FORM = `
<select style="display:none;" id=arch_VI name=archetype_sel[VI]>
<option value="">All</option>
<option value=10 >Lands</option>
</select>
<select style="display:none;" id=arch_EDH name=archetype_sel[EDH]>
<option value="">All</option>
<option value=3106 >A-Lier, Disciple of the Drowned</option>
<option value=2182 >Abaddon the Despoiler</option>
<option value=648 >Atraxa, Praetors' Voice</option>
<option value=2258 >Bartolomé del Presidio</option>
<option value=2250 >Denethor, Stone Seer</option>
<option value=2229 >Éomer, Marshal of Rohan</option>
<option value=3179 >Kíli the Resourceful</option>
<option value=2297 >Ratonhnhaké:ton</option>
<option value=2781 >Sméagol, Helpful Guide</option>
</select>
<select style="display:none;" id=arch_cEDH name=archetype_sel[cEDH]>
<option value="">All</option>
<option value=99 >Atraxa, Praetors' Voice</option>
</select>`;

/** The archetype ids of the recorded EDH options, by the name the site prints. */
export const RECORDED_ARCHETYPE_IDS = {
  "A-Lier, Disciple of the Drowned": 3106,
  "Abaddon the Despoiler": 2182,
  "Atraxa, Praetors' Voice": 648,
  "Bartolomé del Presidio": 2258,
  "Denethor, Stone Seer": 2250,
  "Éomer, Marshal of Rohan": 2229,
  "Kíli the Resourceful": 3179,
  "Ratonhnhaké:ton": 2297,
  "Sméagol, Helpful Guide": 2781,
} as const;

/**
 * Encodes a page as the wire carries it: one ISO-8859-1 byte per character, so "É" is 0xC9 and
 * not UTF-8's 0xC3 0x89.
 *
 * @param page - text whose every character sits in Latin-1 (code point at most 0xFF)
 * @returns the bytes a `fetch` of that page yields
 * @throws when a character has no Latin-1 byte
 */
export function latin1Bytes(page: string): ArrayBuffer {
  const bytes = new Uint8Array(new ArrayBuffer(page.length));
  for (const [index, character] of [...page].entries()) {
    const codePoint = character.codePointAt(0) ?? 0;
    if (codePoint > 0xff)
      throw new Error(`Not a Latin-1 character: ${character}`);
    bytes[index] = codePoint;
  }
  return bytes.buffer;
}

/** The recorded search form as the wire carries it. */
export function searchFormLatin1Bytes(): ArrayBuffer {
  return latin1Bytes(RECORDED_SEARCH_FORM);
}
