import { afterEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "@/test/render-with-intl";
import { AcquisitionPlanPanel } from "./AcquisitionPlanPanel";

vi.mock(import("@/i18n/navigation"), () => import("@/test/i18n-navigation-stub"));

const response = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

// jsdom's Blob has no `text()`, so the CSV is read back through a FileReader.
const readBlobText = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("AcquisitionPlanPanel", () => {
  it("shows how many copies each deck needs in an acquisition line", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({
      deckCount: 2,
      decks: [{ id: "a", name: "Artifacts" }, { id: "b", name: "Spells" }],
      items: [{
        scryfallId: "ring", name: "Sol Ring", requiredQuantity: 3,
        ownedQuantity: 1, acquireQuantity: 2, price: 2,
        decks: [
          { id: "a", name: "Artifacts", quantity: 2 },
          { id: "b", name: "Spells", quantity: 1 },
        ],
      }],
    })));
    const user = userEvent.setup();

    renderWithIntl(<AcquisitionPlanPanel />);
    await user.click(screen.getByRole("button", { name: "Acquisition plan" }));
    const line = await screen.findByRole("listitem");

    expect(within(line).getByRole("link", { name: "Artifacts" })).toBeInTheDocument();
    expect(within(line).getByText("2 copies")).toBeInTheDocument();
    expect(within(line).getByRole("link", { name: "Spells" })).toBeInTheDocument();
    expect(within(line).getByText("1 copy")).toBeInTheDocument();
    expect(within(line).getByText("You own 1 copy")).toBeInTheDocument();
    expect(within(line).getByText("3 copies required across 2 decks")).toBeInTheDocument();
  });

  it("offers retry when a stalled acquisition plan request times out", async () => {
    const timeoutController = new AbortController();
    const timeout = vi.spyOn(AbortSignal, "timeout").mockReturnValue(timeoutController.signal);
    vi.stubGlobal("fetch", vi.fn((_url: string, init: RequestInit) => new Promise((_resolve, reject) => {
      init.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    })));
    const user = userEvent.setup();

    renderWithIntl(<AcquisitionPlanPanel />);
    await user.click(screen.getByRole("button", { name: "Acquisition plan" }));
    expect(await screen.findByText(/Loading acquisition plan/)).toBeInTheDocument();

    expect(timeout).toHaveBeenCalledWith(15_000);
    timeoutController.abort();
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not load the acquisition plan.");
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("shows a known line subtotal and calls out an unpriced printing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({
      deckCount: 1,
      decks: [{ id: "a", name: "Artifacts" }],
      items: [
        { scryfallId: "ring", name: "Sol Ring", requiredQuantity: 3, ownedQuantity: 1, acquireQuantity: 2, price: 2.5, decks: [{ id: "a", name: "Artifacts", quantity: 3 }] },
        { scryfallId: "rock", name: "Mana Rock", requiredQuantity: 1, ownedQuantity: 0, acquireQuantity: 1, price: null, decks: [{ id: "a", name: "Artifacts", quantity: 1 }] },
      ],
    })));
    const user = userEvent.setup();

    renderWithIntl(<AcquisitionPlanPanel />);
    await user.click(screen.getByRole("button", { name: "Acquisition plan" }));

    const [priced, unpriced] = await screen.findAllByRole("listitem");
    expect(within(priced).getByText("2 to acquire")).toBeInTheDocument();
    expect(within(priced).getByText("USD 5.00")).toBeInTheDocument();
    expect(within(unpriced).getByText("Price unavailable for 1 copy")).toBeInTheDocument();
  });

  it("labels French acquisition prices as USD without implying a converted local quote", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({
      deckCount: 1,
      decks: [{ id: "a", name: "Artifacts" }],
      items: [{
        scryfallId: "ring", name: "Sol Ring", requiredQuantity: 1,
        ownedQuantity: 0, acquireQuantity: 1, price: 5,
        decks: [{ id: "a", name: "Artifacts", quantity: 1 }],
      }],
    })));
    const user = userEvent.setup();

    renderWithIntl(<AcquisitionPlanPanel />, { locale: "fr" });
    await user.click(screen.getByRole("button", { name: "Plan d’acquisition" }));

    expect(await screen.findByText("5,00 USD")).toBeInTheDocument();
  });

  it("exports only missing copies with their printing IDs and known prices", async () => {
    const fetchPlan = vi.fn().mockResolvedValue(response({
      deckCount: 1,
      decks: [{ id: "a", name: "Artifacts" }],
      items: [
        { scryfallId: "ring-a", name: "Sol Ring", requiredQuantity: 3, ownedQuantity: 2, acquireQuantity: 1, price: 2, decks: [{ id: "a", name: "Artifacts", quantity: 3 }] },
        { scryfallId: "ring-b", name: "Sol Ring", requiredQuantity: 2, ownedQuantity: 0, acquireQuantity: 2, price: null, decks: [{ id: "a", name: "Artifacts", quantity: 2 }] },
      ],
    }));
    vi.stubGlobal("fetch", fetchPlan);
    const createObjectURL = vi.fn().mockReturnValue("blob:acquisition-plan");
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const user = userEvent.setup();

    renderWithIntl(<AcquisitionPlanPanel />);
    await user.click(screen.getByRole("button", { name: "Acquisition plan" }));
    await screen.findAllByText("Sol Ring");
    await user.click(screen.getByRole("button", { name: "Acquisition plan CSV" }));

    const blob = createObjectURL.mock.calls[0]?.[0];
    expect(blob).toBeInstanceOf(Blob);
    if (!(blob instanceof Blob)) throw new Error("Expected a CSV blob");
    const csv = await readBlobText(blob);
    expect(csv.split("\n")).toEqual([
      "Name,Quantity,Price (USD),Total (USD),Scryfall ID,Deck allocations",
      '"Sol Ring",1,2,2,"ring-a","Artifacts (3)"',
      '"Sol Ring",2,,,"ring-b","Artifacts (2)"',
    ]);
    expect(click).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:acquisition-plan");
    click.mockRestore();
  });

  describe("copies a deck chose to proxy now or buy later", () => {
    const planWithDeferredCopies = {
      deckCount: 2,
      decks: [{ id: "a", name: "Artifacts" }, { id: "b", name: "Spells" }],
      items: [
        {
          scryfallId: "crypt", name: "Mana Crypt", requiredQuantity: 2, ownedQuantity: 0,
          acquireQuantity: 1, deferredQuantity: 1, price: 150,
          decks: [{ id: "a", name: "Artifacts", quantity: 1 }, { id: "b", name: "Spells", quantity: 1 }],
          deferred: [{ id: "a", name: "Artifacts", mode: "proxy_now", quantity: 1 }],
        },
        {
          scryfallId: "vault", name: "Mana Vault", requiredQuantity: 2, ownedQuantity: 0,
          acquireQuantity: 0, deferredQuantity: 2, price: 40,
          decks: [{ id: "b", name: "Spells", quantity: 2 }],
          deferred: [{ id: "b", name: "Spells", mode: "buy_later", quantity: 2 }],
        },
      ],
    };

    const openPlan = async (locale: "en" | "fr" = "en") => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(planWithDeferredCopies)));
      const user = userEvent.setup();
      renderWithIntl(<AcquisitionPlanPanel />, { locale });
      await user.click(screen.getByRole("button", { name: locale === "en" ? "Acquisition plan" : "Plan d’acquisition" }));
      return user;
    };

    it("leaves deferred copies out of the total and the CSV", async () => {
      const createObjectURL = vi.fn().mockReturnValue("blob:acquisition-plan");
      Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createObjectURL });
      Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
      vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
      const user = await openPlan();

      expect(await screen.findByText("1 to acquire across 2 decks · Known-price subtotal: USD 150.00")).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Acquisition plan CSV" }));
      const blob = createObjectURL.mock.calls[0]?.[0];
      if (!(blob instanceof Blob)) throw new Error("Expected a CSV blob");
      expect((await readBlobText(blob)).split("\n")).toEqual([
        "Name,Quantity,Price (USD),Total (USD),Scryfall ID,Deck allocations",
        '"Mana Crypt",1,150,150,"crypt","Artifacts (1); Spells (1)"',
      ]);
    });

    it("lists each deferred copy under its deck's choice, in words", async () => {
      await openPlan();

      const group = await screen.findByRole("region", { name: "Deferred · 3 copies" });
      // The deck's name is a link inside the label, so the label's own text stops before it.
      expect(within(group).getByText(/^Proxy for now —/)).toHaveTextContent("Proxy for now — Artifacts");
      expect(within(group).getByText(/^Buy later —/)).toHaveTextContent("Buy later — Spells");
      expect(within(group).getByText("Mana Vault")).toBeInTheDocument();
    });

    it("links each deferred copy's deck to its builder, as the buy-now list does", async () => {
      await openPlan();

      const group = await screen.findByRole("region", { name: "Deferred · 3 copies" });
      expect(within(group).getByRole("link", { name: "Artifacts" })).toHaveAttribute("href", "/builder/a");
      expect(within(group).getByRole("link", { name: "Spells" })).toHaveAttribute("href", "/builder/b");
    });

    it("names the choices in French", async () => {
      await openPlan("fr");

      const group = await screen.findByRole("region", { name: "Reporté · 3 exemplaires" });
      expect(within(group).getByText(/^Proxy pour l’instant —/)).toHaveTextContent("Proxy pour l’instant — Artifacts");
      expect(within(group).getByText(/^Acheter plus tard —/)).toHaveTextContent("Acheter plus tard — Spells");
    });

    it("keeps the buy-now summary and says nothing about an empty purchase when one copy is still to buy", async () => {
      await openPlan();

      expect(await screen.findByText("1 to acquire across 2 decks · Known-price subtotal: USD 150.00")).toBeInTheDocument();
      expect(screen.queryByText("Nothing to buy now: every missing copy is deferred.")).not.toBeInTheDocument();
    });
  });

  describe("when every missing copy is deferred", () => {
    const planWithOnlyDeferredCopies = {
      deckCount: 1,
      decks: [{ id: "b", name: "Spells" }],
      items: [{
        scryfallId: "vault", name: "Mana Vault", requiredQuantity: 2, ownedQuantity: 0,
        acquireQuantity: 0, deferredQuantity: 2, price: 40,
        decks: [{ id: "b", name: "Spells", quantity: 2 }],
        deferred: [{ id: "b", name: "Spells", mode: "buy_later", quantity: 2 }],
      }],
    };

    const openPlan = async (locale: "en" | "fr") => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(planWithOnlyDeferredCopies)));
      const user = userEvent.setup();
      renderWithIntl(<AcquisitionPlanPanel />, { locale });
      await user.click(screen.getByRole("button", { name: locale === "en" ? "Acquisition plan" : "Plan d’acquisition" }));
    };

    it("says there is nothing to buy now, above the Deferred group", async () => {
      await openPlan("en");

      const sentence = await screen.findByText("Nothing to buy now: every missing copy is deferred.");
      const group = screen.getByRole("region", { name: "Deferred · 2 copies" });
      expect(sentence.compareDocumentPosition(group)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
      expect(screen.queryByText("All cards needed for these decks are in your collection.")).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Acquisition plan CSV" })).not.toBeInTheDocument();
    });

    it("says it in French", async () => {
      await openPlan("fr");

      expect(await screen.findByText("Rien à acheter pour l’instant : tous les exemplaires manquants sont reportés.")).toBeInTheDocument();
    });
  });

  it("loads only when opened and shows the missing copies by deck", async () => {
    const fetchPlan = vi.fn().mockResolvedValue(response({
      deckCount: 2,
      decks: [{ id: "a", name: "Artifacts" }, { id: "b", name: "Spells" }],
      items: [{
        scryfallId: "ring", name: "Sol Ring", requiredQuantity: 2,
        ownedQuantity: 1, acquireQuantity: 1, price: 2,
        decks: [{ id: "a", name: "Artifacts", quantity: 1 }, { id: "b", name: "Spells", quantity: 1 }],
      }],
    }));
    vi.stubGlobal("fetch", fetchPlan);
    const user = userEvent.setup();

    renderWithIntl(<AcquisitionPlanPanel />);
    expect(fetchPlan).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Acquisition plan" }));

    expect(await screen.findByText("Sol Ring")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Artifacts" })).toHaveAttribute("href", "/builder/a");
    expect(screen.getByRole("link", { name: "Spells" })).toHaveAttribute("href", "/builder/b");
    expect(screen.getByText("1 to acquire")).toBeInTheDocument();
    expect(fetchPlan).toHaveBeenCalledWith("/api/collection/acquisition-plan", expect.objectContaining({ signal: expect.any(AbortSignal) }));
  });

  it("lets the player retry after a failed request", async () => {
    const fetchPlan = vi.fn()
      .mockResolvedValueOnce(response({ error: "Unavailable" }, 500))
      .mockResolvedValueOnce(response({ deckCount: 0, decks: [], items: [] }));
    vi.stubGlobal("fetch", fetchPlan);
    const user = userEvent.setup();

    renderWithIntl(<AcquisitionPlanPanel />);
    await user.click(screen.getByRole("button", { name: "Acquisition plan" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not load the acquisition plan.");
    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByText("Create a deck to start a purchase plan.")).toBeInTheDocument();
    expect(fetchPlan).toHaveBeenCalledTimes(2);
  });

  it("refreshes the plan on demand after collection changes", async () => {
    const fetchPlan = vi.fn()
      .mockResolvedValueOnce(response({ deckCount: 1, decks: [{ id: "a", name: "Artifacts" }], items: [] }))
      .mockResolvedValueOnce(response({ deckCount: 1, decks: [{ id: "a", name: "Artifacts" }], items: [{
        scryfallId: "ring", name: "Sol Ring", requiredQuantity: 1,
        ownedQuantity: 0, acquireQuantity: 1, price: null,
        decks: [{ id: "a", name: "Artifacts", quantity: 1 }],
      }] }));
    vi.stubGlobal("fetch", fetchPlan);
    const user = userEvent.setup();

    renderWithIntl(<AcquisitionPlanPanel />);
    await user.click(screen.getByRole("button", { name: "Acquisition plan" }));
    expect(await screen.findByText("All cards needed for these decks are in your collection.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Refresh plan" }));
    await waitFor(() => expect(screen.getByText("Sol Ring")).toBeInTheDocument());
    expect(screen.getByText("Price unavailable for 1 copy")).toBeInTheDocument();
  });

  it("switches between all decks and one deck without changing ownership", async () => {
    const decks = [{ id: "a", name: "Artifacts" }, { id: "b", name: "Spells" }];
    const fetchPlan = vi.fn()
      .mockResolvedValueOnce(response({
        deckCount: 2, decks,
        items: [{ scryfallId: "ring", name: "Sol Ring", requiredQuantity: 2, ownedQuantity: 1, acquireQuantity: 1, price: 2, decks: [{ id: "a", name: "Artifacts", quantity: 1 }, { id: "b", name: "Spells", quantity: 1 }] }],
      }))
      .mockResolvedValueOnce(response({ deckCount: 1, decks, items: [] }))
      .mockResolvedValueOnce(response({ deckCount: 2, decks, items: [] }));
    vi.stubGlobal("fetch", fetchPlan);
    const user = userEvent.setup();

    renderWithIntl(<AcquisitionPlanPanel />);
    await user.click(screen.getByRole("button", { name: "Acquisition plan" }));
    expect(await screen.findByText("Sol Ring")).toBeInTheDocument();
    const select = screen.getByRole("combobox", { name: "Deck for acquisition plan" });
    await user.selectOptions(select, "a");

    expect(await screen.findByText("All cards needed for these decks are in your collection.")).toBeInTheDocument();
    expect(fetchPlan).toHaveBeenNthCalledWith(2, "/api/collection/acquisition-plan?deckId=a", expect.objectContaining({ signal: expect.any(AbortSignal) }));
    await user.selectOptions(select, "");
    await waitFor(() => expect(fetchPlan).toHaveBeenCalledTimes(3));
    expect(fetchPlan).toHaveBeenNthCalledWith(3, "/api/collection/acquisition-plan", expect.objectContaining({ signal: expect.any(AbortSignal) }));
  });
});
