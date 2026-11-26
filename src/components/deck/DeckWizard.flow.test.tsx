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
 *
 * A deck the server cannot create is no longer pinned: the wizard keeps the built deck, says it
 * could not be saved, and "Try saving again" creates it without a new build (wizard-save-retry).
 */
import { fireEvent, screen, waitFor } from "@testing-library/react";
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
import type { BuildStep } from "@/lib/ai/build-step";
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
import type { TestLocale } from "@/test/intl-catalogs";
import { setupMsw } from "@/test/msw";
import { renderWithProviders } from "@/test/render";
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

/**
 * Each status event as the route sends it (`statusEvent`, `src/app/api/ai/build/status-event.ts`):
 * its step, and the English line a client loaded before steps existed reads instead.
 */
const STATUS_EVENTS = {
  thinking: { type: "status", step: "thinking", message: "Thinking…" },
  consulting: {
    type: "status",
    step: "consulting",
    message: "Consulting the AI oracle…",
  },
  building: {
    type: "status",
    step: "building",
    message: "Building card list…",
  },
} as const satisfies Readonly<Record<BuildStep, BuildEvent>>;

/** Any of the English lines the route sends in a status event's `message`. */
const SERVER_STATUS_LINE =
  /Thinking…|Consulting the AI oracle…|Building card list…/;

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
    STATUS_EVENTS.thinking,
    { type: "commander", name: commander },
    STATUS_EVENTS.building,
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
 * A build response that sends `events`, then breaks while the wizard reads it, as when the
 * connection drops after the route answered: the body's reader rejects with the `TypeError` a
 * browser gives a network error mid-body.
 *
 * It is a plain `Response`, not an MSW handler: MSW serves a mocked body through an emulated
 * socket and closes that socket when the body errors, which undici reads as the end of the
 * body, so the reader never rejects (`@mswjs/interceptors` 0.45.12, the mocked-response writer
 * in `lib/node/source-*.js`, read 2026-11-26).
 */
function ndjsonThenDropped(events: readonly BuildEvent[]): Response {
  const lines = events.map((event) => `${JSON.stringify(event)}\n`).join("");
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(lines));
    },
    // Asked for more once the sent lines are read: the connection is gone.
    pull(controller) {
      controller.error(new TypeError("network error"));
    },
  });
  return new Response(body, {
    headers: { "Content-Type": "application/x-ndjson" },
  });
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
const CommandZoneBody = z.object({
  addCards: z.array(CardBody),
  commandZone: z.record(z.string(), z.unknown()),
});

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

/**
 * The row `POST /api/decks` answers for a new deck; the route defaults a missing targetBracket to
 * 3 and budget to null (`createDeckFieldsSchema`).
 */
