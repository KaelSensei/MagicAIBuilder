/**
 * Characterization corpus: the two decklist text parsers, side by side.
 *
 * Decklist text is parsed twice today. `parseTextDecklist`
 * (`lib/deck/import.ts`) serves the paste dialog and bulk edit;
 * `parsePlainTextDecklist` (`lib/import/decklist-parse.ts`) serves the URL
 * importers (TappedOut, MTGTop8, MTGDecks, AetherHub). They disagree on the
 * Commander section, on count-less lines and on which suffixes they strip.
 *
 * Each case feeds one decklist from `fixtures/decklists/` to both parsers and
 * pins both outputs exactly, odd parts included. Nothing here says which
 * output is right. Owner decision OD-04 of the clean-code refactor plan
 * settles that: one parser; every card under a Commander heading (two at most)
 * goes to the command zone, a Companion heading fills the companion slot, a
 * count-less line means one copy, and foil markers, printings, Archidekt tags
 * and comments are stripped. B2-27 builds that parser. Each case's `od04`
 * notes say which side OD-04 flips, or which question it leaves open; B2-27
 * changes these pins on purpose.
 *
 * @module import/decklist-divergence.test
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseTextDecklist, type ImportResult } from "@/lib/deck/import";
import type { DeckZone } from "@/lib/deck/types";
import { parsePlainTextDecklist } from "./decklist-parse";
import type { UrlImportCard } from "./url-import";

// ---------------------------------------------------------------------------
// OD-04 annotations
// ---------------------------------------------------------------------------

/** The clauses of OD-04, as B2-27 will implement them. */
type Od04Rule =
  | "a Commander heading holds up to two command-zone cards"
  | "a line without a count means one copy"
  | "foil markers are stripped"
  | "set codes and collector numbers are stripped"
  | "Archidekt category tags are stripped"
  | "comments are stripped";

/**
 * What OD-04 does to one difference in a case: it flips the named parser's
 * output to the rule, or it leaves a question that B2-27 must answer.
 */
type Od04Note =
  | { readonly flips: "paste" | "url" | "both"; readonly rule: Od04Rule }
  | { readonly open: string };

// ---------------------------------------------------------------------------
// Expected outputs
// ---------------------------------------------------------------------------

type Slot =
  "commander" | "partner" | "companion" | "main" | "sideboard" | "maybeboard";

/** A card row as `parseTextDecklist` returns it: the main deck has no `zone` key. */
function pasted(
  quantity: number,
  name: string,
  zone: DeckZone = "main"
): ImportResult["cards"][number] {
  return zone === "main" ? { name, quantity } : { name, quantity, zone };
}

/** The whole `parseTextDecklist` result; the command zone holds names only. */
function pasteResult(
  commandZone: {
    readonly commander?: string;
    readonly partner?: string;
    readonly companion?: string;
  },
  cards: ImportResult["cards"],
  errors: string[] = []
): ImportResult {
  return {
    commander: commandZone.commander ?? null,
    partner: commandZone.partner ?? null,
    companion: commandZone.companion ?? null,
    cards,
    errors,
  };
}

/**
 * A card as `parsePlainTextDecklist` returns it. The parser writes
 * `isCompanion: undefined` on every card outside a Companion section, and
 * files command-zone cards under `zone: "main"`.
 */
function fetched(slot: Slot, quantity: number, name: string): UrlImportCard {
  return {
    name,
    quantity,
    isCommander: slot === "commander",
    isPartner: slot === "partner",
    isCompanion: slot === "companion" ? true : undefined,
    zone: slot === "sideboard" || slot === "maybeboard" ? slot : "main",
  };
}

// ---------------------------------------------------------------------------
// The corpus
// ---------------------------------------------------------------------------

interface CorpusCase {
  /** File under `fixtures/decklists/`, or a label for a generated input. */
  readonly fixture: string;
  /** Where this shape of decklist comes from. */
  readonly source: string;
  readonly input: string;
  /** `parseTextDecklist` today. */
  readonly paste: ImportResult;
  /** `parsePlainTextDecklist` today. */
  readonly url: readonly UrlImportCard[];
  /** Empty when both parsers already do what OD-04 asks. */
  readonly od04: readonly Od04Note[];
}

