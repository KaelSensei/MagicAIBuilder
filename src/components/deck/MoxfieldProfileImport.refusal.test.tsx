import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render-with-intl";
import { MoxfieldProfileImport } from "./MoxfieldProfileImport";

/** @returns the answer /api/import/moxfield-user gives when Moxfield refused the app */
function refusedResponse(): Response {
  return new Response(
    JSON.stringify({ error: "Moxfield refused MagicAIBuilder's request.", code: "moxfield_refused" }),
    { status: 422, headers: { "content-type": "application/json" } }
  );
}

describe("MoxfieldProfileImport when Moxfield refuses", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("points the player to the Plain Text tab to paste the list", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(refusedResponse());
    renderWithIntl(<MoxfieldProfileImport onDeckSelected={vi.fn()} />);

    await user.type(screen.getByLabelText("Moxfield username"), "totoro");
    await user.click(screen.getByRole("button", { name: "Load decks" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Moxfield refused MagicAIBuilder's request, so this deck can't be fetched from here. To import it anyway, open the deck on moxfield.com, use Export to copy the list as text, then paste it in the Plain Text tab."
    );
  });

  /**
   * Retry stays for transient failures (see MoxfieldProfileImport.retry.test).
   * A refusal is deliberate: asking again only hits Moxfield with the request
   * it already turned down.
   */
  it("does not offer to retry a refusal", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(refusedResponse());
    renderWithIntl(<MoxfieldProfileImport onDeckSelected={vi.fn()} />);

    await user.type(screen.getByLabelText("Moxfield username"), "totoro");
    await user.click(screen.getByRole("button", { name: "Load decks" }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
  });
});
