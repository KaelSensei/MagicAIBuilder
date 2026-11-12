/**
 * The Scryfall stand-in of the E2E stack: an HTTP server that answers
 * Scryfall's card endpoints from the recorded fixtures, through the MSW
 * handlers of `src/test/scryfall-stand-in.ts`.
 *
 * `docker-compose.e2e.yml` runs it as the `scryfall` service and points the
 * app's server at it with `SCRYFALL_API_BASE_URL=http://scryfall:8787`; the
 * `scryfallStandIn` fixture of `fixtures.ts` forwards the browser's Scryfall
 * requests to the same address. Every request is logged with its status, so
 * the compose log shows what the suite asked Scryfall; a request no handler
 * serves is answered 404 with a body that says so.
 *
 * Run with `pnpm exec tsx e2e/scryfall-stand-in.ts`.
 *
 * @module e2e/scryfall-stand-in
 */
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { answerScryfallRequest } from "@/test/scryfall-stand-in";

/** Fixed: the compose file and the health check name it. */
const PORT = 8787;

/** The compose health check asks this path. */
const HEALTH_PATH = "/health";

/** The incoming message as a Fetch `Request`, which the MSW handlers read. */
async function toRequest(incoming: IncomingMessage): Promise<Request> {
  const chunks: Buffer[] = [];
  for await (const chunk of incoming) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  const method = incoming.method ?? "GET";
  const headers = new Headers();
  for (const [name, value] of Object.entries(incoming.headers)) {
    if (typeof value === "string") headers.set(name, value);
  }
  const hasBody = method !== "GET" && method !== "HEAD";
  return new Request(
    `http://${headers.get("host") ?? "scryfall"}${incoming.url ?? "/"}`,
    {
      method,
      headers,
      body: hasBody ? Buffer.concat(chunks) : undefined,
    }
  );
}

async function send(
  response: Response,
  outgoing: ServerResponse
): Promise<void> {
  const body = Buffer.from(await response.arrayBuffer());
  outgoing.writeHead(response.status, {
    "content-type": response.headers.get("content-type") ?? "application/json",
    "content-length": body.byteLength,
  });
  outgoing.end(body);
}

async function serve(
  incoming: IncomingMessage,
  outgoing: ServerResponse
): Promise<void> {
  if (incoming.url === HEALTH_PATH) {
    outgoing.writeHead(204).end();
    return;
  }
  const request = await toRequest(incoming);
  const response = await answerScryfallRequest(request);
  const { pathname } = new URL(request.url);
  console.log(`${request.method} ${pathname} -> ${response.status}`);
  await send(response, outgoing);
}

createServer((incoming, outgoing) => {
  serve(incoming, outgoing).catch((error: unknown) => {
    console.error(
      `scryfall stand-in: ${error instanceof Error ? error.message : String(error)}`
    );
    outgoing.writeHead(500).end();
  });
}).listen(PORT, () => {
  console.log(`Scryfall stand-in listening on http://0.0.0.0:${PORT}`);
});
