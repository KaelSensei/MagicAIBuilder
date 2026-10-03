import { afterEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "@/test/render-with-intl";
import { AcquisitionPlanPanel } from "./AcquisitionPlanPanel";

const response = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

afterEach(() => vi.unstubAllGlobals());

describe("AcquisitionPlanPanel", () => {
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
    const csv = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(blob);
    });
    expect(csv.split("\n")).toEqual([
      "Name,Quantity,Price (USD),Total (USD),Scryfall ID",
      '"Sol Ring",1,2,2,"ring-a"',
      '"Sol Ring",2,,,"ring-b"',
    ]);
    expect(click).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:acquisition-plan");
    click.mockRestore();
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
    expect(screen.getByText("Artifacts · Spells")).toBeInTheDocument();
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
