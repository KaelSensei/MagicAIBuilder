/**
 * The Scryfall adapter of the `CardSource` port: reads the `/bulk-data` index from the API and
 * streams each file from data.scryfall.io.
 *
 * Request rules (I-67 8.1, 8.2):
 * - every request sends the app's `USER_AGENT` and an `Accept` header, as Scryfall requires
 *   (https://scryfall.com/docs/api, "Required Headers", read 2026-11-10);
 * - a 429 means access is limited for 30 seconds
 *   (https://scryfall.com/docs/api/rate-limits, read 2026-11-10): the source then sends no
 *   request for {@link RATE_LIMIT_PAUSE_MS}, answering each call as rate limited instead;
 * - the index request also waits in the runtime's Scryfall queue, so a 429 block that queue runs
 *   for another caller answers it as rate limited too, until the block ends.
 *
 * The pause lives in the source instance, so the caller keeps one source for the life of the
 * process. Time is read from the injected clock only, except the end of a queue block, which is
 * on the queue's clock.
 *
 * @module card-data/scryfall-card-source
 */
import "server-only";
import { USER_AGENT } from "@/lib/http";
import { scryfallApiBaseUrl } from "@/lib/scryfall/api-base-url";
import {
  ScryfallBlockedError,
  scheduleScryfallRequest,
} from "@/lib/scryfall/request-queue";
import type { BulkFileDescriptor, SourceFailure } from "./bulk-file";
import { parseBulkIndex } from "./bulk-index";
import type { BulkIndexOutcome, CardSource } from "./card-source";
import { readBulkFile, type OpenedBulkBody } from "./read-bulk-file";

/** How long a 429 stops every request, in milliseconds (Scryfall's 30-second limit, I-67 8.2). */
export const RATE_LIMIT_PAUSE_MS = 30_000;

/** The index is a few kilobytes: ten seconds, as `httpGet` allows any outside source. */
const INDEX_TIMEOUT_MS = 10_000;

/**
 * Default Cards is 81 MB compressed (index of 2026-11-20) and parses in about 7 seconds on one
 * core (I-67 2.3); five minutes covers a slow link without letting a stalled one hang a run.
 */
const FILE_TIMEOUT_MS = 300_000;

const INDEX_ACCEPT = "application/json";
const FILE_ACCEPT = "application/gzip, application/jsonl;q=0.9, */*;q=0.8";

/** Media types that mean the body is still gzip, as data.scryfall.io types its files. */
const GZIP_MEDIA_TYPES: ReadonlySet<string> = new Set([
  "application/gzip",
  "application/x-gzip",
]);

/** Media types that say nothing of the bytes, leaving the decision to the index. */
const OPAQUE_MEDIA_TYPES: ReadonlySet<string> = new Set([
  "",
  "application/octet-stream",
]);

/** The time the source reads, so a test can move it by hand. */
export interface SourceClock {
  /** The current time in milliseconds, on the scale of `Date.now()`. */
  readonly now: () => number;
}

/** What the adapter needs. */
export interface ScryfallCardSourceOptions {
  readonly clock: SourceClock;
  /** The API origin; `scryfallApiBaseUrl()` when omitted. */
  readonly apiBaseUrl?: string;
}

/** An answer with a body to read, or why there is none. */
type Answer =
  | { readonly kind: "ok"; readonly response: Response }
  | { readonly kind: "refused"; readonly reason: SourceFailure };

/** One GET to send, with its `Accept` header and timeout. */
interface GetRequest {
  readonly url: string;
  readonly accept: string;
  readonly timeoutMs: number;
}

/**
 * True when the body must be decompressed: the response's media type says gzip, or it says
 * nothing and the index says the file is gzip. A body `fetch` already decoded from a
 * `Content-Encoding` carries its own media type, so it is never decompressed twice.
 */
function isGzipBody(
  response: Response,
  descriptor: BulkFileDescriptor
): boolean {
  const mediaType = (response.headers.get("content-type") ?? "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  if (GZIP_MEDIA_TYPES.has(mediaType)) return true;
  return (
    OPAQUE_MEDIA_TYPES.has(mediaType) && descriptor.contentEncoding === "gzip"
  );
}

/** Reads the index body; an unparsable one is an invalid index. */
async function toIndexOutcome(response: Response): Promise<BulkIndexOutcome> {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return {
      status: "failed",
      reason: { kind: "invalid_index", detail: "the body is not JSON" },
    };
  }
  const index = parseBulkIndex(body);
  return index.kind === "parsed"
    ? { status: "listed", files: index.files }
    : {
        status: "failed",
        reason: { kind: "invalid_index", detail: index.detail },
      };
}

/**
 * The runtime queue's refusal during a 429 block, answered as the rate-limited
 * refusal the source gives for its own 429; any other failure is rethrown.
 */
function refusedDuringBlock(error: unknown): Answer {
  if (!(error instanceof ScryfallBlockedError)) throw error;
  return {
    kind: "refused",
    reason: { kind: "rate_limited", retryAt: error.blockedUntil },
  };
}

/**
 * Builds the Scryfall card source.
 *
 * @param options - the clock, and the API origin when not the configured one
 */
export function createScryfallCardSource(
  options: ScryfallCardSourceOptions
): CardSource {
  const { clock } = options;
  const apiBaseUrl = options.apiBaseUrl ?? scryfallApiBaseUrl();
  let pausedUntil = Number.NEGATIVE_INFINITY;

  /** Sends one GET unless a 429 paused the source; a 429 starts the pause. */
  async function get({ url, accept, timeoutMs }: GetRequest): Promise<Answer> {
    if (clock.now() < pausedUntil) {
      return {
        kind: "refused",
        reason: { kind: "rate_limited", retryAt: pausedUntil },
      };
    }
    let response: Response;
    try {
      response = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Accept: accept },
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch {
      return { kind: "refused", reason: { kind: "network" } };
    }
    if (response.ok) return { kind: "ok", response };
    await response.body?.cancel().catch(() => undefined);
    if (response.status !== 429) {
      return {
        kind: "refused",
        reason: { kind: "http_status", status: response.status },
      };
    }
    pausedUntil = clock.now() + RATE_LIMIT_PAUSE_MS;
    return {
      kind: "refused",
      reason: { kind: "rate_limited", retryAt: pausedUntil },
    };
  }

  async function listBulkFiles(): Promise<BulkIndexOutcome> {
    const url = `${apiBaseUrl}/bulk-data`;
    const answer = await scheduleScryfallRequest(url, () =>
      get({ url, accept: INDEX_ACCEPT, timeoutMs: INDEX_TIMEOUT_MS })
    ).catch(refusedDuringBlock);
    if (answer.kind === "refused")
      return { status: "failed", reason: answer.reason };
    return toIndexOutcome(answer.response);
  }

  /** Opens a file's body; data.scryfall.io is not the API, so it skips the API's queue. */
  async function openFile(
    descriptor: BulkFileDescriptor
  ): Promise<OpenedBulkBody> {
    const answer = await get({
      url: descriptor.downloadUri,
      accept: FILE_ACCEPT,
      timeoutMs: FILE_TIMEOUT_MS,
    });
    if (answer.kind === "refused") return answer;
    const { body } = answer.response;
    if (body === null) return { kind: "refused", reason: { kind: "network" } };
    return {
      kind: "opened",
      body,
      gzip: isGzipBody(answer.response, descriptor),
    };
  }

  return {
    listBulkFiles,
    readBulkFile: (request) =>
      readBulkFile({ ...request, open: () => openFile(request.descriptor) }),
  };
}
