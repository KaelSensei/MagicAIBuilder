/**
 * AetherHub deck-builder URLs for the URL importer's AetherHub adapter
 * (`importAetherHub` in `../url-import.ts`).
 *
 * AetherHub is the one source the importer never calls: the whole decklist travels in the query
 * string of `https://aetherhub.com/Deck/Builder`, as `m` (main deck), `sb` (sideboard, or the
 * command zone when `t=cmd`) and `t` (the deck type), one "N Card Name" per line.
 *
 * These URLs are built, not recorded: aetherhub.com answers a scripted
 * `GET /Deck/Builder?m=…&sb=…&t=cmd` with a 403 bot challenge (checked 2026-11-19 with the app's
 * User-Agent), so there is no page to capture, and the adapter reads nothing but the URL.
 * `URLSearchParams` encodes them the way a browser submits a form (`+` for a space, `%0A` for a
 * line break, `%27` for an apostrophe), so they also pin how the adapter decodes a pasted URL.
 *
 * @module import/fixtures/aetherhub-builder-urls-v1
 */

/** The deck-builder page whose query string carries the decklist. */
const AETHERHUB_BUILDER = "https://aetherhub.com/Deck/Builder";

/**
 * Builds a deck-builder URL from its query parameters.
 *
 * @param params - `m`, `sb` and `t`, in the order they appear in the URL
 * @returns the URL a player would paste
 */
function builderUrl(params: Readonly<Record<string, string>>): string {
  return `${AETHERHUB_BUILDER}?${new URLSearchParams(params).toString()}`;
}

/** A Commander deck: three main-deck cards and its commander in `sb`. */
export const AETHERHUB_COMMANDER_DECK_URL = builderUrl({
  m: "1 Sol Ring\n1 Arcane Signet\n1 Command Tower",
  sb: "1 Atraxa, Praetors' Voice",
  t: "cmd",
});

/** A Commander deck led by a partner pair: both halves in `sb`, under the one heading. */
export const AETHERHUB_PARTNER_PAIR_URL = builderUrl({
  m: "1 Sol Ring",
  sb: "1 Thrasios, Triton Hero\n1 Tymna the Weaver",
  t: "cmd",
});

/** A Commander deck whose main deck is empty: the command zone alone. */
export const AETHERHUB_COMMANDER_ONLY_URL = builderUrl({
  m: "",
  sb: "1 Atraxa, Praetors' Voice",
  t: "cmd",
});

/** A constructed deck: no `t=cmd`, so `sb` is a real sideboard. */
export const AETHERHUB_CONSTRUCTED_DECK_URL = builderUrl({
  m: "4 Lightning Bolt\n20 Mountain",
  sb: "2 Negate",
});

/** A Commander URL with no card in either list. */
export const AETHERHUB_EMPTY_URL = builderUrl({ m: "", sb: "", t: "cmd" });
