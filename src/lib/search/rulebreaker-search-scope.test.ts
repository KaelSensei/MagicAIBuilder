/**
 * The described (natural-language) search's colour-identity scope under a
 * rulebreaker commander (CR 903.5e): the deck clause must not hide a card the
 * commander admits whatever its identity.
 *
 * Sociable at `applySearchContext`: the context builder, the clause and the
 * rulebreaker table are real. The last block runs the written query through
 * the real Scryfall client; MSW serves Scryfall's recorded answers.
 */
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { searchCards } from "@/lib/scryfall/client";
import { setupMsw } from "@/test/msw";
import {
  PLAIN_SELUMA_QUERY,
  RECORDED_PLAIN_NOT_FOUND,
  RECORDED_WIDENED_PAGE,
  WIDENED_SELUMA_QUERY,
} from "./fixtures/rulebreaker-search-v1";
import {
  applySearchContext,
  buildNaturalLanguageSearchContext,
  queryWidensDeckContext,
} from "./natural-language-query";

/** The described search's context for a Commander deck led by `commandZoneNames`. */
function commanderContext(
  colors: readonly string[],
  commandZoneNames: readonly string[]
) {
  return buildNaturalLanguageSearchContext({
    format: "commander",
    commanderColorIdentity: colors,
    partnerColorIdentity: [],
    hasCommander: true,
    commandZoneNames,
  });
}

describe("the described search under a rulebreaker commander (CR 903.5e)", () => {
  it("widens Seluma's white-black scope to Angels and basic lands of any identity", () => {
    const seluma = commanderContext(["W", "B"], ["Seluma, Light of Aysen"]);

    expect(applySearchContext("t:angel c:g", seluma)).toBe(
      "t:angel c:g (id<=WB OR t:angel OR t:basic) legal:commander"
    );
  });

  it.each([
    ["Grizzlegom, Hurloon Hero", ["R", "G"], "(id<=RG OR t:land)"],
    [
      "Maular, the Next Evolution",
      ["G"],
      "(id<=G OR (t:creature mv>=7) OR t:basic)",
    ],
    [
      "The Everforger",
      ["R"],
      "(id<=R OR (t:artifact t:creature) OR t:equipment OR t:basic)",
    ],
    ["The Unluckiest Planeswalker", ["B"], "(id<=B OR t:aura OR t:basic)"],
    ["Valko Indorian", ["W"], "(id<=W OR t:phyrexian OR t:basic)"],
  ])("widens the scope as %s's Oracle text says", (name, colors, clause) => {
    expect(
      applySearchContext("t:creature", commanderContext(colors, [name]))
    ).toBe(`t:creature ${clause} legal:commander`);
  });

  it("widens Tolabow's scope to basic lands only: the deck stores no chosen colour (pinned; follow-up)", () => {
    const tolabow = commanderContext(["U"], ["Tolabow, Loch Rascal"]);

    expect(applySearchContext("t:instant", tolabow)).toBe(
      "t:instant (id<=U OR t:basic) legal:commander"
    );
  });

  it("keeps Whtz's scope at its colours: lifting the maximum size admits no colour", () => {
    const whtz = commanderContext(["W", "U"], ["Whtz, the Bibliophile"]);

    expect(applySearchContext("t:creature", whtz)).toBe(
      "t:creature id<=WU legal:commander"
    );
  });

  it("keeps a colourless commander that is no rulebreaker at a colourless scope", () => {
    const karn = commanderContext([], ["Karn, Silver Golem"]);

    expect(applySearchContext("t:artifact", karn)).toBe(
      "t:artifact id<=c legal:commander"
    );
  });

  it("does not widen for a commander that is no rulebreaker, nor for a name that is not exact", () => {
    expect(
      applySearchContext(
        "t:angel",
        commanderContext(["U"], ["Talrand, Sky Summoner"])
      )
    ).toBe("t:angel id<=U legal:commander");
    expect(
      applySearchContext(
        "t:angel",
        commanderContext(["W", "B"], ["seluma, light of aysen"])
      )
    ).toBe("t:angel id<=WB legal:commander");
  });

  it("leaves the scope off when the player turns deck context off", () => {
    const seluma = commanderContext(["W", "B"], ["Seluma, Light of Aysen"]);

    expect(
      applySearchContext("t:angel", { ...seluma, applyContext: false })
    ).toBe("t:angel");
  });

  it("does not warn that the widened query it wrote leaves the deck", () => {
    const seluma = commanderContext(["W", "B"], ["Seluma, Light of Aysen"]);
    const written = applySearchContext("t:angel c:g", seluma);

    expect(queryWidensDeckContext(written, seluma)).toBe(false);
  });
});

describe("Scryfall's answer to the widened scope (recorded 2026-11-16)", () => {
  setupMsw(
    // The shared cache misses, so `searchCards` asks Scryfall.
    http.get("*/api/cache/search", () => HttpResponse.json({ hit: false })),
    http.get("https://api.scryfall.com/cards/search", ({ request }) => {
      const query = new URL(request.url).searchParams.get("q");
      if (query === WIDENED_SELUMA_QUERY)
        return HttpResponse.json(RECORDED_WIDENED_PAGE);
      if (query === PLAIN_SELUMA_QUERY) {
        return HttpResponse.json(RECORDED_PLAIN_NOT_FOUND, { status: 404 });
      }
      return undefined;
    })
  );

  it("finds a green Angel under Seluma that the bare white-black scope hid", async () => {
    const seluma = commanderContext(["W", "B"], ["Seluma, Light of Aysen"]);
    const plain = commanderContext(["W", "B"], ["Talrand, Sky Summoner"]);

    const widened = await searchCards(
      applySearchContext("t:angel c:g", seluma)
    );
    const bare = await searchCards(applySearchContext("t:angel c:g", plain));

    expect(widened.data.map((card) => card.name)).toContain(
      "Sigarda, Host of Herons"
    );
    expect(bare.data).toEqual([]);
  });
});
