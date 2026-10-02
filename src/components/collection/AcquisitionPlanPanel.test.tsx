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
  it("loads only when opened and shows the missing copies by deck", async () => {
    const fetchPlan = vi.fn().mockResolvedValue(response({
      deckCount: 2,
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
      .mockResolvedValueOnce(response({ deckCount: 0, items: [] }));
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
      .mockResolvedValueOnce(response({ deckCount: 1, items: [] }))
      .mockResolvedValueOnce(response({ deckCount: 1, items: [{
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
});
