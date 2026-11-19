// @vitest-environment node
/**
 * Replays recorded and built source payloads through `importFromUrl` for the three import
 * sources whose adapters `url-import.test.ts` covers least: AetherHub, the EDHREC average deck
 * (its 99-card cap and de-duplication) and MTGTop8 (its MTGO export). MSW stands in for the
 * network (ADR 0005, rule 4), with no handler by default, so a request a test does not serve
 * fails that test: the AetherHub cases prove the adapter never calls out.
 *
 * Characterization for the deck-interchange series: DI-04..DI-06 move each adapter behind a
 * `DeckSourceAdapter`, and these tests drive the public entry point only, so the moves change
 * nothing here. Tests named "currently …" pin today's behaviour where it is wrong; the follow-up
 * each one names will flip it. The payloads and how they were captured are documented in
 * `fixtures/aetherhub-builder-urls-v1.ts`, `fixtures/edhrec-average-deck-v1.ts` and
 * `fixtures/mtgtop8-mtgo-export-v1.ts`.
 *
 * The node environment matches where the adapters run: `POST /api/import/url` calls them on the
 * server.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { http, HttpResponse, type JsonBodyType } from "msw";
import { USER_AGENT } from "@/lib/http";
import { setupMsw } from "@/test/msw";
import {
  AETHERHUB_COMMANDER_DECK_URL,
  AETHERHUB_COMMANDER_ONLY_URL,
  AETHERHUB_CONSTRUCTED_DECK_URL,
  AETHERHUB_EMPTY_URL,
  AETHERHUB_PARTNER_PAIR_URL,
} from "./fixtures/aetherhub-builder-urls-v1";
import {
  EDHREC_AVERAGE_DECK_RECORDED,
  EDHREC_IMPORT_RECORDED_SLUG,
  EDHREC_IMPORT_RECORDED_URL,
} from "./fixtures/edhrec-average-deck-v1";
import {
  MTGTOP8_EXPORT_RECORDED,
  MTGTOP8_EXPORT_RECORDED_URL,
  MTGTOP8_RECORDED_DECK_ID,
  MTGTOP8_RECORDED_EVENT_ID,
} from "./fixtures/mtgtop8-mtgo-export-v1";
import { importFromUrl, type UrlImportCard } from "./url-import";

const server = setupMsw();

/** Every request a source received during the current test, in order. */
let received: Request[] = [];

beforeEach(() => {
  received = [];
});

/** A main-deck card as every adapter here builds it: one zone, no command-zone role. */
function mainCard(name: string, quantity = 1): UrlImportCard {
  return { name, quantity, isCommander: false, isPartner: false, zone: "main" };
}

/** A commander as the adapters build it. */
function commanderCard(name: string): UrlImportCard {
  return {
    name,
    quantity: 1,
    isCommander: true,
    isPartner: false,
    zone: "main",
  };
}

describe("AetherHub builder URLs", () => {
  it("imports the main deck, then the commander, without sending a request", async () => {
    await expect(importFromUrl(AETHERHUB_COMMANDER_DECK_URL)).resolves.toEqual({
      name: "AetherHub deck",
      source: "aetherhub",
      cards: [
        mainCard("Sol Ring"),
        mainCard("Arcane Signet"),
        mainCard("Command Tower"),
        commanderCard("Atraxa, Praetors' Voice"),
      ],
      ignored: [],
    });
  });

  it("imports a command zone with an empty main deck", async () => {
    const imported = await importFromUrl(AETHERHUB_COMMANDER_ONLY_URL);

    expect(imported.cards).toEqual([commanderCard("Atraxa, Praetors' Voice")]);
  });

  it("currently imports the second half of a partner pair as a main-deck card (pinned; see follow-up DI-01-F3)", async () => {
    const imported = await importFromUrl(AETHERHUB_PARTNER_PAIR_URL);

    // CR 702.124a: partner lets a deck have two commanders. The adapter files `sb` under one
    // "Commander" heading, and the plain-text parser leaves that section after its first card.
    expect(imported.cards).toEqual([
      mainCard("Sol Ring"),
      commanderCard("Thrasios, Triton Hero"),
      mainCard("Tymna the Weaver"),
    ]);
  });

  it("keeps a constructed deck's sideboard and warns that it is not a Commander deck", async () => {
    const imported = await importFromUrl(AETHERHUB_CONSTRUCTED_DECK_URL);

    expect(imported.cards).toEqual([
      mainCard("Lightning Bolt", 4),
      mainCard("Mountain", 20),
      { ...mainCard("Negate", 2), zone: "sideboard" },
    ]);
    expect(imported.formatWarning).toBe(
      "This AetherHub deck is not marked as Commander."
    );
  });

  it("refuses a URL that carries no card", async () => {
    await expect(importFromUrl(AETHERHUB_EMPTY_URL)).rejects.toThrow(
      "AetherHub URL does not contain any cards"
    );
  });
});

