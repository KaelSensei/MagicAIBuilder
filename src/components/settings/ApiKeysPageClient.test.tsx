/**
 * Characterization of the API keys settings page (master plan ID-01; the split
 * in ID-05 must keep every behaviour pinned here).
 *
 * Sociable: the real page, the real `useApiKeys` hook and the real catalogs.
 * MSW stands in for `/api/user/api-keys` with a small in-memory table, so a
 * created or revoked key shows up in the next listing the way the server's
 * would, and the tests assert what the player sees and what the server was
 * asked, not how the page is wired.
 *
 * The token fixture is deliberately not shaped like a real key: the real
 * format is `mab_` plus 32 random bytes in base64url (`lib/api/keys.ts`), and a
 * realistic-looking value in a test log would be mistaken for a leak.
 */
import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import type { ApiKeySummary } from "@/hooks/useApiKeys";
import { setupMsw } from "@/test/msw";
import { renderWithProviders } from "@/test/render";
import { ApiKeysPageClient } from "./ApiKeysPageClient";

const ENDPOINT = "/api/user/api-keys";

/** Obviously fake; never a plausible credential. */
const FIXTURE_TOKEN = "mab_FIXTURE-not-a-real-key-0000000000000000";
const FIXTURE_PREFIX = "mab_FIXTUR";

const REVEAL_HEADING = "Copy this key now — it will not be shown again";

/** What the page posts; mirrors the route's own `createSchema` loosely. */
const createBody = z.object({
  name: z.string(),
  scopes: z.array(z.string()).optional(),
  expiresInDays: z.number().optional(),
});

