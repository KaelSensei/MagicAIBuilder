/**
 * Characterization of the AI deck wizard from the player's side (P1-19).
 *
 * Deck building context. The wizard (`DeckWizard.tsx`) asks six questions, sends them to
 * `POST /api/ai/build`, reads the NDJSON stream, then saves the deck itself through the real deck
 * store: it creates an empty deck, resolves the commander on Scryfall, looks the cards up on
 * Scryfall in batches and adds them one request at a time. No module is mocked: the store, the
 * build hook and the Scryfall client run for real, and MSW answers every request at the network
 * boundary. Scryfall's answers are recorded (`@/lib/scryfall/fixtures/deck-wizard-v1`); the
 * app's own routes answer with the fields of their real responses that the client reads.
 *
 * These tests pin what the wizard does today, including what B2-33 and B2-34 will change:
 * the bracket and budget the player picked never reach the deck, the deck is saved with one
 * request per card instead of the atomic `POST /api/decks` with `cards`, and the hand-built
 * deck card loses a double-faced card's faces. Tests that pin such behaviour say "currently"
 * and name the row that will flip them. The split of this file (DB-44, DB-46) must keep them
 * green unchanged.
 */
import type { ReactElement } from "react";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionGlobalConfig } from "framer-motion";
import { delay, http, HttpResponse } from "msw";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { z } from "zod";
import type { BuildEvent, DeckCorrection } from "@/app/api/ai/build/types";
import { aiCallDenialBody } from "@/lib/ai/usage/denial";
import { makeDeckCard } from "@/lib/deck/store-card-faces";
import { useDeckStore } from "@/lib/deck/store";
import type { DeckCard } from "@/lib/deck/types";
import { logger } from "@/lib/logger";
import {
  NAMED_NOT_FOUND_RECORDED,
  TALR_AUTOCOMPLETE_RECORDED,
  TALRAND_NAMED_RECORDED,
  WIZARD_COLLECTION_RECORDED,
  WIZARD_COLLECTION_RECORDED_REQUEST,
} from "@/lib/scryfall/fixtures/deck-wizard-v1";
import type {
  ScryfallCard,
  ScryfallCollectionResponse,
} from "@/lib/scryfall/types";
import { setupMsw } from "@/test/msw";
import { renderWithIntl } from "@/test/render-with-intl";
import { DeckWizard } from "./DeckWizard";

const SCRYFALL = "https://api.scryfall.com";
const BUILD_URL = "/api/ai/build";
/** The id the deck API gives the deck the wizard creates. */
const DECK_ID = "deck-ai-1";
const TALRAND = TALRAND_NAMED_RECORDED.name;

type CardEvent = Extract<BuildEvent, { type: "card" }>;

/**
 * The cards a mono-blue Control build streams once the route's card-data check passed, in the
 * shape of `streamDeck` (`src/app/api/ai/build/route.ts`). Names are front-face names, as
 * `scryfallCollectionLookupName` sends them. "counter" is not a deck category.
 */
const STREAMED_CARDS: readonly CardEvent[] = [
  { type: "card", name: "Sol Ring", category: "ramp", quantity: 1 },
  { type: "card", name: "Island", category: "land", quantity: 30 },
  { type: "card", name: "Solemn Simulacrum", category: "ramp", quantity: 1 },
  { type: "card", name: "Sea Gate Restoration", category: "draw", quantity: 1 },
  { type: "card", name: "Counterspell", category: "counter", quantity: 1 },
];

interface StreamShape {
  readonly commander?: string;
  readonly cards?: readonly CardEvent[];
  readonly source?: "ai" | "demo";
  readonly corrections?: readonly DeckCorrection[];
}

