// @vitest-environment node
/**
 * Characterization: the commander slug computed in JavaScript against its SQL twin (P1-20).
 *
 * Community context. One slug, two implementations:
 *
 * - `commanderToSlug` (`src/lib/meta/fetch.ts`) builds the slug in JavaScript. The sitemap
 *   (`src/app/sitemap.ts`) lists `/commanders/<slug>/decks` from it, and the EDHREC lookup uses it.
 * - The commander deck route (`src/app/api/community/commanders/[slug]/decks/route.ts`) matches
 *   the slug in SQL against `Deck.commanderName`, with the expression the partial index
 *   `Deck_commanderSlug_public_idx` covers (migration `20260819210000_denormalise_deck_commander`).
 *
 * When the two disagree on a name, the sitemap lists a commander page whose SQL lookup does not
 * find the deck that produced it. Unit tests cannot run SQL, so the SQL side is recorded: the
 * expression below was evaluated on 2026-11-11 (19:58 UTC) for every name in the table, on
 * PostgreSQL 16.14 from the repository's own image (`postgres:16-alpine`, `docker-compose.yml`),
 * database encoding UTF8, LC_CTYPE and LC_COLLATE `en_US.utf8`. `lower()` and `[[:space:]]`
 * follow the database's LC_CTYPE, so a database with another ctype may class non-ASCII spaces
 * differently. The first tests check that the route and the index still ship exactly the
 * recorded expression, so the recording cannot go stale silently.
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

/** The SQL twin of `commanderToSlug`, as recorded, applied to `"commanderName"`. */
const RECORDED_SQL_EXPRESSION = `regexp_replace(
  btrim(regexp_replace(lower("commanderName"), '[^a-z0-9[:space:]-]', '', 'g')),
  '[[:space:]]+', '-', 'g'
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
    case: "accented letter dropped",
    name: "Lim-Dûl the Necromancer",
    sql: "lim-dl-the-necromancer",
  },
  {
    case: "umlaut dropped",
    name: "Arna Kennerüd, Skycaptain",
    sql: "arna-kennerd-skycaptain",
  },
  { case: "accent and colon", name: "Ratonhnhaké:ton", sql: "ratonhnhakton" },
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
  { case: "ligature dropped", name: "Æther Vial", sql: "ther-vial" },
];

/** Names on which they disagree today: JavaScript trims and splits on more whitespace. */
const DIVERGING: readonly (RecordedSlug & { readonly js: string })[] = [
  // `btrim` trims spaces only; `trim()` also trims tabs and line breaks.
  { case: "a trailing tab", name: "Atraxa\t", sql: "atraxa-", js: "atraxa" },
  {
    case: "a leading line break",
    name: "\nAtraxa",
    sql: "-atraxa",
    js: "atraxa",
  },
  // `\s` matches a no-break space; `[[:space:]]` does not under this ctype, so SQL strips it.
  {
    case: "a no-break space",
    name: "Atraxa Grand",
    sql: "atraxagrand",
    js: "atraxa-grand",
  },
];

describe("the SQL twin of commanderToSlug", () => {
  it("is the recorded expression in the commander deck route", () => {
    expect(
      sourceOf("src/app/api/community/commanders/[slug]/decks/route.ts")
    ).toContain(`${squash(RECORDED_SQL_EXPRESSION)} = \${slug}`);
  });

  it("is the recorded expression in the index the route's query relies on", () => {
    expect(
      sourceOf(
        "prisma/migrations/20260819210000_denormalise_deck_commander/migration.sql"
      )
    ).toContain(
      `ON "Deck" (${squash(RECORDED_SQL_EXPRESSION)}) WHERE "isPublic" = true;`
    );
  });
});

describe("commanderToSlug against the recorded SQL slugs", () => {
  it.each(AGREEING)("agrees on $case", ({ name, sql }) => {
    expect(commanderToSlug(name)).toBe(sql);
  });

  it.each(DIVERGING)(
    "currently disagrees on $case (pinned; new follow-up, see the P1-20 PR)",
    ({ name, sql, js }) => {
      expect(commanderToSlug(name)).toBe(js);
      expect(js).not.toBe(sql);
    }
  );

  it("yields, for a name with no ASCII letter or digit, a slug the commander page rejects", () => {
    for (const name of ["ドラゴン", "---"]) {
      expect(isCommanderSlug(commanderToSlug(name))).toBe(false);
    }
  });

  it("currently lets the sitemap list a commander page whose SQL lookup misses the deck behind it (pinned; new follow-up, see the P1-20 PR)", () => {
    const [trailingTab] = DIVERGING;
    const updatedAt = new Date("2026-11-01T00:00:00Z");

    const pages = collapseToCommanders([
      { slug: commanderToSlug(trailingTab.name), updatedAt },
    ]);

    expect(pages).toEqual([{ slug: "atraxa", updatedAt }]);
    // The route compares the stored name's SQL slug, "atraxa-", with the URL's "atraxa".
    expect(trailingTab.sql).not.toBe(pages[0]?.slug);
  });
});
