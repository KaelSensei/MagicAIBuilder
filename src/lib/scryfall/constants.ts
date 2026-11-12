/**
 * Where Scryfall serves its API, card images and symbol images.
 *
 * Card catalog context. The Scryfall clients (`client.ts`, `rulings.ts`,
 * `server-fetch.ts`), the image URL helpers (`images.ts`), the image proxy
 * route and the colour pickers build their URLs from these values, so a host
 * change is made here once. Safe in the browser, on the server and at the Edge.
 *
 * Not here: the request pacing (`request-queue.ts`), the User-Agent
 * (`lib/http.ts`) and the Content-Security-Policy origins
 * (`lib/security-headers.ts`), which list these hosts for the browser.
 *
 * Hosts checked against https://scryfall.com/docs/api and live
 * `/cards/named` and `/symbology` answers on 2026-11-11.
 *
 * @module scryfall/constants
 */
import { scryfallApiBaseUrl } from "./api-base-url";

/**
 * Origin of the Scryfall REST API, without a trailing slash: append a path
 * such as `/cards/search`. Every request to it is paced by `request-queue.ts`.
 *
 * `https://api.scryfall.com` everywhere but on a server whose
 * `SCRYFALL_API_BASE_URL` names another origin, which only the E2E stack does
 * (`api-base-url.ts`).
 */
export const SCRYFALL_API = scryfallApiBaseUrl();

/**
 * Host name of Scryfall's card image CDN, compared with `URL.hostname`.
 *
 * Image requests are not rate limited (https://scryfall.com/docs/api/rate-limits,
 * read 2026-11-11), so they bypass the API queue. The image proxy route
 * fetches from this host only, which is its SSRF guard.
 */
export const SCRYFALL_IMAGE_HOST = "cards.scryfall.io";

/** Where Scryfall serves the SVG of each mana and card symbol. */
const SYMBOL_SVG_BASE = "https://svgs.scryfall.io/card-symbols";

/**
 * URL of a mana symbol's SVG image on Scryfall.
 *
 * @param symbol - the symbol's characters without braces or slash, as the
 *   `svg_uri` of Scryfall's `/symbology` spells them: `W`, `C`, `GU` for
 *   {G/U}. Not checked: an unknown symbol gives a URL that answers 404.
 */
export function manaSymbolSvgUrl(symbol: string): string {
  return `${SYMBOL_SVG_BASE}/${symbol}.svg`;
}
