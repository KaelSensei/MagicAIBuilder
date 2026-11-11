// Scryfall card image URL helpers
import type { ScryfallCard, ScryfallImageUris } from "./types";
import { SCRYFALL_IMAGE_HOST } from "./constants";

/**
 * Scryfall's WebP image versions, the ones the app shows: `thumb` 146×204,
 * `grid` 488×680, `display` 672×936, `crop` (border crop) 480×680 and `art`
 * (art crop). The small, large, border_crop and art_crop JPEGs they replace
 * stop on 2027-01-01; `normal` stays as `jpeg`.
 */
export type ImageSize = "thumb" | "grid" | "display" | "crop" | "art";

type CardSide = "front" | "back";

/**
 * The JPEG keys each WebP version replaces, for card JSON cached before the
 * change. `jpeg` is the new name of `normal`.
 */
const LEGACY_KEYS_BY_SIZE: Readonly<
  Record<ImageSize, readonly (keyof ScryfallImageUris)[]>
> = {
  thumb: ["small"],
  grid: ["normal", "jpeg"],
  display: ["large"],
  crop: ["border_crop"],
  art: ["art_crop"],
};

/**
 * WebP replacement for each JPEG-era path segment. `normal` keeps working as
 * `jpeg`, but `grid` is the same size and lighter. PNG hotlinking ends with
 * the JPEGs, so a PNG moves to the largest WebP.
 */
const SIZE_BY_LEGACY_SEGMENT: ReadonlyMap<string, ImageSize> = new Map([
  ["small", "thumb"],
  ["normal", "grid"],
  ["large", "display"],
  ["border_crop", "crop"],
  ["art_crop", "art"],
  ["png", "display"],
]);

const LEGACY_FILE_NAME = /^([\da-f-]+)\.(?:jpg|png)$/;

/**
 * Maps a stored JPEG-era Scryfall image URL to its WebP analog.
 *
 * Deck cards, collections, favourites, packages and snapshots store the URL
 * Scryfall gave when the card was saved. Scryfall keeps one path scheme,
 * `/{version}/{front|back}/{a}/{b}/{id}.{ext}`, so the new version is the
 * same path with the WebP version and extension. Anything else — a current
 * WebP URL, another host, the bundled card back — is returned unchanged.
 *
 * @param url - image URL as stored
 * @returns the URL to request
 */
export function normalizeScryfallImageUrl(url: string): string {
  if (!url.includes(SCRYFALL_IMAGE_HOST)) return url;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  if (parsed.hostname !== SCRYFALL_IMAGE_HOST) return url;

  const segments = parsed.pathname.split("/");
  if (segments.length !== 6) return url;
  const [, version, side, first, second, fileName] = segments;
  const size = SIZE_BY_LEGACY_SEGMENT.get(version);
  const id = LEGACY_FILE_NAME.exec(fileName)?.[1];
  if (!size || !id || (side !== "front" && side !== "back")) return url;

  parsed.pathname = `/${size}/${side}/${first}/${second}/${id}.webp`;
  return parsed.toString();
}

/**
 * Image versions for the requested face: the card's own for a single-faced
 * card, else the face's, else the front face's.
 */
function imageUrisFor(
  card: ScryfallCard,
  side: CardSide
): ScryfallImageUris | undefined {
  if (card.image_uris) return card.image_uris;
  const faceIndex = side === "back" ? 1 : 0;
  return (
    card.card_faces?.[faceIndex]?.image_uris ?? card.card_faces?.[0]?.image_uris
  );
}

/**
 * The URL a card's image versions list for one WebP version: its own key,
 * else the JPEG it replaces mapped to WebP.
 *
 * @param uris - `image_uris` of a card or face, if any
 * @param size - WebP version
 * @returns the URL, or undefined when the list has neither key
 */
export function getListedImageUri(
  uris: ScryfallImageUris | undefined,
  size: ImageSize
): string | undefined {
  if (!uris) return undefined;
  const listed = [size, ...LEGACY_KEYS_BY_SIZE[size]]
    .map((key) => uris[key])
    .find((url): url is string => url !== undefined);
  return listed === undefined ? undefined : normalizeScryfallImageUrl(listed);
}

/**
 * Get card image URL for a given size.
 *
 * Prefers the WebP version Scryfall lists, then the card image (`grid`, or
 * the `jpeg` it replaces). Card JSON cached before WebP existed only lists
 * JPEGs, which are mapped to their WebP analog; a card with no images gets a
 * URL built from its id.
 *
 * @param card - Scryfall card
 * @param size - WebP version, `grid` by default
 * @param side - "front" (default) or "back" for DFC/MDFC cards
 * @returns the image URL
 */
export function getCardImageUri(
  card: ScryfallCard,
  size: ImageSize = "grid",
  side: CardSide = "front"
): string {
  const uris = imageUrisFor(card, side);
  return (
    getListedImageUri(uris, size) ??
    getListedImageUri(uris, "grid") ??
    buildScryfallImageUrl(card.id, size, side)
  );
}

/**
 * Constructs a Scryfall WebP image URL from a printing id.
 *
 * @param id - Scryfall printing id
 * @param size - WebP version, `grid` by default
 * @param side - "front" (default) or "back"
 * @returns the image URL
 */
export function buildScryfallImageUrl(
  id: string,
  size: ImageSize = "grid",
  side: CardSide = "front"
): string {
  return `https://${SCRYFALL_IMAGE_HOST}/${size}/${side}/${id[0]}/${id[1]}/${id}.webp`;
}

/** Placeholder card back image */
export const CARD_BACK_URL = "/images/card-back.svg";