function aKey(overrides: Partial<ApiKeySummary> = {}): ApiKeySummary {
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

/** The server's table for one test: the listing reads it, create and revoke write it. */
let rows: ApiKeySummary[] = [];
/** Every request body the page posted, in order. */
let posted: z.infer<typeof createBody>[] = [];
/** Every key id the page asked to revoke, in order. */
let revoked: string[] = [];

const server = setupMsw(
  http.get(ENDPOINT, () => HttpResponse.json({ keys: rows })),
  http.post(ENDPOINT, async ({ request }) => {
    const body = createBody.parse(await request.json());
    posted.push(body);
    const created = aKey({
      id: `key-${rows.length + 1}`,
      name: body.name,
      displayPrefix: FIXTURE_PREFIX,
      scopes: body.scopes ?? ["decks:read"],
    });
    rows = [created, ...rows];
    return HttpResponse.json(
      { key: created, token: FIXTURE_TOKEN },
      { status: 201 }
    );
  }),
  http.delete(`${ENDPOINT}/:id`, ({ params }) => {
    const id = String(params.id);
    revoked.push(id);
    rows = rows.map((row) =>
      row.id === id ? { ...row, revokedAt: "2026-08-22T13:00:00.000Z" } : row
    );
    return HttpResponse.json({ revoked: true });
  })
);

beforeEach(() => {
  rows = [];
  posted = [];
  revoked = [];
});

/** Renders the page and waits for the first listing to settle. */
async function openPage() {
  const view = renderWithProviders(<ApiKeysPageClient />);
  await waitFor(() =>
    expect(screen.queryByText("Loading your keys…")).not.toBeInTheDocument()
  );
  return view;
}

/** Fills the name and submits the create form. */
async function createKeyNamed(name: string) {
  await userEvent.type(screen.getByLabelText("What is this key for?"), name);
  await userEvent.click(screen.getByRole("button", { name: "Create key" }));
  return screen.findByRole("heading", { name: REVEAL_HEADING });
}

/** The reveal panel, found through its heading. */
function revealPanel(): HTMLElement {
  return screen.getByRole("region", { name: REVEAL_HEADING });
}

describe("ApiKeysPageClient — the list", () => {
  it("shows a loading line first, then the empty state when the player has no key", async () => {
    renderWithProviders(<ApiKeysPageClient />);

    expect(screen.getByText("Loading your keys…")).toBeInTheDocument();
    expect(
      await screen.findByText(
        "No keys yet. Create one above to start using the API."
      )
    ).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("lists each key with its name, prefix, scopes and usage, and only the prefix of the secret", async () => {
    rows = [
      aKey({ id: "key-1", name: "CLI on my laptop", lastUsedAt: null }),
      aKey({
        id: "key-2",
        name: "Nightly export",
        displayPrefix: "mab_ZyXwVuTs",
        scopes: ["decks:read", "collection:read"],
        lastUsedAt: "2026-08-22T12:00:00.000Z",
      }),
    ];
    await openPage();

    const items = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("CLI on my laptop");
    expect(items[0]).toHaveTextContent("mab_AbCdEfGh…");
    expect(items[0]).toHaveTextContent("decks:read · never used");
    expect(items[1]).toHaveTextContent("Nightly export");
    expect(items[1]).toHaveTextContent(
      "decks:read, collection:read · last used 8/22/2026"
    );
    expect(
      screen.queryByText("No keys yet", { exact: false })
    ).not.toBeInTheDocument();
  });

  it("marks a revoked key and offers no revoke control for it", async () => {
    rows = [aKey({ revokedAt: "2026-08-22T13:00:00.000Z" })];
    await openPage();

    const item = screen.getByRole("listitem");
    expect(within(item).getByText("Revoked")).toBeInTheDocument();
    expect(within(item).queryByRole("button")).not.toBeInTheDocument();
  });

  it("marks an expired key but still lets the player revoke it", async () => {
    rows = [aKey({ expiresAt: "2026-01-01T00:00:00.000Z" })];
    await openPage();

    const item = screen.getByRole("listitem");
    expect(within(item).getByText("Expired")).toBeInTheDocument();
    expect(
      within(item).getByRole("button", {
        name: "Revoke the key CLI on my laptop",
      })
    ).toBeInTheDocument();
  });

  it("shows the server's message as an alert when the listing fails", async () => {
    server.use(
      http.get(ENDPOINT, () =>
        HttpResponse.json({ error: "Could not list API keys" }, { status: 500 })
      )
    );
    await openPage();

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Could not list API keys"
    );
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    // A failed listing is an empty one, so the empty state shows beside the alert.
    expect(
      screen.getByText("No keys yet", { exact: false })
    ).toBeInTheDocument();
  });
});

describe("ApiKeysPageClient — creating a key", () => {
  it("posts the name, the default scope and no expiry, then lists the new key", async () => {
    await openPage();

    await createKeyNamed("Nightly export");

    expect(posted).toEqual([
      { name: "Nightly export", scopes: ["decks:read"] },
    ]);
    const item = screen.getByRole("listitem");
    expect(item).toHaveTextContent("Nightly export");
    expect(item).toHaveTextContent(`${FIXTURE_PREFIX}…`);
    expect(screen.getByLabelText("What is this key for?")).toHaveValue("");
  });

  it("posts the ticked scopes and the chosen expiry", async () => {
    await openPage();

    await userEvent.click(
      screen.getByRole("checkbox", { name: "collection:read" })
    );
    await userEvent.selectOptions(screen.getByLabelText("Expires"), "30");
    await createKeyNamed("Nightly export");

    expect(posted).toEqual([
      {
        name: "Nightly export",
        scopes: ["decks:read", "collection:read"],
        expiresInDays: 30,
      },
    ]);
  });

  it("keeps the create button disabled while the name is blank or no scope is ticked", async () => {
    await openPage();
    const create = screen.getByRole("button", { name: "Create key" });

    expect(create).toBeDisabled();
    await userEvent.type(screen.getByLabelText("What is this key for?"), "   ");
    expect(create).toBeDisabled();
    await userEvent.type(screen.getByLabelText("What is this key for?"), "CLI");
    expect(create).toBeEnabled();
    await userEvent.click(screen.getByRole("checkbox", { name: "decks:read" }));
    expect(create).toBeDisabled();
    expect(posted).toEqual([]);
  });

  it("shows the refusal as an alert and reveals no token when the server declines", async () => {
    server.use(
      http.post(ENDPOINT, () =>
        HttpResponse.json(
          { error: "At most 20 active keys. Revoke one first." },
          { status: 409 }
        )
      )
    );
    await openPage();

    await userEvent.type(
      screen.getByLabelText("What is this key for?"),
      "one too many"
    );
    await userEvent.click(screen.getByRole("button", { name: "Create key" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "At most 20 active keys. Revoke one first."
    );
    expect(
      screen.queryByRole("heading", { name: REVEAL_HEADING })
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("What is this key for?")).toHaveValue(
      "one too many"
    );
  });
});

describe("ApiKeysPageClient — the one-time reveal", () => {
  function installClipboard(writeText: ReturnType<typeof vi.fn>) {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
  }

  it("shows the secret once, in the reveal panel only, never in the list", async () => {
    await openPage();

    await createKeyNamed("Nightly export");

    const panel = revealPanel();
    expect(within(panel).getByText(FIXTURE_TOKEN)).toBeInTheDocument();
    expect(panel).toHaveTextContent(
      "Only a hash of the key is stored, so nobody, including us, can show it to you a second time."
    );
    expect(screen.getAllByText(FIXTURE_TOKEN)).toHaveLength(1);
    expect(screen.getByRole("listitem")).not.toHaveTextContent(FIXTURE_TOKEN);
  });

  it("copies the secret to the clipboard and says so", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    installClipboard(writeText);
    await openPage();
    await createKeyNamed("Nightly export");

    await userEvent.click(
      within(revealPanel()).getByRole("button", { name: "Copy" })
    );

    expect(writeText).toHaveBeenCalledWith(FIXTURE_TOKEN);
    expect(
      await within(revealPanel()).findByRole("button", { name: "Copied" })
    ).toBeInTheDocument();
  });

  it("does not claim a copy the clipboard refused", async () => {
    // The refusal is settled by hand after the click, so the assertion runs
    // once the panel has handled it and not merely before it arrived.
    let refuse: (reason: Error) => void = () => undefined;
    const writeText = vi.fn(
      () =>
        new Promise<void>((_resolve, reject) => {
          refuse = reject;
        })
    );
    installClipboard(writeText);
    await openPage();
    await createKeyNamed("Nightly export");

    await userEvent.click(
      within(revealPanel()).getByRole("button", { name: "Copy" })
    );
    expect(writeText).toHaveBeenCalledWith(FIXTURE_TOKEN);
    await act(async () => {
      refuse(new Error("Clipboard access denied"));
    });

    expect(
      within(revealPanel()).getByRole("button", { name: "Copy" })
    ).toBeInTheDocument();
    expect(
      within(revealPanel()).queryByRole("button", { name: "Copied" })
    ).not.toBeInTheDocument();
  });

  it("drops the secret for good when the player dismisses the panel", async () => {
    await openPage();
    await createKeyNamed("Nightly export");

    await userEvent.click(
      screen.getByRole("button", { name: "I have saved it" })
    );

    expect(
      screen.queryByRole("heading", { name: REVEAL_HEADING })
    ).not.toBeInTheDocument();
    expect(screen.queryByText(FIXTURE_TOKEN)).not.toBeInTheDocument();
    expect(screen.getByRole("listitem")).toHaveTextContent("Nightly export");
  });
});

describe("ApiKeysPageClient — revoking a key", () => {
  it("asks for confirmation first and sends nothing when the player cancels", async () => {
    rows = [aKey()];
    await openPage();

    await userEvent.click(
      screen.getByRole("button", { name: "Revoke the key CLI on my laptop" })
    );
    expect(
      screen.getByRole("button", { name: "Revoke for good" })
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(
      screen.queryByRole("button", { name: "Revoke for good" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Revoke the key CLI on my laptop" })
    ).toBeInTheDocument();
    expect(revoked).toEqual([]);
  });

  it("revokes the confirmed key and shows it as revoked", async () => {
    rows = [aKey(), aKey({ id: "key-2", name: "Nightly export" })];
    await openPage();

    await userEvent.click(
      screen.getByRole("button", { name: "Revoke the key Nightly export" })
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Revoke for good" })
    );

    await waitFor(() => expect(revoked).toEqual(["key-2"]));
    const items = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(await within(items[1]).findByText("Revoked")).toBeInTheDocument();
    expect(within(items[0]).queryByText("Revoked")).not.toBeInTheDocument();
    expect(
      within(items[0]).getByRole("button", {
        name: "Revoke the key CLI on my laptop",
      })
    ).toBeInTheDocument();
  });

  it("shows the refusal as an alert and keeps the list when the server declines", async () => {
    rows = [aKey()];
    server.use(
      http.delete(`${ENDPOINT}/:id`, () =>
        HttpResponse.json({ error: "API key not found" }, { status: 404 })
      )
    );
    await openPage();

    await userEvent.click(
      screen.getByRole("button", { name: "Revoke the key CLI on my laptop" })
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Revoke for good" })
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "API key not found"
    );
    expect(screen.getByRole("listitem")).toHaveTextContent("CLI on my laptop");
    expect(screen.queryByText("Revoked")).not.toBeInTheDocument();
  });
});
