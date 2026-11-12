// @vitest-environment node
import { NextResponse } from "next/server";
import { describe, expect, it } from "vitest";

import {
  deckWriteResponse,
  readExpectedVersionQuery,
} from "./versioned-deck-write";

/** @returns the answer's status and parsed JSON body */
async function answer(response: Response) {
  return { status: response.status, body: await response.json() };
}

function deleteRequest(query: string): Request {
  return new Request(`http://localhost/api/decks/deck-1/cards${query}`, {
    method: "DELETE",
  });
}

describe("deckWriteResponse", () => {
  it("answers a saved write with the route's own body", async () => {
    const response = deckWriteResponse(
      { kind: "saved", value: 3, version: 8 },
      ({ value, version }) => NextResponse.json({ removed: value, version })
    );

    expect(await answer(response)).toEqual({
      status: 200,
      body: { removed: 3, version: 8 },
    });
  });

  it("answers a stale write with 409 and the bulk edit's message", async () => {
    const response = deckWriteResponse({ kind: "stale" }, () =>
      NextResponse.json({})
    );

    expect(await answer(response)).toEqual({
      status: 409,
      body: {
        error: "The deck changed since it was opened — reload it and try again",
      },
    });
  });

  it("answers a deck deleted after the owner check with 404, as requireDeckOwner does", async () => {
    const response = deckWriteResponse({ kind: "not-found" }, () =>
      NextResponse.json({})
    );

    expect(await answer(response)).toEqual({
      status: 404,
      body: { error: "Deck not found" },
    });
  });
});

describe("readExpectedVersionQuery", () => {
  it("reads no expected version when the query does not name one", () => {
    expect(readExpectedVersionQuery(deleteRequest(""))).toEqual({
      ok: true,
      expectedVersion: undefined,
    });
  });

  it("reads a whole number", () => {
    expect(
      readExpectedVersionQuery(deleteRequest("?expectedVersion=42"))
    ).toEqual({ ok: true, expectedVersion: 42 });
  });

  it("refuses a version past PostgreSQL's INTEGER range with a 400", async () => {
    const query = readExpectedVersionQuery(
      deleteRequest("?expectedVersion=2147483648")
    );

    expect(query.ok).toBe(false);
    if (query.ok) return;
    expect(await answer(query.response)).toMatchObject({
      status: 400,
      body: {
        error: "Invalid request query",
        details: { fieldErrors: { expectedVersion: expect.any(Array) } },
      },
    });
  });
});