describe("EDHREC average deck", () => {
  const importUrl = `https://edhrec.com/commanders/${EDHREC_IMPORT_RECORDED_SLUG}`;

  /** EDHREC's JSON page for the recorded commander answering with `body`. */
  function edhrecServes(body: JsonBodyType, status = 200) {
    return http.get(EDHREC_IMPORT_RECORDED_URL, ({ request }) => {
      received.push(request.clone());
      return HttpResponse.json(body, { status });
    });
  }

  /** The recorded page with one more list appended after EDHREC's own. */
  function recordedPageWithExtraList(names: readonly string[]): JsonBodyType {
    const { json_dict } = EDHREC_AVERAGE_DECK_RECORDED.container;
    const extra = {
      tag: "extra",
      header: "Extra",
      cardviews: names.map((name) => ({ name })),
    };
    return {
      container: {
        json_dict: { ...json_dict, cardlists: [...json_dict.cardlists, extra] },
      },
    };
  }

  it("requests the commander's JSON page with the app's User-Agent", async () => {
    server.use(edhrecServes(EDHREC_AVERAGE_DECK_RECORDED));

    await importFromUrl(importUrl);

    expect(received.map((request) => request.url)).toEqual([
      EDHREC_IMPORT_RECORDED_URL,
    ]);
    expect(received[0]?.headers.get("user-agent")).toBe(USER_AGENT);
  });

  it("imports the recorded page: the commander, then every view once, in EDHREC's list order", async () => {
    server.use(edhrecServes(EDHREC_AVERAGE_DECK_RECORDED));

    const imported = await importFromUrl(importUrl);

    expect(imported).toMatchObject({
      name: "EDHRec average deck — Wilhelt, the Rotcleaver",
      source: "edhrec",
      ignored: [],
      formatWarning:
        "This is an EDHRec average deck, not a specific player's deck.",
    });
    expect(imported.cards[0]).toEqual(commanderCard("Wilhelt, the Rotcleaver"));
    // The Lands list repeats four spell-lands already imported from Instants and Sorceries.
    expect(imported.cards.slice(1)).toEqual(
      [
        ...["Turbulent Wetlands", "Avacyn, Angel of Horror", "Lich's Relic"],
        ...["Diregraf Captain", "Rooftop Storm", "Gravecrawler"],
        ...["Poppet Stitcher", "Prowling Geistcatcher", "Putrid Goblin"],
        ...["Cemetery Reaper", "Carrion Feeder", "Midnight Reaper"],
        ...["Counterspell", "Dark Ritual", "Go for the Throat"],
        ...["Malakir Rebirth", "Fell the Profane", "Sink into Stupor"],
        ...[
          "Zombie Apocalypse",
          "Feed the Swarm",
          "Victimize",
          "Agadeem's Awakening",
        ],
        ...["Ashnod's Altar", "Phyrexian Altar", "Skullclamp"],
        ...[
          "Endless Ranks of the Dead",
          "Dreadhorde Invasion",
          "Open the Graves",
        ],
        ...[
          "Liliana, Death's Majesty",
          "Liliana, Dreadhorde General",
          "Liliana, Untouched by Death",
        ],
        ...["Bojuka Bog", "Unholy Grotto", "Mortuary Mire"],
        ...["Sol Ring", "Arcane Signet", "Talisman of Dominance"],
        ...["Swamp", "Island", "Command Tower"],
      ].map((name) => mainCard(name))
    );
  });

  it("keeps the first 99 unique cards after the commander; a repeated view takes no place", async () => {
    // The recorded page imports 40 unique cards from 44 views. If its four repeats counted,
    // the cap would stop at "Extra card 55".
    const extras = Array.from(
      { length: 70 },
      (_, index) => `Extra card ${index + 1}`
    );
    server.use(edhrecServes(recordedPageWithExtraList(extras)));

    const imported = await importFromUrl(importUrl);

    expect(imported.cards).toHaveLength(100);
    expect(imported.cards.at(-1)).toEqual(mainCard("Extra card 59"));
  });

  it("skips the commander's own name, an empty name, and a name that differs only in case, spacing or apostrophe", async () => {
    server.use(
      edhrecServes({
        container: {
          json_dict: {
            card: { name: "Wilhelt, the Rotcleaver" },
            cardlists: [
              {
                tag: "a",
                cardviews: [{ name: "Lich's Relic" }, { name: "Sol Ring" }],
              },
              {
                tag: "b",
                cardviews: [
                  { name: "wilhelt, the rotcleaver" },
                  { name: "" },
                  { name: "Lich’s Relic" },
                  { name: " Sol  Ring " },
                ],
              },
            ],
          },
        },
      })
    );

    const imported = await importFromUrl(importUrl);

    expect(imported.cards.map(({ name }) => name)).toEqual([
      "Wilhelt, the Rotcleaver",
      "Lich's Relic",
      "Sol Ring",
    ]);
  });

  it("currently imports a page without a commander card as a deck with no commander, named after the slug (pinned)", async () => {
    server.use(
      edhrecServes({
        container: {
          json_dict: {
            cardlists: [{ tag: "a", cardviews: [{ name: "Sol Ring" }] }],
          },
        },
      })
    );

    const imported = await importFromUrl(importUrl);

    expect(imported.name).toBe(
      `EDHRec average deck — ${EDHREC_IMPORT_RECORDED_SLUG}`
    );
    expect(imported.cards).toEqual([mainCard("Sol Ring")]);
  });

  it("fails with the not-found message when EDHREC has no page for the commander", async () => {
    server.use(edhrecServes({ error: "not found" }, 404));

    await expect(importFromUrl(importUrl)).rejects.toMatchObject({
      status: 404,
      message: "Deck not found or is private.",
    });
  });
});

