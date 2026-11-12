import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import { buildNaturalLanguageSearchContext } from "@/lib/search/natural-language-query";
import { NaturalLanguageSearch } from "./NaturalLanguageSearch";

const CONTEXT = buildNaturalLanguageSearchContext({
  format: "commander",
  commanderColorIdentity: ["U", "G"],
  partnerColorIdentity: [],
  hasCommander: true,
});

const GENERATED = "t:instant id<=UG legal:commander";

function mockApi(postBody: unknown = { query: GENERATED, context: { format: "commander", colorIdentity: ["U", "G"] } }) {
  return vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
    if ((init?.method ?? "GET") === "GET") return Response.json({ available: true });
    return Response.json(postBody);
  });
}

async function showQuery(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.click(await screen.findByRole("button", { name: "Describe a card in plain language" }));
  await user.type(screen.getByRole("textbox", { name: "Card description" }), text);
  await user.click(screen.getByRole("button", { name: "Show Scryfall query" }));
  return screen.findByRole("textbox", { name: "Scryfall query" });
}

describe("NaturalLanguageSearch", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("stays hidden when the provider is unavailable", async () => {
    const fetchMock = vi.fn(async () => Response.json({ available: false }));
    vi.stubGlobal("fetch", fetchMock);
    renderWithIntl(
      <NaturalLanguageSearch context={CONTEXT} locale="en" onActiveChange={vi.fn()} onRunQuery={vi.fn()} />
    );
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(screen.queryByRole("button", { name: "Describe a card in plain language" })).toBeNull();
  });

  it("shows the query before running it, then runs an edit verbatim and warns when it widens", async () => {
    vi.stubGlobal("fetch", mockApi());
    const onRunQuery = vi.fn();
    const user = userEvent.setup();
    renderWithIntl(
      <NaturalLanguageSearch context={CONTEXT} locale="en" onActiveChange={vi.fn()} onRunQuery={onRunQuery} />
    );
    const query = await showQuery(user, "a cheap instant that draws cards");
    expect(query).toHaveValue(GENERATED);
    expect(onRunQuery).not.toHaveBeenCalled();

    await user.clear(query);
    await user.type(query, "t:creature");
    expect(screen.getByText(/outside the deck/i)).toBeDefined();
    await user.click(screen.getByRole("button", { name: "Search this query" }));
    expect(onRunQuery).toHaveBeenCalledWith("t:creature");
  });

  it("asks before a new translation replaces an edited query", async () => {
    const fetchMock = mockApi();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderWithIntl(
      <NaturalLanguageSearch context={CONTEXT} locale="en" onActiveChange={vi.fn()} onRunQuery={vi.fn()} />
    );
    const query = await showQuery(user, "draw spells");
    await user.type(query, " extra");
    await user.click(screen.getByRole("button", { name: "Show Scryfall query" }));
    expect(screen.getByText(/replaces the query you edited/i)).toBeDefined();
    const posts = () => fetchMock.mock.calls.filter((call) => call[1]?.method === "POST").length;
    expect(posts()).toBe(1);
    await user.click(screen.getByRole("button", { name: "Replace the edited query" }));
    await waitFor(() => expect(posts()).toBe(2));
  });

  it("returns to syntax search without running a query", async () => {
    vi.stubGlobal("fetch", mockApi());
    const onActiveChange = vi.fn();
    const onRunQuery = vi.fn();
    const user = userEvent.setup();
    renderWithIntl(
      <NaturalLanguageSearch context={CONTEXT} locale="en" onActiveChange={onActiveChange} onRunQuery={onRunQuery} />
    );
    await showQuery(user, "draw spells");
    await user.click(screen.getByRole("button", { name: "Back to syntax search" }));
    expect(onActiveChange).toHaveBeenLastCalledWith(false);
    expect(onRunQuery).not.toHaveBeenCalled();
  });

  it("explains an invalid French description", async () => {
    vi.stubGlobal("fetch", mockApi({ code: "invalid_query" }));
    const user = userEvent.setup();
    renderWithIntl(
      <NaturalLanguageSearch context={CONTEXT} locale="fr" onActiveChange={vi.fn()} onRunQuery={vi.fn()} />,
      { locale: "fr" }
    );
    await user.click(await screen.findByRole("button", { name: "Décrire une carte en langage naturel" }));
    await user.type(screen.getByRole("textbox", { name: "Description de la carte" }), "sorts qui piochent");
    await user.click(screen.getByRole("button", { name: "Afficher la requête Scryfall" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("requête Scryfall valide");
  });
});
