/**
 * Reads the card a drag or a paste from another site names: a Scryfall card page, image or API
 * address, an EDHREC card page, or a card name typed as one line.
 *
 * Deck editing (I-37, "accept a card dragged or pasted from Scryfall, EDHREC…",
 * `docs/product/specs/i37-editor-depth.md`). Pure: strings in, a reference out. The caller takes
 * the strings out of the browser's `DataTransfer` or `ClipboardEvent`, and resolves the reference
 * through the Scryfall client. Nothing here requests the dropped address, and only the address
 * shapes below are read: anything else is refused before any request is sent.
 *
 * Not responsible for: looking the card up, the zone it lands in, the messages.
 *
 * @module deck/external-card-link
 */

/** What a drag or a paste from outside the builder carries, as plain strings. */
export interface DroppedPayload {
  /** The `text/uri-list` entry: one address per line, `#` lines are comments (RFC 2483 §5). */
  readonly uriList: string;
  /** The `text/plain` entry. */
  readonly plainText: string;
  /** The `text/html` entry; only its first image or link address is read, never its markup. */
  readonly html: string;
  /** Whether the payload holds files. */
  readonly hasFiles: boolean;
}

/** The card a payload names, or why it names none. */
export type ExternalCardReference =
  /** A Scryfall printing, by its Scryfall id. */
  | { readonly kind: "scryfall-id"; readonly id: string }
  /** A Scryfall printing, by its set code and collector number. */
  | {
      readonly kind: "set-number";
      readonly set: string;
      readonly collectorNumber: string;
    }
  /** A card name: `exact` as typed, `fuzzy` when rebuilt from a page slug. */
  | {
      readonly kind: "name";
      readonly name: string;
      readonly match: "exact" | "fuzzy";
    }
  /** Files and no address: the import reads files, not this. */
  | { readonly kind: "file" }
  /** An address this reader does not accept. */
  | { readonly kind: "refused"; readonly reason: "unreadable-link" }
  /** Nothing that could name one card: empty, several lines, too long, or over the size cap. */
  | { readonly kind: "ignored" };

/** Payloads over 10 KB, counted in characters, are dropped unread (I-37 task, untrusted input). */
const MAX_PAYLOAD_LENGTH = 10 * 1024;
/** The longest one-line text read as a card name. */
const MAX_NAME_LENGTH = 200;

const REFUSED: ExternalCardReference = {
  kind: "refused",
  reason: "unreadable-link",
};
const IGNORED: ExternalCardReference = { kind: "ignored" };

/** A URI scheme at the start of the text (RFC 3986 §3.1): `https:`, `javascript:`… */
const SCHEME = /^[a-z][a-z\d+.-]*:/i;
const UUID = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;
/** Scryfall set codes are three to six letters or digits; two-letter codes are kept for safety. */
const SET_CODE = /^[a-z\d]{2,6}$/i;
/** Collector numbers: digits with letters, a hyphen, or the ★ and † marks Scryfall prints. */
const COLLECTOR_NUMBER = /^[a-z\d★†-]{1,12}$/i;
const IMAGE_FILE = /^([\da-f-]{36})\.(?:jpg|png|webp)$/i;
const IMAGE_FACES: ReadonlySet<string> = new Set(["front", "back"]);
const EDHREC_SLUG = /^[a-z\d]+(?:-[a-z\d]+)*$/i;
const IMAGE_SOURCE = /\ssrc\s*=\s*["']([^"']*)["']/i;
const LINK_TARGET = /\shref\s*=\s*["']([^"']*)["']/i;

type PathReader = (segments: readonly string[]) => ExternalCardReference | null;

/**
 * `https://cards.scryfall.io/<size>/<face>/<a>/<b>/<id>.<ext>`, where `<a>` and `<b>` are the
 * id's first two characters. EDHREC and Archidekt serve card images from this host too.
 */
function readScryfallImage(
  segments: readonly string[]
): ExternalCardReference | null {
  const [, face, first, second, file] = segments;
  if (segments.length !== 5 || face === undefined || !IMAGE_FACES.has(face))
    return null;
  const id = IMAGE_FILE.exec(file ?? "")?.[1];
  if (id === undefined || !UUID.test(id)) return null;
  if (first !== id.charAt(0) || second !== id.charAt(1)) return null;
  return { kind: "scryfall-id", id };
}