/** The events of one build, from the first status line to "done". */
function buildEvents({
  commander = TALRAND,
  cards = STREAMED_CARDS,
  source = "ai",
  corrections = [],
}: StreamShape = {}): readonly BuildEvent[] {
  const totalCards = cards.reduce((sum, card) => sum + card.quantity, 0);
  return [
    { type: "status", message: "Thinking…" },
    { type: "commander", name: commander },
    { type: "status", message: "Building card list…" },
    ...cards,
    { type: "done", totalCards, source, corrections },
  ];
}

/** An NDJSON response, one event per line, as the build route sends it. */
function ndjson(events: readonly BuildEvent[]): HttpResponse<string> {
  return new HttpResponse(
    events.map((event) => `${JSON.stringify(event)}\n`).join(""),
    {
      headers: { "Content-Type": "application/x-ndjson" },
    }
  );
}

/**
 * The recorded collection answer, keyed by the name each card was asked for. Scryfall answers
 * in request order and skips the names it lists in `not_found`.
 */
const RECORDED_CARD_BY_ASKED_NAME: ReadonlyMap<string, ScryfallCard> = (() => {
  const notFound = new Set(
    WIZARD_COLLECTION_RECORDED.not_found.map((id) => id.name)
  );
  const askedAndFound = WIZARD_COLLECTION_RECORDED_REQUEST.flatMap((id) =>
    id.name !== undefined && !notFound.has(id.name) ? [id.name] : []
  );
  return new Map(
    askedAndFound.flatMap((name, index) => {
      const card = WIZARD_COLLECTION_RECORDED.data[index];
      return card ? [[name, card] as const] : [];
    })
  );
})();

/** Scryfall's collection answer for `names`, built from the recording; unknown names are not found. */
function collectionAnswer(
  names: readonly string[]
): ScryfallCollectionResponse {
  return {
    object: "list",
    not_found: names
      .filter((name) => !RECORDED_CARD_BY_ASKED_NAME.has(name))
      .map((name) => ({ name })),
    data: names.flatMap((name) => {
      const card = RECORDED_CARD_BY_ASKED_NAME.get(name);
      return card ? [card] : [];
    }),
  };
}

function recordedCard(askedName: string): ScryfallCard {
  const card = RECORDED_CARD_BY_ASKED_NAME.get(askedName);
  if (!card) throw new Error(`No recorded Scryfall card for ${askedName}`);
  return card;
}

const CollectionBody = z.object({
  identifiers: z.array(z.object({ name: z.string() })),
});
const NamedBody = z.object({ name: z.string() }).passthrough();
const CardBody = z.object({ name: z.string() }).passthrough();

/** What each endpoint received during the current test, in order. */
let sent: string[] = [];
let buildBodies: unknown[] = [];
let deckBodies: unknown[] = [];
let patchBodies: unknown[] = [];
let cardBodies: z.infer<typeof CardBody>[] = [];
let collectionNames: string[][] = [];
let autocompleteQueries: string[] = [];
let cardsInFlight = 0;
let mostCardsInFlight = 0;

/** "METHOD path" for the app's routes, "METHOD scryfall path" for Scryfall. */
function describeRequest(request: Request): string {
  const url = new URL(request.url);
  const where =
    url.origin === SCRYFALL ? `scryfall ${url.pathname}` : url.pathname;
  return `${request.method} ${where}`;
}

