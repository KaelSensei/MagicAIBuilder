import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useApiKeys, type ApiKeySummary } from "./useApiKeys";

/**
 * The hook that mints and revokes API credentials.
 *
 * The property worth guarding hardest is that **a freshly minted token is not
 * lost**. It exists exactly once, in the response that created it, and nothing
 * — not a failed refetch, not a later list reload — may drop it before the user
 * has seen it.
 */

function keyRow(overrides: Partial<ApiKeySummary> = {}): ApiKeySummary {
  return {
    id: "key-1",
    name: "CLI on my laptop",
    displayPrefix: "mab_AbCdEfGh",
    scopes: ["decks:read"],
    revokedAt: null,
    expiresAt: null,
    lastUsedAt: null,
    createdAt: "2026-08-22T12:00:00.000Z",
    ...overrides,
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** The list request the hook fires on mount and after every mutation. */
function listOk(keys: ApiKeySummary[] = []) {
  return jsonResponse({ keys });
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(listOk()));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function mounted(initial: ApiKeySummary[] = []) {
  vi.mocked(globalThis.fetch).mockResolvedValueOnce(listOk(initial));
  const view = renderHook(() => useApiKeys());
  await waitFor(() => expect(view.result.current.isLoading).toBe(false));
  return view;
}

describe("useApiKeys — listing", () => {
  it("loads the keys on mount", async () => {
    const { result } = await mounted([keyRow()]);
    expect(globalThis.fetch).toHaveBeenCalledWith("/api/user/api-keys");
    expect(result.current.keys).toEqual([keyRow()]);
    expect(result.current.error).toBeNull();
  });

  it("starts in a loading state so the list is never briefly reported empty", async () => {
    const { result } = renderHook(() => useApiKeys());
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("surfaces the server's message when the listing fails", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      jsonResponse({ error: "Could not list API keys" }, 500)
    );
    const { result } = renderHook(() => useApiKeys());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe("Could not list API keys");
    expect(result.current.keys).toEqual([]);
  });

  it("falls back to the status code when the error body is not JSON", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response("<html>502</html>", { status: 502 })
    );
    const { result } = renderHook(() => useApiKeys());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe("HTTP 502");
  });
});

describe("useApiKeys — creating", () => {
  it("posts the requested name, scopes and expiry as JSON", async () => {
    const { result } = await mounted();
    vi.mocked(globalThis.fetch)
      .mockResolvedValueOnce(jsonResponse({ key: keyRow(), token: "mab_secret" }, 201))
      .mockResolvedValueOnce(listOk([keyRow()]));

    await act(async () => {
      await result.current.createKey({
        name: "CLI",
        scopes: ["decks:read"],
        expiresInDays: 30,
      });
    });

    const [url, init] = vi.mocked(globalThis.fetch).mock.calls[1];
    expect(url).toBe("/api/user/api-keys");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({
      name: "CLI",
      scopes: ["decks:read"],
      expiresInDays: 30,
    });
  });

  it("exposes the token once and reloads the list", async () => {
    const { result } = await mounted();
    vi.mocked(globalThis.fetch)
      .mockResolvedValueOnce(jsonResponse({ key: keyRow(), token: "mab_secret" }, 201))
      .mockResolvedValueOnce(listOk([keyRow()]));

    let created = false;
    await act(async () => {
      created = await result.current.createKey({ name: "CLI" });
    });

    expect(created).toBe(true);
    expect(result.current.freshToken).toBe("mab_secret");
    expect(result.current.keys).toEqual([keyRow()]);
  });

  it("keeps the token even when the follow-up listing fails", async () => {
    // The token cannot be recovered from anywhere. Losing it to a network blip
    // on a refetch would force the user to mint a second key and revoke the
    // first — so it is set before the refetch, and this is the guard for that.
    const { result } = await mounted();
    vi.mocked(globalThis.fetch)
      .mockResolvedValueOnce(jsonResponse({ key: keyRow(), token: "mab_secret" }, 201))
      .mockRejectedValueOnce(new Error("network down"));

    await act(async () => {
      await result.current.createKey({ name: "CLI" });
    });

    expect(result.current.freshToken).toBe("mab_secret");
    expect(result.current.error).toBe("network down");
  });

  it("reports failure and shows no token when the server refuses", async () => {
    const { result } = await mounted();
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      jsonResponse({ error: "At most 20 active keys. Revoke one first." }, 409)
    );

    let created = true;
    await act(async () => {
      created = await result.current.createKey({ name: "one too many" });
    });

    expect(created).toBe(false);
    expect(result.current.freshToken).toBeNull();
    expect(result.current.error).toBe("At most 20 active keys. Revoke one first.");
  });

  it("treats a 201 with no token as a failure rather than a silent success", async () => {
    // A created key whose token never reached the browser is dead on arrival;
    // reporting success would leave the user with an unusable credential.
    const { result } = await mounted();
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      jsonResponse({ key: keyRow() }, 201)
    );

    let created = true;
    await act(async () => {
      created = await result.current.createKey({ name: "CLI" });
    });

    expect(created).toBe(false);
    expect(result.current.freshToken).toBeNull();
    expect(result.current.error).toBe("The server did not return a token");
  });

  it("clears the token only when the user dismisses it", async () => {
    const { result } = await mounted();
    vi.mocked(globalThis.fetch)
      .mockResolvedValueOnce(jsonResponse({ key: keyRow(), token: "mab_secret" }, 201))
      .mockResolvedValueOnce(listOk([keyRow()]));

    await act(async () => {
      await result.current.createKey({ name: "CLI" });
    });
    expect(result.current.freshToken).toBe("mab_secret");

    act(() => result.current.dismissFreshToken());
    expect(result.current.freshToken).toBeNull();
  });
});

describe("useApiKeys — revoking", () => {
  it("sends DELETE to the key's own URL and reloads", async () => {
    const { result } = await mounted([keyRow()]);
    vi.mocked(globalThis.fetch)
      .mockResolvedValueOnce(jsonResponse({ revoked: true }))
      .mockResolvedValueOnce(listOk([keyRow({ revokedAt: "2026-08-22T13:00:00.000Z" })]));

    let revoked = false;
    await act(async () => {
      revoked = await result.current.revokeKey("key-1");
    });

    const [url, init] = vi.mocked(globalThis.fetch).mock.calls[1];
    expect(url).toBe("/api/user/api-keys/key-1");
    expect(init?.method).toBe("DELETE");
    expect(revoked).toBe(true);
    expect(result.current.keys[0].revokedAt).toBe("2026-08-22T13:00:00.000Z");
  });

  it("encodes the id, so a hostile id cannot reshape the URL", async () => {
    const { result } = await mounted();
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(jsonResponse({ revoked: true }));

    await act(async () => {
      await result.current.revokeKey("../../admin");
    });

    expect(vi.mocked(globalThis.fetch).mock.calls[1][0]).toBe(
      "/api/user/api-keys/..%2F..%2Fadmin"
    );
  });

  it("reports a refusal without dropping the list it already has", async () => {
    const { result } = await mounted([keyRow()]);
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      jsonResponse({ error: "API key not found" }, 404)
    );

    let revoked = true;
    await act(async () => {
      revoked = await result.current.revokeKey("someone-elses-key");
    });

    expect(revoked).toBe(false);
    expect(result.current.error).toBe("API key not found");
    expect(result.current.keys).toEqual([keyRow()]);
  });
});