const FIXTURES = join(
  dirname(fileURLToPath(import.meta.url)),
  "fixtures",
  "decklists"
);

function decklist(fixture: string): string {
  return readFileSync(join(FIXTURES, fixture), "utf8");
}

function fixtureCase(
  fixture: string,
  rest: Omit<CorpusCase, "fixture" | "input">
): CorpusCase {
  return { fixture, input: decklist(fixture), ...rest };
}

const LONG_LIST_LINES = 501;
/** Both parsers read the first 500 raw lines; the 501st card is the one cut. */
const LONG_LIST_KEPT = Array.from(
  { length: 500 },
  (_, index) => `Card ${index}`
);

const CORPUS: readonly CorpusCase[] = [
  fixtureCase("plain-quantities.txt", {
    source:
      "hand-typed list: counts with and without an x, and a line with no count",
    paste: pasteResult({}, [
      pasted(1, "Sol Ring"),
      pasted(1, "Arcane Signet"),
      pasted(4, "Island"),
      pasted(1, "Command Tower"),
    ]),
    url: [
      fetched("main", 1, "Sol Ring"),
      fetched("main", 1, "Arcane Signet"),
      fetched("main", 4, "Island"),
    ],
    od04: [{ flips: "url", rule: "a line without a count means one copy" }],
  }),
  fixtureCase("arena-companion-and-partners.txt", {
    source:
      "MTG Arena headings with printings, as `exportArena` writes them: two commanders under one Commander heading, the companion repeated in the sideboard",
    paste: pasteResult(
      {
        commander: "Thrasios, Triton Hero",
        partner: "Tymna the Weaver",
        companion: "Lurrus of the Dream-Den",
      },
      [
        pasted(1, "Sol Ring"),
        pasted(1, "Arcane Signet"),
        pasted(8, "Island"),
        pasted(1, "Lurrus of the Dream-Den", "sideboard"),
      ]
    ),
    url: [
      fetched("companion", 1, "Lurrus of the Dream-Den"),
      fetched("commander", 1, "Thrasios, Triton Hero"),
      fetched("main", 1, "Tymna the Weaver"),
      fetched("main", 1, "Sol Ring"),
      fetched("main", 1, "Arcane Signet"),
      fetched("main", 8, "Island"),
      fetched("sideboard", 1, "Lurrus of the Dream-Den"),
    ],
    od04: [
      {
        flips: "url",
        rule: "a Commander heading holds up to two command-zone cards",
      },
      {
        open: "AetherHub's commander payload reaches the URL parser under one Commander heading too (url-import.ts importAetherHub), so its second commander lands in the main deck today",
      },
      {
        open: "both parsers keep the sideboard copy of the companion that the Arena export repeats",
      },
    ],
  }),
  fixtureCase("archidekt-categories.txt", {
    source:
      "Archidekt sections with counts and bracket category tags, as `exportArchidekt` writes them, plus a printing and a custom category",
    paste: pasteResult(
      { commander: "Thrasios, Triton Hero", partner: "Tymna the Weaver" },
      [
        pasted(1, "Sol Ring"),
        pasted(1, "Rhystic Study"),
        pasted(1, "Arcane Signet (ELD) 331"),
        pasted(1, "Mystic Remora [Card Advantage]"),
        pasted(2, "Negate", "sideboard"),
        pasted(1, "Ponder", "maybeboard"),
      ]
    ),
    url: [
      fetched("commander", 1, "Thrasios, Triton Hero [Commander{top}]"),
      fetched("partner", 1, "Tymna the Weaver [Commander{top}]"),
      fetched("main", 1, "Sol Ring [Ramp]"),
      fetched("main", 1, "Rhystic Study [Draw]"),
      fetched("main", 1, "Arcane Signet (ELD) 331 [Ramp]"),
      fetched("main", 1, "Mystic Remora [Card Advantage]"),
      fetched("sideboard", 2, "Negate [Other]"),
      fetched("maybeboard", 1, "Ponder [Draw]"),
    ],
    od04: [
      { flips: "url", rule: "Archidekt category tags are stripped" },
      // The paste parser strips only the app's own category names.
      { flips: "both", rule: "Archidekt category tags are stripped" },
      // The paste parser strips the printing before the tag, so a tag after a printing keeps it.
      { flips: "both", rule: "set codes and collector numbers are stripped" },
    ],
  }),
  fixtureCase("moxfield-comment-headings.txt", {
    source:
      "Moxfield-style `//` headings, as `exportMoxfield` writes them, with printings and `*F*` foil markers",
    paste: pasteResult({ commander: "Atraxa, Praetors' Voice" }, [
      pasted(1, "Sol Ring (C21) 263 *F*"),
      pasted(1, "Counterspell"),
      pasted(1, "Lightning Greaves *F*"),
      pasted(2, "Negate", "sideboard"),
      pasted(1, "Teferi's Protection", "maybeboard"),
    ]),
    url: [
      fetched("commander", 1, "Atraxa, Praetors' Voice"),
      fetched("main", 1, "Sol Ring"),
      fetched("main", 1, "Counterspell"),
      fetched("main", 1, "Lightning Greaves"),
      fetched("sideboard", 2, "Negate"),
      fetched("maybeboard", 1, "Teferi's Protection"),
    ],
    od04: [{ flips: "paste", rule: "foil markers are stripped" }],
  }),
  fixtureCase("mtgo-commander-after-blank-line.txt", {
    source:
      "MTGO convention, as `exportGoldfish` writes it: the main deck, a blank line, then the commanders with no heading",
    paste: pasteResult({}, [
      pasted(1, "Sol Ring"),
      pasted(1, "Arcane Signet"),
      pasted(8, "Island"),
      pasted(1, "Thrasios, Triton Hero"),
      pasted(1, "Tymna the Weaver"),
    ]),
    url: [
      fetched("main", 1, "Sol Ring"),
      fetched("main", 1, "Arcane Signet"),
      fetched("main", 8, "Island"),
      fetched("main", 1, "Thrasios, Triton Hero"),
      fetched("main", 1, "Tymna the Weaver"),
    ],
    od04: [
      {
        open: "OD-04 speaks of headings; this convention marks the command zone with a blank line, and both parsers file the commanders in the main deck",
      },
    ],
  }),
  fixtureCase("tappedout-cmdr-marker.txt", {
    source: "TappedOut-style `*CMDR*` marker, as `exportTappedOut` writes it",
    paste: pasteResult({}, [
      pasted(1, "Atraxa, Praetors' Voice *CMDR*"),
      pasted(1, "Sol Ring"),
      pasted(8, "Forest"),
    ]),
    url: [
      fetched("main", 1, "Atraxa, Praetors' Voice *CMDR*"),
      fetched("main", 1, "Sol Ring"),
      fetched("main", 8, "Forest"),
    ],
    od04: [
      {
        open: "OD-04 does not mention the `*CMDR*` marker; both parsers keep it in the name and file the commander in the main deck",
      },
    ],
  }),
  fixtureCase("commander-heading-without-deck-heading.txt", {
    source:
      "a list that opens a Commander heading and never opens a Deck heading",
    paste: pasteResult(
      { commander: "Atraxa, Praetors' Voice", partner: "Sol Ring" },
      [pasted(1, "Arcane Signet"), pasted(1, "Command Tower")]
    ),
    url: [
      fetched("commander", 1, "Atraxa, Praetors' Voice"),
      fetched("main", 1, "Sol Ring"),
      fetched("main", 1, "Arcane Signet"),
      fetched("main", 1, "Command Tower"),
    ],
    od04: [
      {
        flips: "url",
        rule: "a Commander heading holds up to two command-zone cards",
      },
      {
        open: "read literally, OD-04 makes Sol Ring the second commander here, as the paste parser does today; telling a commander from the first main-deck card needs the card catalogue",
      },
    ],
  }),
  fixtureCase("every-section-heading.txt", {
    source: "every heading both parsers know, with colons and in capitals",
    paste: pasteResult(
      {
        commander: "Thrasios, Triton Hero",
        partner: "Tymna the Weaver",
        companion: "Lurrus of the Dream-Den",
      },
      [
        pasted(1, "Sol Ring"),
        pasted(2, "Negate", "sideboard"),
        pasted(1, "Ponder", "maybeboard"),
        pasted(1, "Teferi's Protection", "maybeboard"),
        pasted(1, "Arcane Signet"),
      ]
    ),
    url: [
      fetched("commander", 1, "Thrasios, Triton Hero"),
      fetched("partner", 1, "Tymna the Weaver"),
      fetched("companion", 1, "Lurrus of the Dream-Den"),
      fetched("main", 1, "Sol Ring"),
      fetched("sideboard", 2, "Negate"),
      fetched("maybeboard", 1, "Ponder"),
      fetched("maybeboard", 1, "Teferi's Protection"),
      fetched("main", 1, "Arcane Signet"),
    ],
    od04: [],
  }),
  fixtureCase("comments-and-notes.txt", {
    source:
      "comment headings, inline `//` and `|` comments, and the `// Note:` lines `exportPlainText` writes under a card",
    paste: pasteResult({ commander: "Atraxa, Praetors' Voice" }, [
      pasted(1, "Sol Ring // best turn one"),
      pasted(1, "Arcane Signet | budget pick"),
      pasted(1, "Rhystic Study"),
      pasted(1, "Counterspell // Staple"),
    ]),
    url: [
      fetched("commander", 1, "Atraxa, Praetors' Voice"),
      fetched("main", 1, "Sol Ring"),
      fetched("main", 1, "Arcane Signet"),
      fetched("main", 1, "Rhystic Study"),
      fetched("main", 1, "Counterspell // Staple"),
    ],
    od04: [
      { flips: "paste", rule: "comments are stripped" },
      {
        open: "a one-word comment after a one-word name reads as a split card (`Counterspell // Staple`); both parsers keep it, and only the card catalogue can tell",
      },
    ],
  }),
  fixtureCase("split-double-faced-and-adventure-names.txt", {
    source:
      "split cards, a transforming card, a modal double-faced card and an adventure card, written with ` // `",
    paste: pasteResult({}, [
      pasted(1, "Fire // Ice"),
      pasted(1, "Commit // Memory"),
      pasted(1, "Delver of Secrets // Insectile Aberration"),
      pasted(1, "Bala Ged Recovery // Bala Ged Sanctuary"),
      pasted(1, "Bonecrusher Giant // Stomp"),
    ]),
    url: [
      fetched("main", 1, "Fire // Ice"),
      fetched("main", 1, "Commit // Memory"),
      fetched("main", 1, "Delver of Secrets"),
      fetched("main", 1, "Bala Ged Recovery"),
      fetched("main", 1, "Bonecrusher Giant"),
    ],
    od04: [
      {
        open: "the URL parser keeps both halves only when each is one capitalised word, so it cuts multi-word double-faced and adventure names to the front face; OD-04's comment stripping must say how ` // ` in a card name survives",
      },
    ],
  }),
  fixtureCase("printings.txt", {
    source:
      "set codes and collector numbers: lowercase codes, a letter variant, a star variant, a set code alone and a hyphenated number",
    paste: pasteResult({}, [
      pasted(1, "Sol Ring"),
      pasted(1, "Arcane Signet"),
      pasted(1, "Wastes"),
      pasted(1, "Liliana, Dreadhorde General"),
      pasted(1, "Command Tower"),
      pasted(1, "Exotic Orchard (cmr)"),
      pasted(1, "Lightning Greaves (PLST) M19-235"),
    ]),
    url: [
      fetched("main", 1, "Sol Ring"),
      fetched("main", 1, "Arcane Signet"),
      fetched("main", 1, "Wastes"),
      fetched("main", 1, "Liliana, Dreadhorde General (WAR) 97★"),
      fetched("main", 1, "Command Tower"),
      fetched("main", 1, "Exotic Orchard"),
      fetched("main", 1, "Lightning Greaves (PLST) M19-235"),
    ],
    od04: [
      // `97★`: the URL parser reads only letters after the number.
      { flips: "url", rule: "set codes and collector numbers are stripped" },
      // `(cmr)` alone: the paste parser's set-only pattern is case-sensitive.
      { flips: "paste", rule: "set codes and collector numbers are stripped" },
      // `M19-235`: neither parser reads a hyphen in a collector number.
      { flips: "both", rule: "set codes and collector numbers are stripped" },
    ],
  }),
  fixtureCase("type-group-headings.txt", {
    source:
      "a list grouped by card type with counted group headings, as deck sites print it on screen",
    paste: pasteResult(
      { commander: "Atraxa, Praetors' Voice", partner: "Creatures" },
      [
        pasted(1, "Birds of Paradise"),
        pasted(1, "Llanowar Elves"),
        pasted(1, "Artifacts"),
        pasted(1, "Sol Ring"),
        pasted(1, "Lands"),
        pasted(8, "Forest"),
      ]
    ),
    url: [
      fetched("commander", 1, "Atraxa, Praetors' Voice"),
      fetched("main", 1, "Birds of Paradise"),
      fetched("main", 1, "Llanowar Elves"),
      fetched("main", 1, "Sol Ring"),
      fetched("main", 8, "Forest"),
    ],
    od04: [
      {
        open: "with count-less lines read as one copy, a group heading such as `Creatures (2)` becomes a card; the paste parser even makes the first one the partner. B2-27 must recognise group headings or the URL parser's behaviour here regresses",
      },
    ],
  }),
  {
    fixture: "501 generated lines",
    source: "a pasted list longer than the 500-line cap both parsers share",
    input: Array.from(
      { length: LONG_LIST_LINES },
      (_, index) => `1 Card ${index}`
    ).join("\n"),
    paste: pasteResult(
      {},
      LONG_LIST_KEPT.map((name) => pasted(1, name))
    ),
    url: LONG_LIST_KEPT.map((name) => fetched("main", 1, name)),
    od04: [],
  },
];