const handlers = [
  http.post(BUILD_URL, async ({ request }) => {
    const body: unknown = await request.json();
    buildBodies.push(body);
    return ndjson(buildEvents());
  }),
  http.get(`${SCRYFALL}/cards/autocomplete`, ({ request }) => {
    autocompleteQueries.push(new URL(request.url).searchParams.get("q") ?? "");
    return HttpResponse.json(TALR_AUTOCOMPLETE_RECORDED);
  }),
  http.get(`${SCRYFALL}/cards/named`, ({ request }) =>
    new URL(request.url).searchParams.get("fuzzy") === TALRAND
      ? HttpResponse.json(TALRAND_NAMED_RECORDED)
      : HttpResponse.json(NAMED_NOT_FOUND_RECORDED, { status: 404 })
  ),
  http.post(`${SCRYFALL}/cards/collection`, async ({ request }) => {
    const names = CollectionBody.parse(await request.json()).identifiers.map(
      (id) => id.name
    );
    collectionNames.push(names);
    return HttpResponse.json(collectionAnswer(names));
  }),
  // POST /api/decks answers the stored row; the route defaults a missing
  // targetBracket to 3 and budget to null (`createDeckFieldsSchema`).
  http.post("/api/decks", async ({ request }) => {
    const body = NamedBody.parse(await request.json());
    deckBodies.push(body);
    return HttpResponse.json(
      {
        id: DECK_ID,
        name: body.name,
        targetBracket: 3,
        budget: null,
        isAIGenerated: body.isAIGenerated === true,
        createdAt: "2026-11-11T12:00:00.000Z",
        updatedAt: "2026-11-11T12:00:00.000Z",
        cards: [],
      },
      { status: 201 }
    );
  }),
  http.patch("/api/decks/:id", async ({ request, params }) => {
    const patch = z.record(z.string(), z.unknown()).parse(await request.json());
    patchBodies.push(patch);
    return HttpResponse.json({ id: params.id, ...patch });
  }),
  // A short pause per card lets overlapping requests show up in `mostCardsInFlight`.
  http.post("/api/decks/:id/cards", async ({ request, params }) => {
    const body = CardBody.parse(await request.json());
    cardBodies.push(body);
    cardsInFlight += 1;
    mostCardsInFlight = Math.max(mostCardsInFlight, cardsInFlight);
    await delay(5);
    cardsInFlight -= 1;
    return HttpResponse.json(
      {
        ...body,
        id: `row-${cardBodies.length}`,
        deckId: params.id,
        notes: null,
      },
      { status: 201 }
    );
  }),
];

const onComplete = vi.fn<(deckId: string) => void>();
const onClose = vi.fn<() => void>();

function renderWizard(): void {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const ui: ReactElement = (
    <QueryClientProvider client={client}>
      <DeckWizard open onClose={onClose} onComplete={onComplete} />
    </QueryClientProvider>
  );
  renderWithIntl(ui);
}

const HEADINGS = {
  budget: "What's your budget?",
  colors: "Choose your colors",
  strategy: "What kind of deck?",
  bracket: "Power level?",
  commander: "Do you have a commander in mind?",
  plan: "Review your deck plan",
} as const;

function continueButton(): HTMLElement {
  return screen.getByRole("button", { name: "Continue" });
}

async function continueTo(heading: string): Promise<void> {
  fireEvent.click(continueButton());
  await screen.findByRole("heading", { name: heading });
}

interface Answers {
  readonly budget: RegExp;
  readonly colors: readonly string[];
  readonly strategy: RegExp;
  readonly bracket: RegExp;
}

const CONTROL_BRACKET_3: Answers = {
  budget: /^Budget/,
  colors: ["Blue"],
  strategy: /Control/,
  bracket: /Bracket 3 — Upgraded/,
};

/** Answers the first four steps and stops on the commander step. */
async function answerUpToCommander(
  answers: Answers = CONTROL_BRACKET_3
): Promise<void> {
  renderWizard();
  await screen.findByRole("heading", { name: HEADINGS.budget });
  fireEvent.click(screen.getByRole("button", { name: answers.budget }));
  await continueTo(HEADINGS.colors);
  for (const color of answers.colors)
    fireEvent.click(screen.getByRole("button", { name: color }));
  await continueTo(HEADINGS.strategy);
  fireEvent.click(screen.getByRole("button", { name: answers.strategy }));
  await continueTo(HEADINGS.bracket);
  fireEvent.click(screen.getByRole("button", { name: answers.bracket }));
  await continueTo(HEADINGS.commander);
}

