// @vitest-environment node
/**
 * The Scryfall `CardSource` adapter and a run over it, against MSW serving the recorded index
 * and the recorded excerpts gzipped, as data.scryfall.io serves them (`content-type:
 * application/gzip`, checked 2026-11-20). Covers the request rules of I-67 8.1 and 8.2, and runs
 * the shared `CardSource` contract.
 *
 * @module card-data/scryfall-card-source.test
 */
import { gzipSync } from "node:zlib";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { USER_AGENT } from "@/lib/http";
import { DEFAULT_SCRYFALL_API } from "@/lib/scryfall/api-base-url";
import {
  RATE_LIMIT_BLOCK_MS,
  scheduleScryfallRequest,
} from "@/lib/scryfall/request-queue";
import { setupMsw } from "@/test/msw";
import {
  BULK_FILE_TYPES,
  type BulkFileDescriptor,
  type BulkFileType,
} from "./bulk-file";
import { readBulkRun } from "./read-bulk-run";
import {
  createScryfallCardSource,
  RATE_LIMIT_PAUSE_MS,
} from "./scryfall-card-source";
import { CARD_SOURCE_CONTRACT_CASES } from "./testing/card-source-contract";
import {
  recordedBulkIndexText,
  recordedBulkText,
  recordedDescriptors,
} from "./testing/recorded-bulk-files";

const INDEX_URL = `${DEFAULT_SCRYFALL_API}/bulk-data`;

/** The recorded descriptor of one file. */
function descriptorOf(type: BulkFileType): BulkFileDescriptor {
  const descriptor = recordedDescriptors().find((file) => file.type === type);
  if (descriptor === undefined) throw new Error(`no recorded ${type}`);
  return descriptor;
}

/** The download URI of each recorded file. */
function uriOf(type: BulkFileType): string {
  return descriptorOf(type).downloadUri;
}

/** The requests MSW answered in this test, with the headers I-67 8.1 requires. */
const sent: {
  readonly url: string;
  readonly userAgent: string | null;
  readonly accept: string | null;
}[] = [];

/** Records `request` and answers with `answer`. */
function recording(answer: () => Response) {
  return ({ request }: { readonly request: Request }) => {
    sent.push({
      url: request.url,
      userAgent: request.headers.get("user-agent"),
      accept: request.headers.get("accept"),
    });
    return answer();
  };
}

/** A recorded excerpt, gzipped and typed as data.scryfall.io types its files. */
function gzippedExcerpt(type: BulkFileType): Response {
  return new HttpResponse(new Uint8Array(gzipSync(recordedBulkText(type))), {
    headers: { "content-type": "application/gzip" },
  });
}

const server = setupMsw(
  http.get(
    INDEX_URL,
    recording(
      () =>
        new HttpResponse(recordedBulkIndexText(), {
          headers: { "content-type": "application/json" },
        })
    )
  ),
  ...BULK_FILE_TYPES.map((type) =>
    http.get(
      uriOf(type),
      recording(() => gzippedExcerpt(type))
    )
  )
);

beforeEach(() => {
  sent.length = 0;
});

/** A clock a test sets by hand. */
function manualClock(start: number) {
  let now = start;
  return { now: () => now, set: (time: number) => void (now = time) };
}