function storedDeckRow(id: string, body: z.infer<typeof NamedBody>) {
  return {
    id,
    name: body.name,
    targetBracket: 3,
    budget: null,
    isAIGenerated: body.isAIGenerated === true,
    createdAt: "2026-11-11T12:00:00.000Z",
    updatedAt: "2026-11-11T12:00:00.000Z",
    cards: [],
  };
}

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
  http.post("/api/decks", async ({ request }) => {
    const body = NamedBody.parse(await request.json());
    deckBodies.push(body);
    return HttpResponse.json(storedDeckRow(DECK_ID, body), { status: 201 });
  }),
  http.patch("/api/decks/:id", async ({ request, params }) => {
    const patch = z.record(z.string(), z.unknown()).parse(await request.json());
    patchBodies.push(patch);
    return HttpResponse.json({ id: params.id, ...patch });
  }),
  // The commander goes through the one-request command-zone route: its deck
  // fields land in `patchBodies` and its row in `cardBodies`, as before.
  http.patch("/api/decks/:id/command-zone", async ({ request, params }) => {
    const change = CommandZoneBody.parse(await request.json());
    patchBodies.push(change.commandZone);
    cardBodies.push(...change.addCards);
    return HttpResponse.json({
      cards: change.addCards.map((card, index) => ({
        ...card,
        id: `command-row-${index + 1}`,
        deckId: params.id,
        notes: null,
      })),
      version: 1,
    });
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

/** The rendered wizard, so a test can close and reopen it as the decks page does. */
let renderedWizard: ReturnType<typeof renderWithProviders> | null = null;

function renderWizard(locale: TestLocale = "en"): void {
  renderedWizard = renderWithProviders(
    <DeckWizard open onClose={onClose} onComplete={onComplete} />,
    { locale }
  );
}

/** Closes the wizard and opens it again, still mounted, as the decks page does for a new build. */
async function reopenWizard(): Promise<void> {
  renderedWizard?.rerender(
    <DeckWizard open={false} onClose={onClose} onComplete={onComplete} />
  );
  renderedWizard?.rerender(
    <DeckWizard open onClose={onClose} onComplete={onComplete} />
  );
  await screen.findByRole("heading", { name: HEADINGS.budget });
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
  await answerOpenWizardUpToCommander(answers);
}

/** From the budget step of the open wizard, answers the first four steps. */
async function answerOpenWizardUpToCommander(answers: Answers): Promise<void> {
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

/** Clicks a choice of the French wizard, then "Continuer". */
async function chooseInFrench(choice: string | RegExp): Promise<void> {
  fireEvent.click(await screen.findByRole("button", { name: choice }));
  fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
}

/** Builds a mono-blue Control deck at bracket 3 in the French wizard, the AI choosing the commander. */
async function generateDeckInFrench(): Promise<void> {
  renderWizard("fr");
  await chooseInFrench("Budget < 50 $ par carte");
  await chooseInFrench("Bleu");
  await chooseInFrench(/Contrôle Contrer et contrôler/);
  await chooseInFrench(/Amélioré \(bracket 3\)/);
  fireEvent.click(
    await screen.findByRole("button", { name: "Passer — laisser l’IA choisir" })
  );
  await screen.findByRole("heading", { name: "Vérifiez le plan du deck" });
  fireEvent.click(screen.getByRole("button", { name: "Générer le deck" }));
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

const DECK_NOT_SAVED =
  "Your deck was built, but it could not be saved. The build is kept: try saving it again.";
/** What a build the server failed, or whose stream broke, says (`wizard.buildFailed`). */
const BUILD_FAILED = "The AI could not build your deck. Try again.";
/** What a build request that got no answer says (`wizard.buildUnreachable`). */
const BUILD_UNREACHABLE =
  "The server could not be reached to build the deck. Check your connection and try again.";
const TRY_SAVING_AGAIN = "Try saving again";

describe("DeckWizard flow (characterization)", () => {
  const server = setupMsw(...handlers);

  /** The deck API refuses to create the deck, every time or only for the first request. */
  function failDeckCreation(options: { readonly once?: boolean } = {}): void {
    server.use(
      http.post(
        "/api/decks",
        () =>
          HttpResponse.json({ error: "Database unavailable" }, { status: 500 }),
        options
      )
    );
  }
  /**
   * Serves deck creates as the route does (`createOnce` in `POST /api/decks`): a request whose
   * `Idempotency-Key` already created a deck answers that deck instead of storing a second one.
   * With `loseFirstAnswer`, the first create is stored but its answer never reaches the browser,
   * as on a dropped connection.
   *
   * @returns the ids of the decks the server stores, in order, filled as requests arrive
   */
  function serveDeckCreatesAsTheRoute(
    options: { readonly loseFirstAnswer?: boolean } = {}
  ): readonly string[] {
    const storedIds: string[] = [];
    const idByKey = new Map<string, string>();
    server.use(
      http.post("/api/decks", async ({ request }) => {
        const body = NamedBody.parse(await request.json());
        const key = request.headers.get("Idempotency-Key");
        const earlierId = key === null ? undefined : idByKey.get(key);
        if (earlierId !== undefined) {
          return HttpResponse.json(storedDeckRow(earlierId, body));
        }
        const id = `deck-ai-${storedIds.length + 1}`;
        storedIds.push(id);
        if (key !== null) idByKey.set(key, id);
        if (options.loseFirstAnswer === true && storedIds.length === 1) {
          return HttpResponse.error();
        }
        return HttpResponse.json(storedDeckRow(id, body), { status: 201 });
      })
    );
    return storedIds;
  }
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
    renderedWizard = null;
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
    vi.spyOn(logger, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
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
      // Five fixed requests plus one per distinct card: a 99-card deck of about
      // sixty distinct cards costs about 65 round trips, all sequential.
      expect(sent).toEqual([
        "POST /api/ai/build",
        "POST /api/decks",
        "GET scryfall /cards/named",
        "PATCH /api/decks/deck-ai-1/command-zone",
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
      ).toHaveLength(STREAMED_CARDS.length);
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

  describe("the progress line while the deck builds", () => {
    const TALRAND_LINE = {
      en: `Commander: ${TALRAND}`,
      fr: `Commandant : ${TALRAND}`,
    };

    /**
     * Answers the build with a stream the test writes by hand, so it can read the progress
     * screen between two events. `send` writes events as NDJSON lines; `end` closes the stream.
     */
    function holdBuildStream() {
      const encoder = new TextEncoder();
      const held: { controller?: ReadableStreamDefaultController<Uint8Array> } =
        {};
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          held.controller = controller;
        },
      });
      server.use(
        http.post(
          BUILD_URL,
          () =>
            new HttpResponse(body, {
              headers: { "Content-Type": "application/x-ndjson" },
            })
        )
      );
      return {
        send(events: readonly unknown[]): void {
          const lines = events.map((event) => `${JSON.stringify(event)}\n`);
          held.controller?.enqueue(encoder.encode(lines.join("")));
        },
        end(): void {
          held.controller?.close();
        },
      };
    }

    it("shows each step of the build in French, never the server's English line", async () => {
      const build = holdBuildStream();
      await generateDeckInFrench();

      build.send([STATUS_EVENTS.thinking, STATUS_EVENTS.consulting]);
      expect(
        await screen.findByText("Consultation de l’oracle IA…")
      ).toBeInTheDocument();
      expect(document.body).not.toHaveTextContent(SERVER_STATUS_LINE);

      build.send([
        { type: "commander", name: TALRAND },
        STATUS_EVENTS.building,
      ]);
      expect(
        await screen.findByText("Construction de la liste de cartes…")
      ).toBeInTheDocument();
      expect(document.body).not.toHaveTextContent(SERVER_STATUS_LINE);

      build.send(buildEvents().slice(3));
      build.end();
      await waitForDeckOpened();
    });

    it("shows each step of the build in English to an English player", async () => {
      const build = holdBuildStream();
      await generateDeck();

      build.send([STATUS_EVENTS.thinking, STATUS_EVENTS.consulting]);
      expect(
        await screen.findByText("Consulting the AI oracle…")
      ).toBeInTheDocument();

      build.send([
        { type: "commander", name: TALRAND },
        STATUS_EVENTS.building,
      ]);
      expect(
        await screen.findByText("Building card list…")
      ).toBeInTheDocument();
      expect(screen.getByText(TALRAND_LINE.en)).toBeInTheDocument();

      build.send(buildEvents().slice(3));
      build.end();
      await waitForDeckOpened();
    });

    it.each([
      [
        "a server from before steps sends only its English line",
        { type: "status", message: "Consulting the AI oracle…" },
      ],
      [
        "the step is one this client does not know",
        { type: "status", step: "polishing", message: "Polishing the list…" },
      ],
    ])(
      "shows the generic line, not the server's text, when %s",
      async (_case, event) => {
        const build = holdBuildStream();
        await generateDeckInFrench();

        // The commander line shows once the status event before it was read.
        build.send([event, { type: "commander", name: TALRAND }]);
        expect(await screen.findByText(TALRAND_LINE.fr)).toBeInTheDocument();
        expect(screen.getByText("Réflexion…")).toBeInTheDocument();
        expect(screen.queryByText(event.message)).toBeNull();

        build.send(buildEvents().slice(2));
        build.end();
        await waitForDeckOpened();
      }
    );
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

      expect(await screen.findByText(BUILD_FAILED)).toBeInTheDocument();
      expect(screen.queryByText(/AI deck build failed|500/)).toBeNull();
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
          STATUS_EVENTS.thinking,
          { type: "error", message: "AI deck build failed" },
        ] satisfies readonly BuildEvent[],
      ],
    ])(
      "reports the build as failed and saves nothing when the stream %s",
      async (_case, events) => {
        server.use(http.post(BUILD_URL, () => ndjson(events)));

        await generateDeck();

        expect(await screen.findByText(BUILD_FAILED)).toBeInTheDocument();
        expect(
          screen.queryByText(/AI deck build failed|ended early/)
        ).toBeNull();
        expect(sent).toEqual(["POST /api/ai/build"]);
        expect(onComplete).not.toHaveBeenCalled();
      }
    );

    it("reports a stream that breaks after the server answered as a failed build, not as a lost connection", async () => {
      await answerUpToPlan();
      // The build request is the only one left, so `fetch` itself answers it (see
      // `ndjsonThenDropped` for why MSW cannot).
      const buildRequest = vi
        .fn<typeof fetch>()
        .mockResolvedValue(ndjsonThenDropped(buildEvents().slice(0, 4)));
      vi.stubGlobal("fetch", buildRequest);
      generate();

      expect(await screen.findByText(BUILD_FAILED)).toBeInTheDocument();
      expect(screen.queryByText(BUILD_UNREACHABLE)).toBeNull();
      expect(
        screen.getByRole("button", { name: "Try again" })
      ).toBeInTheDocument();
      expect(buildRequest).toHaveBeenCalledOnce();
      expect(buildRequest).toHaveBeenCalledWith(BUILD_URL, expect.anything());
      expect(onComplete).not.toHaveBeenCalled();
    });

    // The bodies are the route's own: its rate limit, and `requireAuth`'s 401.
    it.each([
      [
        "too many builds in a short time (429)",
        429,
        "Too many requests. Please wait 42s before retrying.",
        "Too many builds in a short time. Wait a minute, then try again.",
      ],
      [
        "an ended session (401)",
        401,
        "Unauthorized",
        "Your session has ended. Sign in again to build a deck with AI.",
      ],
    ])(
      "says what to do when the server refuses the build for %s, and offers Try again",
      async (_case, status, routeError, message) => {
        server.use(
          http.post(BUILD_URL, () =>
            HttpResponse.json({ error: routeError }, { status })
          )
        );

        await generateDeck();

        expect(await screen.findByText(message)).toBeInTheDocument();
        expect(screen.queryByText(routeError)).toBeNull();
        expect(
          screen.getByRole("button", { name: "Try again" })
        ).toBeInTheDocument();
        expect(sent).toEqual(["POST /api/ai/build"]);
      }
    );

    it("tells a French player to check the connection, never the browser's own error, when the build request fails on the network", async () => {
      server.use(http.post(BUILD_URL, () => HttpResponse.error()));

      await generateDeckInFrench();

      expect(
        await screen.findByText(
          "Impossible de joindre le serveur pour construire le deck. Vérifiez votre connexion et réessayez."
        )
      ).toBeInTheDocument();
      expect(document.body).not.toHaveTextContent(
        /failed to fetch|fetch failed/i
      );
      expect(
        screen.getByRole("button", { name: "Réessayer" })
      ).toBeInTheDocument();
      expect(onComplete).not.toHaveBeenCalled();
      // The browser's error goes to the log instead, as a warning: a player offline is no
      // incident for Sentry.
      expect(logger.warn).toHaveBeenCalledWith(
        "AI deck build failed",
        "useAIDeckBuild",
        expect.objectContaining({ cause: expect.any(TypeError) })
      );
      expect(logger.error).not.toHaveBeenCalled();
    });

    it("tells the player to check the connection when the build request gets no answer", async () => {
      server.use(http.post(BUILD_URL, () => HttpResponse.error()));

      await generateDeck();

      expect(await screen.findByText(BUILD_UNREACHABLE)).toBeInTheDocument();
      expect(document.body).not.toHaveTextContent(
        /failed to fetch|fetch failed/i
      );
      expect(
        screen.getByRole("button", { name: "Try again" })
      ).toBeInTheDocument();
      expect(sent).toEqual(["POST /api/ai/build"]);
      expect(onComplete).not.toHaveBeenCalled();
    });

    // The bodies are the route's own: its rate limit, `requireAuth`'s 401, and a server failure.
    it.each([
      [
        "too many builds in a short time (429)",
        429,
        "Too many requests. Please wait 42s before retrying.",
        "Trop de constructions en peu de temps. Patientez une minute, puis réessayez.",
      ],
      [
        "an ended session (401)",
        401,
        "Unauthorized",
        "Votre session a expiré. Reconnectez-vous pour construire un deck avec l’IA.",
      ],
      [
        "a server failure (500)",
        500,
        "AI deck build failed",
        "L’IA n’a pas pu construire votre deck. Réessayez.",
      ],
    ])(
      "tells a French player what to do when the server refuses the build for %s",
      async (_case, status, routeError, message) => {
        server.use(
          http.post(BUILD_URL, () =>
            HttpResponse.json({ error: routeError }, { status })
          )
        );

        await generateDeckInFrench();

        expect(await screen.findByText(message)).toBeInTheDocument();
        expect(screen.queryByText(routeError)).toBeNull();
        expect(
          screen.getByRole("button", { name: "Réessayer" })
        ).toBeInTheDocument();
        expect(onComplete).not.toHaveBeenCalled();
      }
    );

    it("says the built deck could not be saved and keeps it", async () => {
      failDeckCreation();

      await generateDeck();

      expect(await screen.findByText(DECK_NOT_SAVED)).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "AI is building your deck…" })
      ).toBeInTheDocument();
      expect(screen.queryByRole("heading", { name: HEADINGS.plan })).toBeNull();
      expect(
        screen.getByRole("button", { name: TRY_SAVING_AGAIN })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Try again" })
      ).toBeInTheDocument();
      expect(screen.queryByText(/Database unavailable|HTTP 500/)).toBeNull();
      expect(sent).toEqual(["POST /api/ai/build", "POST /api/decks"]);
      expect(onComplete).not.toHaveBeenCalled();
    });

    it("saving again creates the deck without a new build", async () => {
      failDeckCreation({ once: true });
      await generateDeck();

      fireEvent.click(
        await screen.findByRole("button", { name: TRY_SAVING_AGAIN })
      );

      await waitForDeckOpened();
      expect(sent).toEqual([
        "POST /api/ai/build",
        "POST /api/decks",
        "POST /api/decks",
        "GET scryfall /cards/named",
        "PATCH /api/decks/deck-ai-1/command-zone",
        "POST scryfall /cards/collection",
        ...STREAMED_CARDS.map(() => "POST /api/decks/deck-ai-1/cards"),
      ]);
      expect(buildBodies).toHaveLength(1);
      expect(deckBodies).toEqual([
        { name: "AI Deck — Control", isAIGenerated: true },
      ]);
      expect(useDeckStore.getState().decks[DECK_ID]?.commander?.name).toBe(
        TALRAND
      );
      expect(storedCard("Island")?.quantity).toBe(30);
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it("saving again after a lost answer opens the deck the first save stored, and stores no second deck", async () => {
      const storedDeckIds = serveDeckCreatesAsTheRoute({
        loseFirstAnswer: true,
      });
      await generateDeck();

      fireEvent.click(
        await screen.findByRole("button", { name: TRY_SAVING_AGAIN })
      );

      await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
      expect(storedDeckIds).toEqual([DECK_ID]);
      expect(onComplete).toHaveBeenCalledWith(DECK_ID);
      expect(buildBodies).toHaveLength(1);
    });

    it("stores a new build as a new deck after a saved one", async () => {
      const storedDeckIds = serveDeckCreatesAsTheRoute();
      await generateDeck();
      await waitForDeckOpened();

      await reopenWizard();
      await answerOpenWizardUpToCommander(CONTROL_BRACKET_3);
      fireEvent.click(
        screen.getByRole("button", { name: "Skip — let the AI choose" })
      );
      await screen.findByRole("heading", { name: HEADINGS.plan });
      generate();

      await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(2));
      expect(storedDeckIds).toEqual([DECK_ID, "deck-ai-2"]);
      expect(onComplete).toHaveBeenLastCalledWith("deck-ai-2");
    });

    it("saving again shows the build's corrections before opening the deck", async () => {
      failDeckCreation({ once: true });
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

      fireEvent.click(
        await screen.findByRole("button", { name: TRY_SAVING_AGAIN })
      );

      expect(
        await screen.findByText("Removed Mana Crypt: banned in Commander")
      ).toBeInTheDocument();
      expect(onComplete).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole("button", { name: "Open the deck" }));
      expect(onComplete).toHaveBeenCalledWith(DECK_ID);
      expect(sent.slice(0, 3)).toEqual([
        "POST /api/ai/build",
        "POST /api/decks",
        "POST /api/decks",
      ]);
      expect(sent.filter((line) => line === "POST /api/ai/build")).toHaveLength(
        1
      );
    });

    it("keeps the message, sends no new build and opens no deck when saving again fails too", async () => {
      failDeckCreation();
      await generateDeck();

      fireEvent.click(
        await screen.findByRole("button", { name: TRY_SAVING_AGAIN })
      );

      await waitFor(() =>
        expect(sent).toEqual([
          "POST /api/ai/build",
          "POST /api/decks",
          "POST /api/decks",
        ])
      );
      expect(await screen.findByText(DECK_NOT_SAVED)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: TRY_SAVING_AGAIN })
      ).toBeInTheDocument();
      expect(screen.queryByText(/Database unavailable|HTTP 500/)).toBeNull();
      expect(onComplete).not.toHaveBeenCalled();
    });

    it("starts a fresh build when the player chooses Try again after a failed save", async () => {
      failDeckCreation({ once: true });
      await generateDeck();

      fireEvent.click(await screen.findByRole("button", { name: "Try again" }));
      await screen.findByRole("heading", { name: HEADINGS.plan });
      expect(screen.queryByText(DECK_NOT_SAVED)).toBeNull();
      generate();

      await waitForDeckOpened();
      expect(sent.slice(0, 4)).toEqual([
        "POST /api/ai/build",
        "POST /api/decks",
        "POST /api/ai/build",
        "POST /api/decks",
      ]);
      expect(buildBodies).toHaveLength(2);
    });

    it("currently opens the deck without its commander, and creates no second deck, when the command zone cannot be saved (pinned; follow-up of the wizard-save-retry PR)", async () => {
      server.use(
        http.patch("/api/decks/:id/command-zone", () =>
          HttpResponse.json({ error: "Database unavailable" }, { status: 500 })
        )
      );

      await generateDeck();

      await waitForDeckOpened();
      expect(sent.filter((line) => line === "POST /api/decks")).toHaveLength(1);
      expect(useDeckStore.getState().decks[DECK_ID]?.commander).toBeNull();
      expect(storedDeckCards()).toHaveLength(STREAMED_CARDS.length);
      expect(
        screen.queryByRole("button", { name: TRY_SAVING_AGAIN })
      ).toBeNull();
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
      // Only the commander was saved, through the command-zone route.
      expect(
        sent.filter((line) => line.startsWith("PATCH /api/decks"))
      ).toEqual(["PATCH /api/decks/deck-ai-1/command-zone"]);
      expect(
        sent.filter((line) => line === "POST /api/decks/deck-ai-1/cards")
      ).toHaveLength(0);
      expect(logger.error).toHaveBeenCalledWith(
        "Batch import error",
        "DeckWizard",
        expect.any(Error)
      );
      expect(screen.queryByText("Build was cancelled or failed.")).toBeNull();
      expect(screen.queryByText(BUILD_FAILED)).toBeNull();
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
