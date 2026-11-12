/**
 * Bulk Edit when the card lookup cannot answer.
 *
 * Scryfall and the deck API are replaced at the HTTP boundary by MSW (ADR 0005, rule 4); the
 * modal, the deck store, the lookup helper and the Scryfall client are the real ones, so the line
 * the alert shows is the one a player would read. Every PATCH the deck API receives is recorded,
 * so a save that should not happen shows up.
 *
 * Seen in the pre-push E2E gate on 2026-11-12: Scryfall stalled, the client's 10 s budget fired,
 * and the alert read the browser's own "signal timed out".
 */
import { fireEvent, screen } from "@testing-library/react";
import { delay, http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import type { ApiDeck, ApiDeckCard } from "@/lib/db/deck-api";
import { __resetRateLimiter } from "@/lib/scryfall/client";
import { SCRYFALL_API } from "@/lib/scryfall/constants";
import { useDeckStore } from "@/lib/deck/store";
import { apiDeckToStoreDeck } from "@/lib/deck/store-factories";
import type { Deck } from "@/lib/deck/types";
import { aScryfallCard } from "@/test/builders/scryfall";
import { setupMsw } from "@/test/msw";
import { renderWithProviders } from "@/test/render";
import { BulkEditModal } from "./BulkEditModal";

const COLLECTION_URL = `${SCRYFALL_API}/cards/collection`;
const CARDS_URL = "/api/decks/deck-1/cards";
const NEW_LINE = "1 Swiftfoot Boots";
/** What the player reads when Scryfall could not be asked (`deck.bulkEdit.lookupFailed`). */
const LOOKUP_FAILED = /the card lookup did not answer/i;

const CollectionBody = z.object({
  identifiers: z.array(z.object({ name: z.string() })),
});

/** A stored row of the seeded deck. */
function row(
  overrides: Partial<ApiDeckCard> & Pick<ApiDeckCard, "id" | "name">
): ApiDeckCard {
  return {
    deckId: "deck-1",
    scryfallId: `${overrides.id}-printing`,
    manaCost: "",
    cmc: 0,
    typeLine: "Artifact",
    oracleText: "",
    colorIdentity: [],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
    category: "other",
    quantity: 1,
    notes: null,
    isCommander: false,
    isPartner: false,
    zone: "main",
    ...overrides,
  };
}

/** The deck as the API serves it: a commander and one main-deck card. */
function serverDeck(): ApiDeck {
  return {
    id: "deck-1",
    name: "Atraxa Superfriends",
    format: "commander",
    targetBracket: 3,
    manualBracket: null,
    budget: null,
    description: "",
    tags: [],
    shareToken: null,
    shareEnabled: false,
    isPublic: false,
    isAIGenerated: false,
    createdAt: "2026-11-01T00:00:00.000Z",
    updatedAt: "2026-11-01T00:00:00.000Z",
    commanderId: "atraxa-row-printing",
    commanderName: "Atraxa, Praetors' Voice",
    partnerId: null,
    companionId: null,
    pairingType: "none",
    companion: null,
    maybeboard: [],
    cards: [
      row({
        id: "atraxa-row",
        name: "Atraxa, Praetors' Voice",
        typeLine: "Legendary Creature — Phyrexian Angel Horror",
        category: "commander",
        isCommander: true,
      }),
      row({ id: "sol-ring-row", name: "Sol Ring", category: "ramp" }),
    ],
  };
}

/** Scryfall's answer to a collection lookup: one default printing per name asked. */
function collectionAnswer(names: readonly string[]) {
  return {
    object: "list",
    not_found: [],
    data: names.map((name) =>
      aScryfallCard({
        id: "00000000-0000-4000-8000-000000000042",
        name,
        type_line: "Artifact — Equipment",
        legalities: { commander: "legal" },
      })
    ),
  };
}

/** The bodies of the PATCH requests the deck API received during the current test. */
let patches: string[] = [];

const server = setupMsw(
  http.post(COLLECTION_URL, async ({ request }) => {
    const { identifiers } = CollectionBody.parse(await request.json());
    return HttpResponse.json(
      collectionAnswer(identifiers.map((identifier) => identifier.name))
    );
  }),
  http.patch(CARDS_URL, async ({ request }) => {
    patches.push(await request.text());
    return HttpResponse.json(serverDeck());
  })
);

/**
 * Scryfall taking the collection request and never answering it. The client's next
 * `AbortSignal.timeout` is replaced by a signal this handler fires once the request has arrived,
 * with the reason a browser gives (Chromium's "signal timed out"), so the test neither waits the
 * 10 s budget nor races a short timer.
 */
function scryfallTimesOut() {
  const clientTimeout = new AbortController();
  vi.spyOn(AbortSignal, "timeout").mockReturnValueOnce(clientTimeout.signal);
  return http.post(
    COLLECTION_URL,
    async () => {
      clientTimeout.abort(new DOMException("signal timed out", "TimeoutError"));
      await delay("infinite");
    },
    { once: true }
  );
}

function openStoreDeck(): Deck {
  const deck = apiDeckToStoreDeck(serverDeck());
  useDeckStore.setState({
    decks: { "deck-1": deck },
    activeDeckId: "deck-1",
    undoStack: [],
  });
  return deck;
}

/** Opens the modal and appends one new line to the pre-filled list. */
function openAndAddLine(): {
  readonly textarea: HTMLTextAreaElement;
  readonly edited: string;
} {
  renderWithProviders(
    <BulkEditModal deck={openStoreDeck()}>
      <button type="button">Open bulk edit</button>
    </BulkEditModal>
  );
  fireEvent.click(screen.getByRole("button", { name: "Open bulk edit" }));
  const textarea = screen.getByRole<HTMLTextAreaElement>("textbox");
  const edited = `${textarea.value}\n${NEW_LINE}`;
  fireEvent.change(textarea, { target: { value: edited } });
  return { textarea, edited };
}

function save(): void {
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
}

/** The alert says the lookup failed in the player's words, nothing of the exception. */
async function expectLookupFailedAlert(rawText: string | RegExp) {
  const alert = await screen.findByRole("alert");
  expect(alert).toHaveTextContent(LOOKUP_FAILED);
  expect(alert).not.toHaveTextContent(rawText);
  return alert;
}

/** The modal is still open with the edited list, ready for another Save. */
function expectListKept(textarea: HTMLTextAreaElement, edited: string) {
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(textarea).toHaveValue(edited);
  expect(textarea).toBeEnabled();
  expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  expect(patches).toEqual([]);
}

describe("BulkEditModal — when the card lookup cannot answer", () => {
  beforeEach(() => {
    patches = [];
  });

  afterEach(() => {
    vi.restoreAllMocks();
    __resetRateLimiter();
  });

  it("saves the new line when Scryfall answers", async () => {
    openAndAddLine();

    save();

    expect(
      await screen.findByText(/Saved \d+ cards successfully/)
    ).toBeInTheDocument();
    expect(patches).toHaveLength(1);
    expect(patches[0]).toContain("Swiftfoot Boots");
  });

  it("says the lookup did not answer when Scryfall times out, keeps the list and saves nothing", async () => {
    server.use(scryfallTimesOut());
    const { textarea, edited } = openAndAddLine();

    save();

    await expectLookupFailedAlert("signal timed out");
    expectListKept(textarea, edited);
  });

  it("says the lookup did not answer when the network fails, keeps the list and saves nothing", async () => {
    server.use(http.post(COLLECTION_URL, () => HttpResponse.error()));
    const { textarea, edited } = openAndAddLine();

    save();

    await expectLookupFailedAlert(/failed to fetch|fetch failed/i);
    expectListKept(textarea, edited);
  });

  it("says the lookup did not answer when Scryfall answers an error status, keeps the list and saves nothing", async () => {
    server.use(
      http.post(COLLECTION_URL, () =>
        HttpResponse.json(
          {
            object: "error",
            code: "service_unavailable",
            status: 503,
            details: "Scryfall is down for maintenance.",
          },
          { status: 503 }
        )
      )
    );
    const { textarea, edited } = openAndAddLine();

    save();

    await expectLookupFailedAlert(/Scryfall API error|maintenance/);
    expectListKept(textarea, edited);
  });

  it("still names a line Scryfall does not know, as before", async () => {
    server.use(
      http.post(COLLECTION_URL, () =>
        HttpResponse.json({
          object: "list",
          not_found: [{ name: "Swiftfoot Boots" }],
          data: [],
        })
      )
    );
    const { textarea, edited } = openAndAddLine();

    save();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Swiftfoot Boots");
    expect(alert).not.toHaveTextContent(LOOKUP_FAILED);
    expectListKept(textarea, edited);
  });
});