/** `https://api.scryfall.com/cards/<id>`. */
function readScryfallApi(
  segments: readonly string[]
): ExternalCardReference | null {
  const [resource, id] = segments;
  if (segments.length !== 2 || resource !== "cards" || id === undefined)
    return null;
  return UUID.test(id) ? { kind: "scryfall-id", id } : null;
}

function decodedSegment(segment: string): string | null {
  try {
    return decodeURIComponent(segment);
  } catch {
    return null;
  }
}

/** `https://scryfall.com/card/<set>/<number>/<name>`, the name slug optional. */
function readScryfallPage(
  segments: readonly string[]
): ExternalCardReference | null {
  const [resource, set, number] = segments;
  if (resource !== "card" || segments.length < 3 || segments.length > 4)
    return null;
  const collectorNumber = decodedSegment(number ?? "");
  if (set === undefined || !SET_CODE.test(set)) return null;
  if (collectorNumber === null || !COLLECTOR_NUMBER.test(collectorNumber))
    return null;
  return { kind: "set-number", set: set.toLowerCase(), collectorNumber };
}

/** `https://edhrec.com/cards/<slug>`; the slug's words are looked up loosely, as a name. */
function readEdhrecPage(
  segments: readonly string[]
): ExternalCardReference | null {
  const [resource, slug] = segments;
  if (segments.length !== 2 || resource !== "cards" || slug === undefined)
    return null;
  if (!EDHREC_SLUG.test(slug)) return null;
  return { kind: "name", name: slug.split("-").join(" "), match: "fuzzy" };
}

/** The only hosts read, each with its one reader. */
const READERS_BY_HOST: ReadonlyMap<string, PathReader> = new Map([
  ["cards.scryfall.io", readScryfallImage],
  ["api.scryfall.com", readScryfallApi],
  ["scryfall.com", readScryfallPage],
  ["edhrec.com", readEdhrecPage],
]);

function parsedUrl(address: string): URL | null {
  try {
    return new URL(address);
  } catch {
    return null;
  }
}

/** Reads one address: `https:` only, on a listed host, with no credentials and no port. */
function readAddress(address: string): ExternalCardReference {
  const url = parsedUrl(address);
  if (url === null || url.protocol !== "https:") return REFUSED;
  if (url.username !== "" || url.password !== "" || url.port !== "")
    return REFUSED;
  const read = READERS_BY_HOST.get(url.hostname);
  const segments = url.pathname.split("/").filter((segment) => segment !== "");
  return read?.(segments) ?? REFUSED;
}

/** The first address of a `text/uri-list`, skipping its comment lines. */
function firstListedAddress(uriList: string): string | null {
  const lines = uriList.split(/\r?\n/).map((line) => line.trim());
  return lines.find((line) => line !== "" && !line.startsWith("#")) ?? null;
}

/** The first image address of dropped HTML, else its first link; the markup is never parsed. */
function firstHtmlAddress(html: string): string | null {
  return IMAGE_SOURCE.exec(html)?.[1] ?? LINK_TARGET.exec(html)?.[1] ?? null;
}

/** Plain text: an address when it starts with a scheme, else one line read as an exact name. */
function readPlainText(text: string): ExternalCardReference {
  if (SCHEME.test(text)) return readAddress(text);
  if (/[\r\n]/.test(text) || text.length > MAX_NAME_LENGTH) return IGNORED;
  return { kind: "name", name: text, match: "exact" };
}

/**
 * Reads the card a dropped or pasted payload names.
 *
 * Reads `text/uri-list` first, then `text/plain`, then the first image or link address of
 * `text/html`; the first entry that holds anything decides. Files count only when no entry
 * holds an address, since a browser offers a dragged image both as its address and as a file.
 *
 * @param payload - the payload's strings, as the browser handed them over
 * @returns the reference to look up, or why there is none; never throws
 */
export function readExternalCardReference(
  payload: DroppedPayload
): ExternalCardReference {
  const { uriList, plainText, html, hasFiles } = payload;
  if (uriList.length + plainText.length + html.length > MAX_PAYLOAD_LENGTH)
    return IGNORED;
  const listed = firstListedAddress(uriList);
  if (listed !== null) return readAddress(listed);
  const text = plainText.trim();
  if (text !== "") return readPlainText(text);
  const embedded = firstHtmlAddress(html);
  if (embedded !== null) return readAddress(embedded);
  return hasFiles ? { kind: "file" } : IGNORED;
}
