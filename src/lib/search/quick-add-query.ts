/**
 * The Scryfall query a quick-add line will run, and which zone Enter adds to.
 *
 * Card catalog. Quick add is the keyboard path of I-37 (editor depth, slices
 * 11.4 and 22): a name, a Commander role, or the player's own Scryfall line.
 * A sentence is rules text only when the player selects that reading, and the
 * query this function returns is the whole search (I-14: the player can read
 * what will run). The open deck's format and colour identity are applied here
 * (CR 903.4, CR 903.5c). Describing a card so a model writes the query stays
 * in the search panel's described search (I-14); this module does not call one.
 *
 * Not responsible for: fetching cards, or deciding that a card may enter the
 * deck. The palette searches the query and the deck store adds the card.
 *
 * @module search/quick-add-query
 */
import type { DeckZone } from "@/lib/deck/types";
import { buildInteractionQuery } from "@/lib/scryfall/search";
import type { InteractionType } from "@/lib/scryfall/search-types";

/**
 * Shortest line, once trimmed, that becomes a query. Matches
 * `MIN_SEARCH_QUERY_LENGTH` in `useCardSearch`: a shorter line is not sent.
 */
const MIN_QUICK_ADD_LENGTH = 2;

/** How a line that is not a role word or a Scryfall expression is read. */
export type QuickAddReading = "name" | "oracle";

/** The format legality and colour-identity clause of the open deck. */
export interface QuickAddScope {
  /** Scryfall's `legal:` value, such as `commander`. */
  readonly legality: string;
  /** From `deckIdentityScopeClause`. Empty when the deck has no identity in force. */
  readonly identityClause: string;
}

/** A line that is not searched. */
export interface IdleQuickAdd {
  readonly kind: "idle";
}

/** A card-name fragment, searched with `name:/…/`. */
export interface NameQuickAdd {
  readonly kind: "name";
  readonly query: string;
}

/** A Commander role whose query is `buildInteractionQuery`. */
export interface RoleQuickAdd {
  readonly kind: "role";
  readonly role: InteractionType;
  readonly query: string;
}

/** The player's own Scryfall syntax, run with the deck's scope added. */
export interface SyntaxQuickAdd {
  readonly kind: "syntax";
  readonly query: string;
}

/** A sentence read as oracle text, `o:"…"`. */
export interface OracleQuickAdd {
  readonly kind: "oracle";
  readonly query: string;
}

/** The one query a quick-add line produces, or an idle line. */
export type QuickAddPlan =
  | IdleQuickAdd
  | NameQuickAdd
  | RoleQuickAdd
  | SyntaxQuickAdd
  | OracleQuickAdd;

/** The keys of one keydown, enough to tell Enter's zone apart. */
export interface QuickAddChord {
  readonly key: string;
  readonly shiftKey: boolean;
  readonly altKey: boolean;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
}

/** English and French names for the six roles `buildInteractionQuery` knows. */
const ROLE_ALIASES: readonly (readonly [string, InteractionType])[] = [
  ["ramp", "ramp"],
  ["rampe", "ramp"],
  ["removal", "removal"],
  ["retrait", "removal"],
  ["counterspell", "counterspell"],
  ["contresort", "counterspell"],
  ["wipe", "wipe"],
  ["wrath", "wipe"],
  ["board wipe", "wipe"],
  ["balayage", "wipe"],
  ["tutor", "tutor"],
  ["tuteur", "tutor"],
  ["draw", "draw"],
  ["pioche", "draw"],
];

/**
 * Plans the one Scryfall query for a quick-add line.
 *
 * An exact role word wins over the name and rules-text readings. A line that
 * contains `:` is the player's syntax and is run with the deck's legality and
 * colour identity added when those terms are not already present. Anything
 * else is a name, unless the player has selected the rules-text reading.
 * A line shorter than two characters, and a blank line, plan nothing.
 *
 * @param input.text - The line the player typed, in either language
 * @param input.reading - Name, or rules text for a sentence
 * @param input.scope - The open deck's legality and colour identity
 * @returns The query to show and to run, or an idle plan
 */
export function planQuickAddQuery(input: {
  readonly text: string;
  readonly reading: QuickAddReading;
  readonly scope: QuickAddScope;
}): QuickAddPlan {
  const folded = foldQuickAddText(input.text);
  const role = roleFor(folded);
  if (role) return { kind: "role", role, query: scoped(buildInteractionQuery(role), input.scope) };
  if (folded.length < MIN_QUICK_ADD_LENGTH) return { kind: "idle" };
  const written = input.text.trim().replace(/\s+/g, " ");
  if (written.includes(":")) return { kind: "syntax", query: scoped(written, input.scope) };
  if (input.reading === "oracle") {
    return { kind: "oracle", query: scoped(`o:"${escapeOraclePhrase(written)}"`, input.scope) };
  }
  return { kind: "name", query: scoped(`name:/${escapeNamePattern(written)}/`, input.scope) };
}

/**
 * The zone Enter adds to. Shift selects the sideboard and Alt selects
 * considering. Ctrl, Cmd, any other key, and more than one modifier add nothing.
 *
 * @param chord - The key and the modifiers held with it
 * @returns The zone, or null when the chord is not an add
 */
export function zoneForQuickAddChord(chord: QuickAddChord): DeckZone | null {
  if (chord.key !== "Enter") return null;
  const held = [chord.shiftKey, chord.altKey, chord.ctrlKey, chord.metaKey].filter(Boolean).length;
  if (held > 1 || chord.ctrlKey || chord.metaKey) return null;
  if (chord.shiftKey) return "sideboard";
  if (chord.altKey) return "maybeboard";
  return "main";
}

/**
 * Lowercases a line and strips French accents, so "Rampe" and "rampe" match.
 *
 * @param value - The player's line
 * @returns The folded line, with the ends trimmed and inner space collapsed
 */
function foldQuickAddText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * The role an exact alias names.
 *
 * @param folded - A line from {@link foldQuickAddText}
 * @returns The role, or null when the line is not an alias
 */
function roleFor(folded: string): InteractionType | null {
  for (const [alias, role] of ROLE_ALIASES) {
    if (alias === folded) return role;
  }
  return null;
}

/**
 * Adds the deck's legality and colour identity when the query does not already
 * carry them. A second copy would change the meaning of a line the player wrote.
 *
 * @param query - The query so far
 * @param scope - The open deck
 * @returns The query the palette shows and runs
 */
function scoped(query: string, scope: QuickAddScope): string {
  const withLegality = /(^|\s)legal:/.test(query) ? query : `${query} legal:${scope.legality}`;
  if (scope.identityClause.length === 0 || withLegality.includes(scope.identityClause)) {
    return withLegality;
  }
  return `${withLegality} ${scope.identityClause}`;
}

/**
 * Escapes a name for Scryfall's `name:/regex/` term.
 * The slash is the delimiter (https://scryfall.com/docs/syntax, read 2026-11-20).
 *
 * @param value - The trimmed name fragment
 * @returns The fragment safe to place between slashes
 */
function escapeNamePattern(value: string): string {
  return value.replace(/[\\/^$.*+?()[\]{}|]/g, "\\$&");
}

/**
 * Escapes a phrase for an `o:"…"` term.
 *
 * @param value - The trimmed sentence
 * @returns The phrase safe to place between double quotes
 */
function escapeOraclePhrase(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
