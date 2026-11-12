// @vitest-environment node
/**
 * The commander slug computed in JavaScript against its SQL twin (P1-20).
 *
 * Community context. One slug, two implementations:
 *
 * - `commanderToSlug` (`src/lib/meta/fetch.ts`) builds the slug in JavaScript. The sitemap
 *   (`src/app/sitemap.ts`) lists `/commanders/<slug>/decks` from it, and the EDHREC lookup uses it.
 * - The commander decks lookup (`src/lib/community/commander-decks-lookup.ts`, behind
 *   `GET /api/community/commanders/[slug]/decks` and the commander decks page) matches
 *   the slug in SQL against `Deck.commanderName`, with the expression the partial index
 *   `Deck_commanderSlug_v2_public_idx` covers (migration
 *   `20261111210000_commander_slug_transliterates_accents`).
 *
 * When the two disagree on a name, the sitemap lists a commander page whose SQL lookup does not
 * find the deck that produced it. Unit tests cannot run SQL, so the SQL side is recorded: the
 * expression below was evaluated on 2026-11-11 (20:25 UTC) for every name in the table, on
 * PostgreSQL 16.14 from the repository's own image (`postgres:16-alpine`, `docker-compose.yml`),
 * encoding UTF8, in two databases: LC_CTYPE and LC_COLLATE `en_US.utf8`, and both `C`. Both
 * returned the same slugs. The expression no longer follows the database's ctype: `lower()` runs
 * under the `C` collation, and whitespace is an explicit class (see the whitespace test below).
 * The same evaluation, run once over every code point U+0001 to U+10FFFF (surrogates excluded,
 * each as `<c>A<c>b<c>`), found no name on which the expression and `commanderToSlug` differ.
 * The first tests check that the lookup and the index still ship exactly the recorded
 * expression, so the recording cannot go stale silently.
 *
 * COM-02 moves `commanderToSlug` into the community domain; this table protects that move.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { collapseToCommanders } from "@/lib/seo/sitemap";
import { commanderToSlug, isCommanderSlug } from "./fetch";

/** The repository root, three levels above this file (`src/lib/meta/`). */
const REPO_ROOT = join(__dirname, "..", "..", "..");

/**
 * The characters the SQL twin treats as whitespace, as the body of a PostgreSQL bracket
 * expression: the 25 characters JavaScript's `\s` and `trim()` treat as whitespace.
 */
const SQL_WHITESPACE_CLASS = String.raw`\t\n\v\f\r \u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff`;

/** The SQL twin of `commanderToSlug`, as recorded, applied to `"commanderName"`. */
const RECORDED_SQL_EXPRESSION = String.raw`regexp_replace(
  btrim(regexp_replace(
    regexp_replace(
      lower(normalize("commanderName", NFD) COLLATE "C"),
      '[${SQL_WHITESPACE_CLASS}]', ' ', 'g'
    ),
    '[^a-z0-9 -]', '', 'g'
  )),
  ' +', '-', 'g'
)`;

/** Collapses whitespace runs so indentation and line breaks do not count. */
function squash(sql: string): string {
  return sql
    .replaceAll(/\s+/g, " ")
    .replaceAll("( ", "(")
    .replaceAll(" )", ")")
    .trim();
}

function sourceOf(path: string): string {
  return squash(readFileSync(join(REPO_ROOT, path), "utf8"));
}

interface RecordedSlug {
  /** What the name tests. */
  readonly case: string;
  readonly name: string;
  /** What PostgreSQL returned for the name. */
  readonly sql: string;
}

/** Names on which both implementations agree, with the recorded SQL slug. */
const AGREEING: readonly RecordedSlug[] = [
  {
    case: "comma and apostrophe",
    name: "Atraxa, Praetors' Voice",
    sql: "atraxa-praetors-voice",
  },
  { case: "hyphen kept", name: "The Ur-Dragon", sql: "the-ur-dragon" },
  {
    case: "circumflex transliterated",
    name: "Lim-Dûl the Necromancer",
    sql: "lim-dul-the-necromancer",
  },
  {
    case: "umlaut transliterated",
    name: "Arna Kennerüd, Skycaptain",
    sql: "arna-kennerud-skycaptain",
  },
  { case: "accent and colon", name: "Ratonhnhaké:ton", sql: "ratonhnhaketon" },
  {
    case: "accent and the modifier colon Scryfall prints",
    name: "Ratonhnhaké\ua789ton",
    sql: "ratonhnhaketon",
  },
  {
    case: "capital accented first letter",
    name: "Éowyn, Fearless Knight",
    sql: "eowyn-fearless-knight",
  },
  { case: "acute accent", name: "Márton Stromgald", sql: "marton-stromgald" },
  {
    case: "accent before a comma",
    name: "Glóin, Dwarf Emissary",
    sql: "gloin-dwarf-emissary",
  },
  {
    case: "double-faced name with //",
    name: "Esika, God of the Tree // The Prismatic Bridge",
    sql: "esika-god-of-the-tree-the-prismatic-bridge",
  },
  {
    case: "double quotes",
    name: 'Henzie "Toolbox" Torre',
    sql: "henzie-toolbox-torre",
  },
  { case: "curly apostrophe", name: "Atraxa’s Voice", sql: "atraxas-voice" },
  {
    case: "capitals",
    name: "KENRITH, THE RETURNED KING",
    sql: "kenrith-the-returned-king",
  },
  { case: "digits kept", name: "Sliver Overlord 2", sql: "sliver-overlord-2" },
  { case: "outer spaces trimmed", name: "  Atraxa  ", sql: "atraxa" },
  {
    case: "em space inside",
    name: "Kenrith the Returned King",
    sql: "kenrith-the-returned-king",
  },
  { case: "Kelvin sign lowercases to k", name: "Kenrith", sql: "kenrith" },
  { case: "dotted capital I", name: "İmmortal Sun", sql: "immortal-sun" },
  {
    case: "underscores dropped",
    name: "Name_With_Underscores",
    sql: "namewithunderscores",
  },
  {
    case: "spaced hyphen",
    name: "Rograkh - Son of Rohgahh",
    sql: "rograkh---son-of-rohgahh",
  },
  { case: "hyphens only", name: "---", sql: "---" },
  { case: "no ASCII letter", name: "ドラゴン", sql: "" },
  // NFD does not decompose Æ: it is a letter of its own. Oracle names spell it "Ae"
  // ("Aether Vial" on https://api.scryfall.com/cards/named, read 2026-11-11).
  { case: "ligature dropped", name: "Æther Vial", sql: "ther-vial" },
  // Before migration 20261111210000, `btrim` trimmed spaces only and `[[:space:]]` missed the
  // no-break space, so SQL answered "atraxa-", "-atraxa" and "atraxagrand" for these three.
  { case: "a trailing tab trimmed", name: "Atraxa\t", sql: "atraxa" },
  { case: "a leading line break trimmed", name: "\nAtraxa", sql: "atraxa" },
  {
    case: "a no-break space between words",
    name: "Atraxa\u00a0Grand",
    sql: "atraxa-grand",
  },
];

