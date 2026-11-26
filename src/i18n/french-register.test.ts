/**
 * The French interface addresses the player as « vous », never « tu ».
 *
 * The product's French practice is « vous » (docs/product/specs/
 * i64-help-centre-and-guidance.md, after Microsoft's French style guide). The
 * catalogue once mixed both registers, so one screen could switch from
 * « Désactivez-les si vous utilisez… » to « Connecte-toi pour voter ». This
 * scan reads every value of every `src/messages/fr/*.json` file and lists the
 * ones that use « tu ». It looks for three marks of the informal register:
 *
 * - a « tu » pronoun or possessive: tu, te, toi, t’, ton, ta, tes;
 * - a hyphenated singular imperative: « Connecte-toi », « Modifie-le »;
 * - a singular imperative from a curated verb list where a sentence or a
 *   clause starts: « Essaie une autre recherche », « ou utilise la syntaxe ».
 *
 * The verb list leaves out forms that are also nouns in this catalogue
 * (« Pioche », « Note », « Copie », « Filtre », « Compte », « Recherche »):
 * a string that uses one of those as a verb nearly always also carries a
 * possessive (« Note les blessures de tes commandants »), which the scan
 * catches.
 */
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const FRENCH_DIR = join(__dirname, "..", "messages", "fr");

