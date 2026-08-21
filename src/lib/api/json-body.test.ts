import { describe, it, expect } from "vitest";
import { readJsonBody, readRecord } from "./json-body";

/**
 * The distinction this helper exists to preserve: a body the server could not
 * parse is the client's problem (400), not the server's (500).
 *
 * The case that motivated it is not a malicious payload but an ordinary one —
 * a request stream truncated because the page navigated away mid-flight. That
 * happens during normal teardown, and it was producing 500s and error logs
 * that looked exactly like a real incident.
 */

const bodyOf = (raw: string): Request =>
  new Request("http://localhost/api/test", { method: "POST", body: raw });

describe("readJsonBody", () => {
  it("returns the parsed value for valid JSON", async () => {
    const result = await readJsonBody(bodyOf('{"name":"Atraxa","quantity":1}'));

    expect(result.ok).toBe(true);
    expect(result.ok && result.value).toEqual({ name: "Atraxa", quantity: 1 });
  });

  it("answers 400, not 500, for a truncated body", async () => {
    const result = await readJsonBody(bodyOf('{"name":"Atra'));

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.response.status).toBe(400);
  });

  it("answers 400 for an empty body", async () => {
    const result = await readJsonBody(bodyOf(""));

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.response.status).toBe(400);
  });

  it("answers 400 for a body that is not JSON at all", async () => {
    const result = await readJsonBody(bodyOf("<html>nope</html>"));

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.response.status).toBe(400);
  });

  it("names the problem in the response", async () => {
    const result = await readJsonBody(bodyOf("{"));
    const payload = result.ok === false ? await result.response.json() : null;

    expect(payload).toEqual({ error: "Malformed request body" });
  });

  it("accepts a valid JSON value that is not an object", async () => {
    const result = await readJsonBody(bodyOf("[1,2,3]"));

    expect(result.ok && result.value).toEqual([1, 2, 3]);
  });
});

describe("readRecord", () => {
  it("exposes the properties of an object body", () => {
    expect(readRecord({ name: "Atraxa" })).toEqual({ name: "Atraxa" });
  });

  it("gives an empty record for a body that is not an object", () => {
    expect(readRecord(null)).toEqual({});
    expect(readRecord("Atraxa")).toEqual({});
    expect(readRecord(7)).toEqual({});
    expect(readRecord(undefined)).toEqual({});
  });

  it("treats an array as no record, so index access cannot pass for a field", () => {
    expect(readRecord([1, 2, 3])).toEqual({});
  });
});