/** Answers every step, lets the AI choose the commander, and stops on the plan. */
async function answerUpToPlan(answers?: Answers): Promise<void> {
  await answerUpToCommander(answers);
  fireEvent.click(
    screen.getByRole("button", { name: "Skip — let the AI choose" })
  );
  await screen.findByRole("heading", { name: HEADINGS.plan });
}

function generate(): void {
  fireEvent.click(screen.getByRole("button", { name: "Generate Deck" }));
}

/** Walks to the plan, forgets the requests sent so far, and generates. */
async function generateDeck(answers?: Answers): Promise<void> {
  await answerUpToPlan(answers);
  sent = [];
  generate();
}

async function waitForDeckOpened(): Promise<void> {
  await waitFor(() => expect(onComplete).toHaveBeenCalledWith(DECK_ID));
}

function storedDeckCards(): readonly DeckCard[] {
  return useDeckStore.getState().decks[DECK_ID]?.cards ?? [];
}

function storedCard(name: string): DeckCard | undefined {
  return storedDeckCards().find((card) => card.name === name);
}

function cardBody(name: string): z.infer<typeof CardBody> | undefined {
  return cardBodies.find((body) => body.name === name);
}

describe("DeckWizard flow (characterization)", () => {
  const server = setupMsw(...handlers);
  server.events.on("request:start", ({ request }) => {
    sent.push(describeRequest(request));
  });

  beforeAll(() => {
    // The step transitions animate; the steps and requests are what is pinned.
    MotionGlobalConfig.skipAnimations = true;
  });

  afterAll(() => {
    MotionGlobalConfig.skipAnimations = false;
  });

  beforeEach(() => {
    localStorage.clear();
    useDeckStore.setState(useDeckStore.getInitialState(), true);
    sent = [];
    buildBodies = [];
    deckBodies = [];
    patchBodies = [];
    cardBodies = [];
    collectionNames = [];
    autocompleteQueries = [];
    cardsInFlight = 0;
    mostCardsInFlight = 0;
    onComplete.mockReset();
    onClose.mockReset();
    vi.spyOn(logger, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("serves the recorded collection request with the recorded answer", () => {
    const names = WIZARD_COLLECTION_RECORDED_REQUEST.flatMap((id) =>
      id.name ? [id.name] : []
    );

    expect(collectionAnswer(names)).toEqual(WIZARD_COLLECTION_RECORDED);
  });

  describe("the steps", () => {
    it("asks budget, colours, strategy, bracket, commander and plan, and enables Continue once a step is answered", async () => {
      renderWizard();

      await screen.findByRole("heading", { name: HEADINGS.budget });
      expect(continueButton()).toBeDisabled();
      fireEvent.click(screen.getByRole("button", { name: /^No Limit/ }));
      expect(continueButton()).toBeEnabled();

      await continueTo(HEADINGS.colors);
      expect(continueButton()).toBeDisabled();
      fireEvent.click(screen.getByRole("button", { name: "Blue" }));
      expect(continueButton()).toBeEnabled();
      fireEvent.click(screen.getByRole("button", { name: "Blue" }));
      expect(continueButton()).toBeDisabled();
      fireEvent.click(screen.getByRole("button", { name: "Blue" }));

      await continueTo(HEADINGS.strategy);
      expect(continueButton()).toBeDisabled();
      fireEvent.click(screen.getByRole("button", { name: /Combo/ }));

      await continueTo(HEADINGS.bracket);
      expect(continueButton()).toBeDisabled();
      fireEvent.click(screen.getByRole("button", { name: /Bracket 5 — cEDH/ }));

      await continueTo(HEADINGS.commander);
      // The commander is optional: Continue is enabled with nothing chosen.
      expect(continueButton()).toBeEnabled();

      await continueTo(HEADINGS.plan);
      expect(screen.queryByRole("button", { name: "Continue" })).toBeNull();
      expect(
        screen.getByRole("button", { name: "Generate Deck" })
      ).toBeEnabled();
      expect(sent).toEqual([]);
    });

    it("keeps the answers when the player steps back", async () => {
      renderWizard();
      await screen.findByRole("heading", { name: HEADINGS.budget });
      fireEvent.click(screen.getByRole("button", { name: /^Moderate/ }));
      await continueTo(HEADINGS.colors);
      fireEvent.click(screen.getByRole("button", { name: "Green" }));
      await continueTo(HEADINGS.strategy);

      fireEvent.click(screen.getByRole("button", { name: "Back" }));
      await screen.findByRole("heading", { name: HEADINGS.colors });
      expect(continueButton()).toBeEnabled();

      fireEvent.click(screen.getByRole("button", { name: "Back" }));
      await screen.findByRole("heading", { name: HEADINGS.budget });
      expect(continueButton()).toBeEnabled();
    });

    it("asks Scryfall for suggestions once, for the last text typed, and shows the first eight", async () => {
      await answerUpToCommander();
      const search = screen.getByPlaceholderText("Search for a commander…");

      for (const text of ["T", "Ta", "Tal", "Talr"])
        fireEvent.change(search, { target: { value: text } });

      await screen.findByRole("button", { name: TALRAND });
      expect(autocompleteQueries).toEqual(["Talr"]);
      const shown = TALR_AUTOCOMPLETE_RECORDED.data.slice(0, 8);
      for (const name of shown)
        expect(screen.getByRole("button", { name })).toBeInTheDocument();
      expect(
        screen.queryByRole("button", {
          name: TALR_AUTOCOMPLETE_RECORDED.data[8],
        })
      ).toBeNull();
    });

    it("previews the chosen commander from Scryfall's fuzzy match", async () => {
      await answerUpToCommander();
      fireEvent.change(screen.getByPlaceholderText("Search for a commander…"), {
        target: { value: "Talr" },
      });
      fireEvent.click(await screen.findByRole("button", { name: TALRAND }));

      expect(
        await screen.findByText(TALRAND_NAMED_RECORDED.type_line)
      ).toBeInTheDocument();
      expect(screen.getByRole("img", { name: TALRAND })).toBeInTheDocument();
      expect(sent).toEqual([
        "GET scryfall /cards/autocomplete",
        "GET scryfall /cards/named",
      ]);
    });

    it("sends the answers as the build request, the chosen commander by its English name", async () => {
      await answerUpToCommander({
        budget: /^Budget/,
        colors: ["Blue"],
        strategy: /Control/,
        bracket: /Bracket 1 — Exhibition/,
      });
      fireEvent.change(screen.getByPlaceholderText("Search for a commander…"), {
        target: { value: "Talr" },
      });
      fireEvent.click(await screen.findByRole("button", { name: TALRAND }));
      await screen.findByText(TALRAND_NAMED_RECORDED.type_line);
      await continueTo(HEADINGS.plan);

      generate();

      await waitForDeckOpened();
      expect(buildBodies).toEqual([
        {
          budget: 50,
          colors: ["U"],
          strategy: "Control",
          bracket: 1,
          commanderName: TALRAND,
        },
      ]);
    });

    it("sends no budget and no commander after No Limit and Skip, and the colours in the order clicked", async () => {
      await generateDeck({
        budget: /^No Limit/,
        colors: ["Blue", "White"],
        strategy: /Voltron/,
        bracket: /Bracket 4 — Optimized/,
      });

      await waitForDeckOpened();
      expect(buildBodies).toEqual([
        {
          budget: null,
          colors: ["U", "W"],
          strategy: "Voltron",
          bracket: 4,
          commanderName: null,
        },
      ]);
    });
  });

  describe("saving the built deck", () => {
    it("currently saves the deck with one request per card, one at a time, after an empty create (pinned; see B2-33)", async () => {
      await generateDeck();

      await waitForDeckOpened();
      // Six fixed requests plus one per distinct card: a 99-card deck of about
      // sixty distinct cards costs about 65 round trips, all sequential.
      expect(sent).toEqual([
        "POST /api/ai/build",
        "POST /api/decks",
        "GET scryfall /cards/named",
        "PATCH /api/decks/deck-ai-1",
        "POST /api/decks/deck-ai-1/cards",
        "POST scryfall /cards/collection",
        ...STREAMED_CARDS.map(() => "POST /api/decks/deck-ai-1/cards"),
      ]);
      expect(mostCardsInFlight).toBe(1);
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it("currently creates the deck without the bracket and budget the player picked (pinned; see B2-33)", async () => {
      await generateDeck({
        budget: /^Budget/,
        colors: ["Blue"],
        strategy: /Control/,
        bracket: /Bracket 1 — Exhibition/,
      });

      await waitForDeckOpened();
      expect(deckBodies).toEqual([
        { name: "AI Deck — Control", isAIGenerated: true },
      ]);
      const deck = useDeckStore.getState().decks[DECK_ID];
      expect(deck?.targetBracket).toBe(3);
      expect(deck?.budget).toBeNull();
      expect(deck?.isAIGenerated).toBe(true);
    });

    it("sets the streamed commander from Scryfall's fuzzy match before adding the cards", async () => {
      await generateDeck();

      await waitForDeckOpened();
      expect(patchBodies).toEqual([
        {
          commanderId: TALRAND_NAMED_RECORDED.id,
          commanderName: TALRAND,
          pairingType: "none",
        },
      ]);
      expect(cardBodies[0]).toMatchObject({
        scryfallId: TALRAND_NAMED_RECORDED.id,
        name: TALRAND,
        category: "commander",
        isCommander: true,
        quantity: 1,
      });
      expect(useDeckStore.getState().decks[DECK_ID]?.commander?.name).toBe(
        TALRAND
      );
    });

    it("looks the cards up by the streamed names and saves each basic land once, with its quantity", async () => {
      await generateDeck();

      await waitForDeckOpened();
      expect(collectionNames).toEqual([
        STREAMED_CARDS.map((card) => card.name),
      ]);
      expect(cardBodies.filter((body) => body.name === "Island")).toEqual([
        expect.objectContaining({
          quantity: 30,
          category: "land",
          zone: "main",
        }),
      ]);
      expect(storedCard("Island")?.quantity).toBe(30);
    });

    it("keeps the AI's category when it is a deck category, and falls back to the type line and text when it is not", async () => {
      await generateDeck();

      await waitForDeckOpened();
      expect(cardBody("Sol Ring")).toMatchObject({ category: "ramp" });
      // "counter" is not a deck category; Counterspell's "counter target" text files it as protection.
      expect(cardBody("Counterspell")).toMatchObject({
        category: "protection",
      });
    });

    it("currently saves a double-faced card under its full name, filed by its type line, without faces or front-face text (pinned; see B2-34)", async () => {
      await generateDeck();

      await waitForDeckOpened();
      const seaGate = recordedCard("Sea Gate Restoration");
      // The stream said "Sea Gate Restoration", category "draw"; Scryfall answers with the
      // whole card, so the name lookup misses and the type line "Sorcery // Land" decides.
      expect(cardBody(seaGate.name)).toMatchObject({
        scryfallId: seaGate.id,
        category: "land",
        quantity: 1,
        manaCost: "",
        oracleText: "",
      });
      const stored = storedCard(seaGate.name);
      expect(stored?.cardFaces).toBeUndefined();
      expect(stored?.layout).toBeUndefined();
      expect(stored?.isFlexibleLand).toBeUndefined();
      // What the store's own mapping keeps for the same Scryfall card.
      expect(makeDeckCard(seaGate)).toMatchObject({
        manaCost: "{4}{U}{U}{U}",
        category: "draw",
        layout: "modal_dfc",
        isFlexibleLand: true,
      });
      expect(makeDeckCard(seaGate).cardFaces?.map((face) => face.name)).toEqual(
        ["Sea Gate Restoration", "Sea Gate, Reborn"]
      );
    });

    it("currently saves a creature without its printed power and toughness (pinned; see B2-34)", async () => {
      await generateDeck();

      await waitForDeckOpened();
      const solemn = recordedCard("Solemn Simulacrum");
      expect([solemn.power, solemn.toughness]).toEqual(["2", "2"]);
      expect(cardBody("Solemn Simulacrum")).toMatchObject({
        power: null,
        toughness: null,
      });
    });

    it("currently looks the cards up in batches of 75 names and drops the names Scryfall does not find without a word (pinned; see B2-34)", async () => {
      const unknown = Array.from({ length: 75 }, (_, index): CardEvent => ({
        type: "card",
        name: `Unknown Card ${index + 1}`,
        category: "other",
        quantity: 1,
      }));
      server.use(
        http.post(BUILD_URL, () =>
          ndjson(buildEvents({ cards: [...STREAMED_CARDS, ...unknown] }))
        )
      );

      await generateDeck();

      await waitForDeckOpened();
      expect(collectionNames.map((names) => names.length)).toEqual([75, 5]);
      expect(storedDeckCards().map((card) => card.name)).toEqual(
        STREAMED_CARDS.map((card) => recordedCard(card.name).name)
      );
      expect(screen.queryByText(/Unknown Card/)).toBeNull();
    });

    it("shows the corrections and waits for the player before opening a corrected deck", async () => {
      server.use(
        http.post(BUILD_URL, () =>
          ndjson(
            buildEvents({
              corrections: [
                {
                  action: "removed",
                  name: "Mana Crypt",
                  quantity: 1,
                  reason: "banned",
                },
              ],
            })
          )
        )
      );

      await generateDeck();

      expect(
        await screen.findByText("Removed Mana Crypt: banned in Commander")
      ).toBeInTheDocument();
      expect(
        sent.filter((line) => line === "POST /api/decks/deck-ai-1/cards")
      ).toHaveLength(STREAMED_CARDS.length + 1);
      expect(onComplete).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole("button", { name: "Open the deck" }));
      expect(onComplete).toHaveBeenCalledWith(DECK_ID);
    });

    it("tells the player when the list is a demo deck", async () => {
      server.use(
        http.post(BUILD_URL, () => ndjson(buildEvents({ source: "demo" })))
      );

      await generateDeck();

      await waitForDeckOpened();
      expect(
        screen.getByText(
          "Demo deck — no AI provider is configured on this deployment, so this is a placeholder list."
        )
      ).toBeInTheDocument();
    });
  });

  describe("when something fails", () => {
    it("shows the allowance message when the build is refused, creates no deck, and offers Try again", async () => {
      const denial = aiCallDenialBody({
        code: "allowance_exhausted",
        route: "build",
        limit: 5,
        resetsAt: new Date("2026-12-01T00:00:00.000Z"),
      });
      server.use(
        http.post(BUILD_URL, () => HttpResponse.json(denial, { status: 429 }))
      );

      await generateDeck();

      expect(
        await screen.findByText(
          "Monthly AI deck builds used up (5). They reset on December 1, 2026. You can still build a deck by hand."
        )
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Try again" })
      ).toBeInTheDocument();
      expect(sent).toEqual(["POST /api/ai/build"]);
    });

    it("reports a failed build, and Try again returns to the plan with the answers kept", async () => {
      server.use(
        http.post(BUILD_URL, () =>
          HttpResponse.json({ error: "AI deck build failed" }, { status: 500 })
        )
      );

      await generateDeck();

      expect(
        await screen.findByText("Build was cancelled or failed.")
      ).toBeInTheDocument();
      expect(sent).toEqual(["POST /api/ai/build"]);

      server.resetHandlers();
      fireEvent.click(screen.getByRole("button", { name: "Try again" }));
      await screen.findByRole("heading", { name: HEADINGS.plan });
      generate();

      await waitForDeckOpened();
      expect(buildBodies).toEqual([
        {
          budget: 50,
          colors: ["U"],
          strategy: "Control",
          bracket: 3,
          commanderName: null,
        },
      ]);
    });

    it.each([
      ["ends without a done event", buildEvents().slice(0, -1)],
      [
        "carries an error event",
        [
          { type: "status", message: "Thinking…" },
          { type: "error", message: "AI deck build failed" },
        ] satisfies readonly BuildEvent[],
      ],
    ])(
      "reports the build as failed and saves nothing when the stream %s",
      async (_case, events) => {
        server.use(http.post(BUILD_URL, () => ndjson(events)));

        await generateDeck();

        expect(
          await screen.findByText("Build was cancelled or failed.")
        ).toBeInTheDocument();
        expect(sent).toEqual(["POST /api/ai/build"]);
        expect(onComplete).not.toHaveBeenCalled();
      }
    );

    it("currently returns to the plan without a message when the deck cannot be created (pinned; new follow-up, see the P1-19 PR)", async () => {
      server.use(
        http.post("/api/decks", () =>
          HttpResponse.json({ error: "Database unavailable" }, { status: 500 })
        )
      );

      await generateDeck();

      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: "Generate Deck" })
        ).toBeInTheDocument()
      );
      expect(
        screen.getByRole("heading", { name: HEADINGS.plan })
      ).toBeInTheDocument();
      expect(
        screen.queryByText(/Database unavailable|HTTP 500|failed/)
      ).toBeNull();
      expect(sent).toEqual(["POST /api/ai/build", "POST /api/decks"]);
      expect(onComplete).not.toHaveBeenCalled();
    });

    it("leaves the commander empty and still saves the cards when Scryfall cannot resolve the streamed commander", async () => {
      server.use(
        http.post(BUILD_URL, () =>
          ndjson(buildEvents({ commander: "Zzyzx Nonexistent Card" }))
        )
      );

      await generateDeck();

      await waitForDeckOpened();
      expect(sent.slice(0, 4)).toEqual([
        "POST /api/ai/build",
        "POST /api/decks",
        "GET scryfall /cards/named",
        "POST scryfall /cards/collection",
      ]);
      expect(patchBodies).toEqual([]);
      expect(useDeckStore.getState().decks[DECK_ID]?.commander).toBeNull();
      expect(storedDeckCards()).toHaveLength(STREAMED_CARDS.length);
    });

    it("currently opens the deck without the cards of a batch Scryfall failed to look up (pinned; see B2-34)", async () => {
      server.use(
        http.post(
          `${SCRYFALL}/cards/collection`,
          () => new HttpResponse(null, { status: 503 })
        )
      );

      await generateDeck();

      await waitForDeckOpened();
      expect(storedDeckCards()).toEqual([]);
      expect(
        sent.filter((line) => line === "POST /api/decks/deck-ai-1/cards")
      ).toHaveLength(1);
      expect(logger.error).toHaveBeenCalledWith(
        "Batch import error",
        "DeckWizard",
        expect.any(Error)
      );
      expect(screen.queryByText("Build was cancelled or failed.")).toBeNull();
    });

    it("currently keeps a card the server refused to save, and still opens the deck (pinned; see B2-36)", async () => {
      server.use(
        http.post("/api/decks/:id/cards", async ({ request }) => {
          const body = CardBody.parse(await request.json());
          return body.name === "Sol Ring"
            ? HttpResponse.json(
                { error: "Database unavailable" },
                { status: 500 }
              )
            : HttpResponse.json(
                { ...body, id: `row-${body.name}`, notes: null },
                { status: 201 }
              );
        })
      );

      await generateDeck();

      await waitForDeckOpened();
      // Never saved, so it keeps the Scryfall id the wizard gave it instead of a row id.
      expect(storedCard("Sol Ring")?.id).toBe(recordedCard("Sol Ring").id);
      expect(storedCard("Island")?.id).toBe("row-Island");
    });
  });
});