/** « tu » pronouns and possessives, matched as whole words. */
const INFORMAL_WORD =
  /(?<!\p{L})(?:tu|te|toi|ton|ta|tes)(?!\p{L})|(?<!\p{L})t[’'](?=\p{L})/giu;

/**
 * A verb joined by a hyphen to its pronoun: « Connecte-toi », « Ajoutes-y ».
 * The formal imperative ends in « -ez » (« Désactivez-les »), so it is skipped.
 */
const HYPHENATED_IMPERATIVE =
  /(?<!\p{L})\p{L}+(?<!ez)-(?:toi|moi|le|la|les|lui|y|en)(?!\p{L})/giu;

/** Singular imperatives that are not also nouns in this catalogue. */
const IMPERATIVE_VERBS: readonly string[] = [
  "active",
  "affine",
  "ajoute",
  "appuie",
  "attends",
  "choisis",
  "clique",
  "colle",
  "commence",
  "confirme",
  "connecte",
  "consulte",
  "construis",
  "crée",
  "décris",
  "dépose",
  "désactive",
  "écris",
  "essaie",
  "explore",
  "fais",
  "glisse",
  "importe",
  "indique",
  "inscris",
  "lance",
  "mélange",
  "modifie",
  "ouvre",
  "réactive",
  "recharge",
  "réessaie",
  "regarde",
  "rejette",
  "renomme",
  "retire",
  "reviens",
  "saisis",
  "sélectionne",
  "supprime",
  "survole",
  "tape",
  "termine",
  "teste",
  "trouve",
  "utilise",
  "va",
  "vérifie",
];

/**
 * A curated verb where a sentence or a clause starts: the start of the value,
 * after `. ! ? : ; —`, after an ICU branch's `{`, or after « et », « ou » or
 * « puis ». Mid-sentence, the same forms are third-person verbs
 * (« Chaque tour ajoute une pioche »), so they are not matched there.
 */
const CLAUSE_IMPERATIVE = new RegExp(
  `(?:^|[.!?:;—{]\\s*|(?<!\\p{L})(?:et|ou|puis)\\s+)(${IMPERATIVE_VERBS.join("|")})(?!\\p{L})`,
  "giu"
);

/**
 * Values that trip the scan but do not address the player, keyed by
 * `namespace:key.path` (for example `deck:bracket.label`), each mapped to the
 * reason it stays: a card name, a quoted rules text, a third-person verb. Empty
 * today: every value the scan flagged was a real « tu ».
 */
const ALLOWED: ReadonlyMap<string, string> = new Map<string, string>();

/**
 * The marks of the informal register a text holds, in reading order.
 *
 * @param text - one catalogue value
 * @returns the matched words, empty when the text uses « vous » only
 */
function informalAddressIn(text: string): readonly string[] {
  return [
    ...Array.from(text.matchAll(INFORMAL_WORD), (match) => match[0]),
    ...Array.from(text.matchAll(HYPHENATED_IMPERATIVE), (match) => match[0]),
    ...Array.from(text.matchAll(CLAUSE_IMPERATIVE), (match) => match[1]),
  ];
}

/** One catalogue value and where it lives. */
interface CatalogueEntry {
  readonly id: string;
  readonly text: string;
}

/**
 * Every leaf value of a catalogue block, with its dotted key path.
 *
 * @param block - a parsed catalogue, a nested block or one value
 * @param path - the key path of `block`
 */
function entriesOf(block: unknown, path: string): readonly CatalogueEntry[] {
  if (typeof block === "string") {
    return [{ id: path, text: block }];
  }
  if (typeof block === "object" && block !== null) {
    return Object.entries(block).flatMap(([key, child]) =>
      entriesOf(child, path.endsWith(":") ? `${path}${key}` : `${path}.${key}`)
    );
  }
  return [];
}

/** Every value of every French namespace file. */
function frenchEntries(): readonly CatalogueEntry[] {
  return readdirSync(FRENCH_DIR)
    .filter((file) => file.endsWith(".json"))
    .flatMap((file) =>
      entriesOf(
        JSON.parse(readFileSync(join(FRENCH_DIR, file), "utf8")),
        `${file.replace(/\.json$/, "")}:`
      )
    );
}

describe("French register", () => {
  it.each([
    ["a « tu » pronoun", "Tu as pioché une carte", "Tu"],
    ["an object pronoun", "L’Anneau te tente", "te"],
    ["a possessive", "Prêt à tester ton deck ?", "ton"],
    ["an elided pronoun", "Il t’a ciblé", "t’"],
    ["a hyphenated imperative", "Connecte-toi pour voter", "Connecte-toi"],
    ["an imperative opening a value", "Essaie une autre recherche.", "Essaie"],
    [
      "an imperative opening a sentence",
      "Trop de requêtes. Attends un instant.",
      "Attends",
    ],
    [
      "an imperative after « ou »",
      "Patientez, ou utilise la syntaxe.",
      "utilise",
    ],
    [
      "an imperative in an ICU branch",
      "{count, plural, one {Choisis # carte}}",
      "Choisis",
    ],
  ])("the scan catches %s", (_mark, text, word) => {
    expect(informalAddressIn(text)).toContain(word);
  });

  it.each([
    [
      "the formal register",
      "Connectez-vous et ajoutez des cartes à votre collection.",
    ],
    [
      "words that contain the pronouns",
      "Tester une tentative : statut, total, tension, étape.",
    ],
    ["a third-person verb mid-sentence", "Chaque tour ajoute une pioche."],
    [
      "a formal hyphenated imperative",
      "Désactivez-les si vous utilisez un lecteur d’écran.",
    ],
  ])("the scan leaves %s alone", (_case, text) => {
    expect(informalAddressIn(text)).toEqual([]);
  });

  it("no French value addresses the player with « tu »", () => {
    const entries = frenchEntries();
    const offenders = entries
      .filter((entry) => !ALLOWED.has(entry.id))
      .filter((entry) => informalAddressIn(entry.text).length > 0)
      .map((entry) => `${entry.id} — ${entry.text}`);

    expect(entries.length).toBeGreaterThan(500);
    expect(offenders).toEqual([]);
  });

  it("every allowlisted value still exists and still trips the scan", () => {
    const tripping = new Set(
      frenchEntries()
        .filter((entry) => informalAddressIn(entry.text).length > 0)
        .map((entry) => entry.id)
    );

    expect([...ALLOWED.keys()].filter((id) => !tripping.has(id))).toEqual([]);
  });
});
