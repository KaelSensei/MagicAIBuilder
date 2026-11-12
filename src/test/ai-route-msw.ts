/**
 * MSW handlers and stream readers for the AI route suites: a model provider
 * that records what each route sent, Scryfall's collection endpoint answering
 * from fixture card data, and the NDJSON events a route streams back.
 *
 * Test support for `src/app/api/ai/**`. The routes reach a provider through
 * `lib/ai/metered-model.ts` and Scryfall through `lib/scryfall/client.ts`, so
 * serving both at the HTTP boundary lets the whole route run (ADR 0005,
 * rule 4; docs/engineering/tdd-with-ai.md, "Network in tests").
 *
 * Not responsible for the provider URLs: `metered-model.test.ts` requires
 * `metered-model.ts` to be the only source file that names a provider
 * endpoint, and this file is a source file, so each suite passes the URL it
 * serves.
 *
 * @module test/ai-route-msw
 */
import { vi } from "vitest";
import { http, type HttpHandler } from "msw";
import { z } from "zod";
import {
  buildScryfallNameIndex,
  normalizeImportedName,
} from "@/lib/scryfall/name-index";
import type { ScryfallCard } from "@/lib/scryfall/types";

/** Scryfall's collection endpoint, which resolves suggestion evidence and checks built decks. */
export const SCRYFALL_COLLECTION_URL =
  "https://api.scryfall.com/cards/collection";

/** The body both providers receive: one user message, a model and an output cap. */
const PROVIDER_REQUEST = z.object({
  model: z.string(),
  max_tokens: z.number(),
  messages: z
    .array(z.object({ role: z.literal("user"), content: z.string() }))
    .length(1),
});

const COLLECTION_REQUEST = z.object({
  identifiers: z.array(z.object({ name: z.string() })),
});

/** One request a route sent to a model provider, as the provider received it. */
export interface SentModelRequest {
  readonly url: string;
  /** The credential sent: Anthropic's `x-api-key`, or OpenAI's `Authorization` header. */
  readonly credential: string | null;
  readonly model: string;
  readonly maxTokens: number;
  /** The single user message, which is the whole prompt. */
  readonly prompt: string;
}

/**
 * Serves a model provider's endpoint: records each request in `sent`, then
 * answers with `answer`.
 *
 * A body that is not the one-message request both routes send fails the
 * parse, and the test with it.
 *
 * @param url - the provider endpoint, from the calling suite
 * @param sent - the suite's log; the suite empties it between tests
 * @param answer - the provider's response to every request
 * @returns the handler, for `useMsw` or `server.use`
 */
export function modelProviderServes(
  url: string,
  sent: SentModelRequest[],
  answer: () => Response | Promise<Response>
): HttpHandler {
  return http.post(url, async ({ request }) => {
    const body = PROVIDER_REQUEST.parse(await request.json());
    sent.push({
      url,
      credential:
        request.headers.get("x-api-key") ??
        request.headers.get("authorization"),
      model: body.model,
      maxTokens: body.max_tokens,
      prompt: body.messages[0]?.content ?? "",
    });
    return answer();
  });
}

/**
 * Serves Scryfall's collection endpoint from `cards`, as Scryfall answers:
 * every identifier it knows in `data`, in request order, and the others in
 * `not_found`. Names match the way the app's name index matches them (case,
 * accents and apostrophe style ignored).
 *
 * @param cards - the card data Scryfall "holds" for the test
 * @param asked - when given, receives the names of each request, in order
 * @returns the handler, for `useMsw` or `server.use`
 */
export function scryfallCollectionServes(
  cards: readonly ScryfallCard[],
  asked: string[][] = []
): HttpHandler {
  const index = buildScryfallNameIndex(cards);
  return http.post(SCRYFALL_COLLECTION_URL, async ({ request }) => {
    const { identifiers } = COLLECTION_REQUEST.parse(await request.json());
    asked.push(identifiers.map(({ name }) => name));
    const data = identifiers.flatMap(({ name }) => {
      const card = index.get(normalizeImportedName(name));
      return card ? [card] : [];
    });
    const notFound = identifiers.filter(
      ({ name }) => !index.has(normalizeImportedName(name))
    );
    return Response.json({ object: "list", not_found: notFound, data });
  });
}

/**
 * Reads a route's NDJSON response as the events a client receives, one per
 * line, in order. A line that is not JSON throws, so a malformed stream
 * fails the test.
 *
 * @param response - the route's streamed response
 * @returns every event, parsed
 */
export async function readNdjsonEvents(
  response: Response
): Promise<readonly unknown[]> {
  return (await response.text())
    .split("\n")
    .filter((line) => line !== "")
    .map((line): unknown => JSON.parse(line));
}

/** One streamed event, and when it arrived on Vitest's fake clock. */
export interface TimedEvent {
  /** Milliseconds of fake time since the reading started. */
  readonly at: number;
  readonly event: unknown;
}

/**
 * Reads a route's NDJSON response while it drives Vitest's fake clock, so a
 * delay the route waits between events costs no real time and still shows in
 * each event's `at`.
 *
 * The caller fakes `setTimeout` and `Date` (`vi.useFakeTimers({ toFake:
 * ["setTimeout", "Date"] })`) before it posts the request. Between reads the
 * loop yields one real macrotask, so network work served by MSW completes,
 * then fires the next fake timer. It gives up after five real seconds.
 *
 * @param response - the route's streamed response
 * @returns the raw body, and every event with its arrival time
 */
export async function readNdjsonOnFakeClock(response: Response): Promise<{
  readonly body: string;
  readonly events: readonly TimedEvent[];
}> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("The response has no body to stream.");
  const start = Date.now();
  const decoder = new TextDecoder();
  const events: TimedEvent[] = [];
  let body = "";
  let finished = false;

  const pump = (async () => {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const pending = body.slice(body.lastIndexOf("\n") + 1) + chunk;
      body += chunk;
      for (const line of pending.split("\n").slice(0, -1)) {
        events.push({ at: Date.now() - start, event: JSON.parse(line) });
      }
    }
    finished = true;
  })();

  const deadline = performance.now() + 5_000;
  // The two awaits stay sequential, in a loop (SonarCloud S9382 notwithstanding):
  // each turn first yields a macrotask so the route's pending I/O and `pump`
  // can run, then fires the next fake timer. Running them in parallel, or
  // advancing every timer at once, would fire a pacing timer before the chunk
  // it paces was read, and the recorded arrival times would be wrong.
  while (!finished) {
    if (performance.now() > deadline) {
      throw new Error("The stream did not end within five real seconds.");
    }
    await new Promise<void>((resolve) => setImmediate(resolve));
    await vi.advanceTimersToNextTimerAsync();
  }
  await pump;
  return { body, events };
}