describe("MTGTop8 MTGO export", () => {
  const importUrl = `https://www.mtgtop8.com/event?e=${MTGTOP8_RECORDED_EVENT_ID}&d=${MTGTOP8_RECORDED_DECK_ID}&f=EDH`;

  /**
   * The export (MSW matches `/mtgo` whatever its query) answering with `body` and `status`, as
   * MTGTop8 sends it. No handler serves the deck page, so a test that reaches it fails.
   */
  function exportAnswers(body: string, status = 200) {
    return http.get("https://www.mtgtop8.com/mtgo", ({ request }) => {
      received.push(request.clone());
      return HttpResponse.text(body, {
        status,
        headers: { "Content-Type": "text/plain;charset=ISO-8859-1" },
      });
    });
  }

  it("imports the recorded MTGO export: the main deck, then the sideboard, from one request with the app's User-Agent", async () => {
    server.use(exportAnswers(MTGTOP8_EXPORT_RECORDED));

    const imported = await importFromUrl(importUrl);

    expect(received.map((request) => request.url)).toEqual([
      MTGTOP8_EXPORT_RECORDED_URL,
    ]);
    expect(received[0]?.headers.get("user-agent")).toBe(USER_AGENT);
    expect(imported.name).toBe(`MTGTop8 deck #${MTGTOP8_RECORDED_DECK_ID}`);
    const main = imported.cards.filter((card) => card.zone === "main");
    expect(main).toHaveLength(88);
    expect(main.reduce((total, card) => total + card.quantity, 0)).toBe(99);
    expect(main.slice(0, 2)).toEqual([
      mainCard("Allosaurus Shepherd"),
      mainCard("Arbor Elf"),
    ]);
    expect(main).toContainEqual(mainCard("Snow-Covered Forest", 12));
    expect(imported.cards.at(-1)).toEqual({
      ...mainCard("Surrak, Elusive Hunter"),
      zone: "sideboard",
    });
  });

  it("fails with the not-found message when MTGTop8 answers 404 for the deck", async () => {
    server.use(exportAnswers("", 404));

    await expect(importFromUrl(importUrl)).rejects.toMatchObject({
      status: 404,
      message: "Deck not found or is private.",
    });
    expect(received.map((request) => request.url)).toEqual([
      MTGTOP8_EXPORT_RECORDED_URL,
    ]);
  });

  it("fails with the not-found message when the export lists no card, and never loads the deck page", async () => {
    server.use(exportAnswers("\r\n"));

    await expect(importFromUrl(importUrl)).rejects.toMatchObject({
      status: 404,
      message: "Deck not found or is private.",
    });
    expect(received.map((request) => request.url)).toEqual([
      MTGTOP8_EXPORT_RECORDED_URL,
    ]);
  });
});
