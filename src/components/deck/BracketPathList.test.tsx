/**
 * The "To reach Bracket N" list while the deck's combo lookup is pending,
 * once it answers, and once it fails (I-77 4.3, issue #1840).
 *
 * Sociable: the real `useCombos` query, the real combo API client and the
 * real assessment run; only `fetch` is replaced. `POST /api/combos` answers
 * with `combosAnswer`, which a test may leave unsettled to hold the lookup
 * pending.
 */
import { screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DeckCard } from "@/lib/deck/types";
import { aDeck } from "@/test/builders/deck";
import { aDeckCard } from "@/test/builders/card";
import { renderWithProviders } from "@/test/render";
import { BracketPathList } from "./BracketPathList";

/** A two-card infinite combo as `POST /api/combos` sends it. */
const SCEPTER_REVERSAL = {
  id: "1234-5678",
  cards: ["Dramatic Reversal", "Isochron Scepter"],
  effects: ["Infinite mana"],
  description: "Imprint Dramatic Reversal on Isochron Scepter.",
  isInfinite: true,
  prerequisites: { otherPieces: [], conditions: [], manaNeeded: "{2}" },
  startZones: {},
  standaloneResults: [],
  manaValueNeeded: 2,
  bracketTag: null,
};

/** Ten named rows: enough for the lookup to run, with both combo pieces. */
const TEN_CARDS: readonly DeckCard[] = [
  "Dramatic Reversal",
  "Isochron Scepter",
  ...Array.from({ length: 8 }, (_, index) => `Bear ${index}`),
].map((name) => aDeckCard({ id: name, name, cmc: 2 }));

/** The answer of the next combo lookup; a never-settling promise holds it pending. */
let combosAnswer: () => Promise<Response>;

function renderList(): HTMLElement {
  renderWithProviders(
    <BracketPathList
      deck={aDeck({ targetBracket: 2, cards: [...TEN_CARDS] })}
    />
  );
  return screen.getByRole("region", { name: "To reach Bracket 2" });
}

/** The lines of the list, in order. */
function pathLines(list: HTMLElement): readonly (string | null)[] {
  return within(list)
    .getAllByRole("listitem")
    .map((item) => item.textContent);
}

const PENDING_LINE =
  "Two-card combos: still being checked. The estimate does not count them yet.";
const FAILED_LINE =
  "Two-card combos: not checked. The estimate was made without combo data.";

beforeEach(() => {
  combosAnswer = () => new Promise<Response>(() => undefined);
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input), "http://localhost");
      if (url.pathname === "/api/combos") return combosAnswer();
      return Response.json({}, { status: 404 });
    })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("BracketPathList", () => {
  it("says combos are still being checked while the lookup has not answered, and claims no combo count", () => {
    const list = renderList();

    expect(pathLines(list)).toContain(PENDING_LINE);
    expect(pathLines(list)).not.toContain(FAILED_LINE);
    expect(
      within(list).queryByText(/two-card combos\. This list has/)
    ).toBeNull();
  });

  it("lists the combo the lookup found once it answers", async () => {
    combosAnswer = async () => Response.json({ combos: [SCEPTER_REVERSAL] });
    const list = renderList();

    expect(
      await within(list).findByText(
        "Bracket 2 allows no two-card combos. This list has 1 combo, with Dramatic Reversal and Isochron Scepter."
      )
    ).toBeInTheDocument();
    expect(pathLines(list)).not.toContain(PENDING_LINE);
  });

  it("says combos were not checked once the lookup fails", async () => {
    combosAnswer = async () => Response.json({}, { status: 503 });
    const list = renderList();

    expect(await within(list).findByText(FAILED_LINE)).toBeInTheDocument();
    await waitFor(() => expect(pathLines(list)).not.toContain(PENDING_LINE));
  });
});
