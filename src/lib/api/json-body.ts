import { NextResponse } from "next/server";

/**
 * Reads a JSON request body without letting a bad one look like a server fault.
 *
 * Every route in this app called `await request.json()` inside the same `try`
 * that catches to a 500. `request.json()` throws on a body that is not JSON —
 * including one truncated by a client that navigated away mid-flight, which is
 * routine during page teardown. So a disconnect produced
 * `Unexpected end of JSON input`, a 500 and an error log indistinguishable
 * from a genuine failure. Nothing broke; the logs just stopped being able to
 * tell an incident from a closed tab.
 *
 * The `catch` here is not the swallowed-read shape it resembles. It returns an
 * explicit failure the caller must handle — `ok: false` carries the response
 * and the call site cannot ignore it — rather than an empty value that renders
 * as success.
 *
 * Nothing is logged. A malformed body is the client's mistake, answered by the
 * 400 it gets; logging it would reintroduce the noise this removes.
 */
export type JsonBody =
  | { readonly ok: true; readonly value: unknown }
  | { readonly ok: false; readonly response: NextResponse };

/**
 * @param request Incoming request whose body should be JSON.
 * @returns The parsed value, or a 400 response to return unchanged.
 */
export async function readJsonBody(request: Request): Promise<JsonBody> {
  try {
    return { ok: true, value: await request.json() };
  } catch {
    return malformedBody();
  }
}

/**
 * Reads a JSON request body that the client may leave out.
 *
 * An empty body reads as `undefined` rather than the 400 `readJsonBody`
 * answers, so a route that gains an optional body keeps answering the clients
 * that send none. A body that is sent must still be JSON.
 *
 * @param request Incoming request whose body, when it has one, should be JSON.
 * @returns The parsed value, `undefined` for an empty body, or a 400 response
 *   to return unchanged.
 */
export async function readOptionalJsonBody(
  request: Request
): Promise<JsonBody> {
  try {
    const text = await request.text();
    if (text === "") return { ok: true, value: undefined };
    const value: unknown = JSON.parse(text);
    return { ok: true, value };
  } catch {
    return malformedBody();
  }
}

/** The 400 both readers answer for a body that is not JSON. */
function malformedBody(): JsonBody {
  return {
    ok: false,
    response: NextResponse.json(
      { error: "Malformed request body" },
      { status: 400 }
    ),
  };
}

/**
 * Narrows a parsed body so its properties can be read.
 *
 * `readJsonBody` returns `unknown`, which is the honest type — `request.json()`
 * returning `any` is what let three routes destructure a body nobody had
 * checked. This keeps the narrowing explicit and in one place; each field still
 * has to be validated by its caller.
 *
 * @param value A parsed JSON value.
 * @returns Its own properties, or an empty record for anything not an object.
 */
export function readRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(Object.entries(value));
}
