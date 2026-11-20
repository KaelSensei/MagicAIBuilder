import type {
  Breadcrumb,
  ErrorEvent,
  Event,
  ReplayFrameEvent,
} from "@sentry/nextjs";
import { describe, expect, it } from "vitest";
import {
  SENTRY_URL_SCRUBBING,
  scrubReplayEvent,
  scrubReplayRecordingEvent,
  type TransactionEvent,
} from "./sentry-url-scrubbing";

const ORIGIN = "https://magicaibuilder.app";

describe("Sentry URL scrubbing", () => {
  it("an error on a share page reaches Sentry with every URL scrubbed", () => {
    const event: ErrorEvent = {
      type: undefined,
      transaction: "/share/abc123",
      request: {
        url: `${ORIGIN}/share/abc123?x=1`,
        query_string: "x=1",
        headers: { Referer: `${ORIGIN}/u/kael?tab=decks` },
      },
      breadcrumbs: [
        {
          category: "navigation",
          data: { from: "/u/kael", to: "/share/abc123?x=1" },
        },
        {
          category: "fetch",
          data: { method: "GET", url: "/api/share/abc123?include=cards" },
        },
      ],
    };

    const sent = SENTRY_URL_SCRUBBING.beforeSend(event);

    expect(sent.request).toEqual({
      url: `${ORIGIN}/share/[token]`,
      query_string: undefined,
      headers: { Referer: `${ORIGIN}/u/[username]` },
    });
    expect(sent.transaction).toBe("/share/[token]");
    expect(sent.breadcrumbs).toEqual([
      {
        category: "navigation",
        data: { from: "/u/[username]", to: "/share/[token]" },
      },
      {
        category: "fetch",
        data: { method: "GET", url: "/api/share/[token]" },
      },
    ]);
  });

  it("a transaction on a share page reaches Sentry with its name, spans and trace data scrubbed", () => {
    const event: TransactionEvent = {
      type: "transaction",
      transaction: "GET /fr/share/abc123",
      contexts: {
        trace: {
          trace_id: "t",
          span_id: "s",
          op: "http.server",
          data: {
            "http.url": `${ORIGIN}/fr/share/abc123?x=1`,
            "http.query": "?x=1",
          },
        },
      },
      spans: [
        {
          span_id: "c",
          trace_id: "t",
          start_timestamp: 0,
          op: "http.client",
          description: "GET /api/users/kael?x=1",
          data: { url: "/api/users/kael?x=1", "http.fragment": "#top" },
        },
      ],
    };

    const sent = SENTRY_URL_SCRUBBING.beforeSendTransaction(event);

    expect(sent.transaction).toBe("GET /fr/share/[token]");
    expect(sent.contexts?.trace?.data).toEqual({
      "http.url": `${ORIGIN}/fr/share/[token]`,
    });
    expect(sent.spans?.[0]).toMatchObject({
      description: "GET /api/users/[username]",
      data: { url: "/api/users/[username]" },
    });
    expect(sent.spans?.[0]?.data).not.toHaveProperty("http.fragment");
  });

  it("a span that is not a request keeps its description", () => {
    const event: TransactionEvent = {
      type: "transaction",
      transaction: "/decks",
      spans: [
        {
          span_id: "c",
          trace_id: "t",
          start_timestamp: 0,
          op: "db",
          description: "SELECT * FROM deck WHERE id = ?",
          data: {},
        },
      ],
    };

    const sent = SENTRY_URL_SCRUBBING.beforeSendTransaction(event);

    expect(sent.spans?.[0]?.description).toBe(
      "SELECT * FROM deck WHERE id = ?"
    );
  });

  it("a breadcrumb keeps its other data and loses the username in its URL", () => {
    const breadcrumb: Breadcrumb = {
      category: "xhr",
      message: "follow",
      data: {
        method: "POST",
        status_code: 200,
        url: "/api/community/users/kael/follow",
      },
    };

    expect(SENTRY_URL_SCRUBBING.beforeBreadcrumb(breadcrumb)).toEqual({
      category: "xhr",
      message: "follow",
      data: {
        method: "POST",
        status_code: 200,
        url: "/api/community/users/[username]/follow",
      },
    });
  });
});

describe("Session Replay URL scrubbing", () => {
  it("a navigation recorded in a replay loses the token of both pages", () => {
    const recorded: ReplayFrameEvent = {
      type: 5,
      timestamp: 0,
      data: {
        tag: "performanceSpan",
        payload: {
          op: "navigation.push",
          description: `${ORIGIN}/share/abc123?x=1`,
          startTimestamp: 0,
          endTimestamp: 0,
          data: { previous: `${ORIGIN}/u/kael` },
        },
      },
    };

    expect(scrubReplayRecordingEvent(recorded)).toEqual({
      ...recorded,
      data: {
        tag: "performanceSpan",
        payload: {
          op: "navigation.push",
          description: `${ORIGIN}/share/[token]`,
          startTimestamp: 0,
          endTimestamp: 0,
          data: { previous: `${ORIGIN}/u/[username]` },
        },
      },
    });
  });

  it("a slow click recorded in a replay loses the token of its page", () => {
    const recorded: ReplayFrameEvent = {
      type: 5,
      timestamp: 0,
      data: {
        tag: "breadcrumb",
        payload: {
          category: "ui.slowClickDetected",
          timestamp: 0,
          type: "default",
          data: { url: `${ORIGIN}/share/abc123#cards` },
        },
      },
    };

    expect(scrubReplayRecordingEvent(recorded).data.payload).toMatchObject({
      data: { url: `${ORIGIN}/share/[token]` },
    });
  });

  it("the page list of a replay loses tokens and query strings", () => {
    const replay: Event = {
      type: "replay_event",
      request: { url: `${ORIGIN}/share/abc123?x=1` },
    };
    const withUrls = {
      ...replay,
      urls: [`${ORIGIN}/share/abc123?x=1`, `${ORIGIN}/decks?sort=name`],
    };

    expect(scrubReplayEvent(withUrls)).toMatchObject({
      request: { url: `${ORIGIN}/share/[token]` },
      urls: [`${ORIGIN}/share/[token]`, `${ORIGIN}/decks`],
    });
  });

  it("an error or a transaction passes the replay processor unchanged", () => {
    const event: Event = { transaction: "/share/abc123" };

    expect(scrubReplayEvent(event)).toBe(event);
  });
});