/** What the PostgreSQL regex escapes `\t` to `\r` stand for. */
const SQL_CONTROL_ESCAPES: ReadonlyMap<string, number> = new Map([
  ["t", 0x09],
  ["n", 0x0a],
  ["v", 0x0b],
  ["f", 0x0c],
  ["r", 0x0d],
]);

/** One member of a bracket expression as a code point, or the `-` of a range. */
function bracketToken(match: RegExpMatchArray): number | "-" {
  const [literal, hex, control] = [match[0], match[1], match[2]];
  if (hex !== undefined) return Number.parseInt(hex, 16);
  if (control !== undefined)
    return SQL_CONTROL_ESCAPES.get(control) ?? Number.NaN;
  return literal === "-" ? "-" : (literal.codePointAt(0) ?? Number.NaN);
}

/**
 * The code points a bracket-expression body lists, written with literal characters, `\t`-style
 * escapes, `\uXXXX` escapes and `a-b` ranges (the subset `SQL_WHITESPACE_CLASS` uses).
 */
function codePointsOf(bracketBody: string): ReadonlySet<number> {
  const tokens = [
    ...bracketBody.matchAll(/\\u([0-9a-f]{4})|\\([tnvfr])|./gu),
  ].map(bracketToken);
  const points = new Set<number>();
  for (let i = 0; i < tokens.length; i += 1) {
    const [first, dash, last] = [tokens[i], tokens[i + 1], tokens[i + 2]];
    if (typeof first !== "number") continue;
    if (dash === "-" && typeof last === "number") {
      for (let point = first; point <= last; point += 1) points.add(point);
      i += 2;
    } else {
      points.add(first);
    }
  }
  return points;
}

describe("the SQL twin of commanderToSlug", () => {
  it("is the recorded expression in the commander decks lookup", () => {
    // The lookup's query is a JavaScript template literal, so it doubles each backslash to
    // send one to PostgreSQL.
    const asWrittenInTheLookup = squash(RECORDED_SQL_EXPRESSION).replaceAll(
      "\\",
      "\\\\"
    );

    expect(sourceOf("src/lib/community/commander-decks-lookup.ts")).toContain(
      `${asWrittenInTheLookup} = \${slug}`
    );
  });

  it("is the recorded expression in the index the lookup's query relies on", () => {
    expect(
      sourceOf(
        "prisma/migrations/20261111210000_commander_slug_transliterates_accents/migration.sql"
      )
    ).toContain(
      `ON "Deck" (${squash(RECORDED_SQL_EXPRESSION)}) WHERE "isPublic" = true;`
    );
  });

  it("treats as whitespace exactly the characters JavaScript's \\s matches", () => {
    const javascriptWhitespace = new Set<number>();
    // Every character `\s` matches sits in the Basic Multilingual Plane.
    for (let point = 0; point <= 0xffff; point += 1) {
      if (/\s/.test(String.fromCharCode(point)))
        javascriptWhitespace.add(point);
    }

    expect([...codePointsOf(SQL_WHITESPACE_CLASS)]).toEqual([
      ...javascriptWhitespace,
    ]);
  });
});

describe("commanderToSlug against the recorded SQL slugs", () => {
  it.each(AGREEING)("agrees on $case", ({ name, sql }) => {
    expect(commanderToSlug(name)).toBe(sql);
  });

  it("yields, for a name with no ASCII letter or digit, a slug the commander page rejects", () => {
    for (const name of ["ドラゴン", "---"]) {
      expect(isCommanderSlug(commanderToSlug(name))).toBe(false);
    }
  });

  it("lets the sitemap list, for every recorded name, the page whose SQL lookup finds the deck behind it", () => {
    const updatedAt = new Date("2026-11-01T00:00:00Z");

    for (const { name, sql } of AGREEING) {
      const pages = collapseToCommanders([
        { slug: commanderToSlug(name), updatedAt },
      ]);

      // The lookup compares the stored name's SQL slug with the URL's slug. A slug the
      // commander page rejects stays out of the sitemap altogether.
      expect(pages).toEqual(
        isCommanderSlug(sql) ? [{ slug: sql, updatedAt }] : []
      );
    }
  });
});