describe("the Scryfall card source", () => {
  it("a 429 stops the run for 30 seconds", async () => {
    server.use(
      http.get(
        uriOf("oracle_cards"),
        recording(() => new HttpResponse(null, { status: 429 }))
      )
    );
    const clock = manualClock(1_000_000);
    const source = createScryfallCardSource({ clock });
    const retryAt = 1_000_000 + RATE_LIMIT_PAUSE_MS;

    const run = await readBulkRun({
      source,
      lastRuns: new Map(),
      onObject: () => undefined,
    });

    expect(run).toMatchObject({
      status: "read",
      files: [
        {
          type: "oracle_cards",
          status: "failed",
          reason: { kind: "rate_limited", retryAt },
        },
        {
          type: "default_cards",
          status: "skipped",
          reason: { kind: "rate_limited", retryAt },
        },
        {
          type: "rulings",
          status: "skipped",
          reason: { kind: "rate_limited", retryAt },
        },
      ],
    });
    expect(sent.map((request) => request.url)).toEqual([
      INDEX_URL,
      uriOf("oracle_cards"),
    ]);

    clock.set(retryAt - 1);
    expect(await source.listBulkFiles()).toEqual({
      status: "failed",
      reason: { kind: "rate_limited", retryAt },
    });
    expect(sent).toHaveLength(2);

    clock.set(retryAt);
    expect(await source.listBulkFiles()).toMatchObject({ status: "listed" });
    expect(sent).toHaveLength(3);
  });

  it("a 429 on the index fails the run before any file is asked for", async () => {
    server.use(
      http.get(
        INDEX_URL,
        recording(() => new HttpResponse(null, { status: 429 }))
      )
    );
    const source = createScryfallCardSource({ clock: manualClock(0) });

    const run = await readBulkRun({
      source,
      lastRuns: new Map(),
      onObject: () => undefined,
    });

    expect(run).toEqual({
      status: "failed",
      reason: { kind: "rate_limited", retryAt: RATE_LIMIT_PAUSE_MS },
    });
    expect(sent).toHaveLength(1);
  });

  it("a 429 block in the runtime's Scryfall queue fails the listing without sending it", async () => {
    vi.useFakeTimers({ toFake: ["Date"], now: 2_000_000 });
    try {
      // Another caller of the runtime's queue, a cache fill say, was answered 429.
      await scheduleScryfallRequest(
        `${DEFAULT_SCRYFALL_API}/cards/search?q=sol`,
        async () => new Response(null, { status: 429 })
      );
      const source = createScryfallCardSource({ clock: manualClock(0) });

      expect(await source.listBulkFiles()).toEqual({
        status: "failed",
        reason: {
          kind: "rate_limited",
          retryAt: 2_000_000 + RATE_LIMIT_BLOCK_MS,
        },
      });
      expect(sent).toEqual([]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("sends the app's User-Agent and an Accept header on every request", async () => {
    const source = createScryfallCardSource({ clock: manualClock(0) });

    await readBulkRun({
      source,
      lastRuns: new Map(),
      onObject: () => undefined,
    });

    expect(sent).toHaveLength(4);
    for (const request of sent) {
      expect(request.userAgent).toBe(USER_AGENT);
      expect(request.accept).toMatch(/^application\//);
    }
  });

  it("fails only the file Scryfall answers with an error, and reads the others", async () => {
    server.use(
      http.get(
        uriOf("default_cards"),
        recording(() => new HttpResponse(null, { status: 503 }))
      )
    );
    const source = createScryfallCardSource({ clock: manualClock(0) });

    const run = await readBulkRun({
      source,
      lastRuns: new Map(),
      onObject: () => undefined,
    });

    expect(run).toMatchObject({
      status: "read",
      files: [
        { type: "oracle_cards", status: "loaded" },
        {
          type: "default_cards",
          status: "failed",
          reason: { kind: "http_status", status: 503 },
        },
        { type: "rulings", status: "loaded" },
      ],
    });
  });

  it("reads a file served already decompressed as plain text", async () => {
    server.use(
      http.get(
        uriOf("rulings"),
        recording(
          () =>
            new HttpResponse(recordedBulkText("rulings"), {
              headers: { "content-type": "application/jsonl" },
            })
        )
      )
    );
    const source = createScryfallCardSource({ clock: manualClock(0) });
    const report = await source.readBulkFile({
      descriptor: descriptorOf("rulings"),
      lastRun: null,
      onObject: () => undefined,
    });

    expect(report).toMatchObject({ status: "loaded", objects: 30 });
  });

  it("reports an index it cannot read as invalid", async () => {
    server.use(
      http.get(
        INDEX_URL,
        recording(() => HttpResponse.json({ object: "error" }))
      )
    );
    const source = createScryfallCardSource({ clock: manualClock(0) });

    expect(await source.listBulkFiles()).toMatchObject({
      status: "failed",
      reason: { kind: "invalid_index" },
    });
  });

  it("reports a request that never got an answer as a network failure", async () => {
    server.use(http.get(INDEX_URL, () => HttpResponse.error()));
    const source = createScryfallCardSource({ clock: manualClock(0) });

    expect(await source.listBulkFiles()).toEqual({
      status: "failed",
      reason: { kind: "network" },
    });
  });
});

describe("the Scryfall card source honours the CardSource contract", () => {
  it.each(CARD_SOURCE_CONTRACT_CASES)("$name", async ({ run }) => {
    await expect(
      run(createScryfallCardSource({ clock: manualClock(0) }))
    ).resolves.toBeUndefined();
  });
});