// ---------------------------------------------------------------------------
// Side-by-side projection
// ---------------------------------------------------------------------------

/**
 * Each card as "<slot> <quantity> <name>", sorted. The paste parser keeps no
 * quantity for the command zone, so its command-zone cards count as one, and
 * its `errors` are left out because the URL parser has no error channel.
 */
function pasteSlots(result: ImportResult): readonly string[] {
  const commandZone = [
    ["commander", result.commander],
    ["partner", result.partner],
    ["companion", result.companion],
  ] as const;
  const command = commandZone.flatMap(([slot, name]) =>
    name === null ? [] : [`${slot} 1 ${name}`]
  );
  const rest = result.cards.map(
    (card) => `${card.zone ?? "main"} ${card.quantity} ${card.name}`
  );
  return [...command, ...rest].toSorted();
}

function urlSlot(card: UrlImportCard): Slot {
  if (card.isCommander) return "commander";
  if (card.isPartner) return "partner";
  if (card.isCompanion === true) return "companion";
  return card.zone;
}

function urlSlots(cards: readonly UrlImportCard[]): readonly string[] {
  return cards
    .map((card) => `${urlSlot(card)} ${card.quantity} ${card.name}`)
    .toSorted();
}

/** Whether both parsers file the same cards, in the same quantities, in the same slots. */
function parsersAgree(input: string): boolean {
  const paste = pasteSlots(parseTextDecklist(input));
  const url = urlSlots(parsePlainTextDecklist(input));
  return paste.join("\n") === url.join("\n");
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("decklist parser divergence corpus", () => {
  it.each(CORPUS)(
    "$fixture: the paste parser's output is pinned as it is today (see B2-27)",
    ({ input, paste }) => {
      expect(parseTextDecklist(input)).toStrictEqual(paste);
    }
  );

  it.each(CORPUS)(
    "$fixture: the URL parser's output is pinned as it is today (see B2-27)",
    ({ input, url }) => {
      expect(parsePlainTextDecklist(input)).toStrictEqual(url);
    }
  );

  it("currently files different cards in different slots for 9 of the 13 inputs (pinned; OD-04 and B2-27 settle it)", () => {
    const divergent = CORPUS.filter(({ input }) => !parsersAgree(input)).map(
      ({ fixture }) => fixture
    );

    expect(divergent).toEqual([
      "plain-quantities.txt",
      "arena-companion-and-partners.txt",
      "archidekt-categories.txt",
      "moxfield-comment-headings.txt",
      "commander-heading-without-deck-heading.txt",
      "comments-and-notes.txt",
      "split-double-faced-and-adventure-names.txt",
      "printings.txt",
      "type-group-headings.txt",
    ]);
  });

  it("gives every input where the parsers disagree an OD-04 note", () => {
    const unexplained = CORPUS.filter(
      ({ input, od04 }) => od04.length === 0 && !parsersAgree(input)
    ).map(({ fixture }) => fixture);

    expect(unexplained).toEqual([]);
  });
});
