import { afterEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render-with-intl";
import { ImportFromUrlTab } from "./ImportFromUrlTab";

vi.mock("@/lib/deck/store", () => ({
  useDeckStore: (select: (state: object) => unknown) =>
    select({
      activeDeckId: "deck-1",
      addCard: vi.fn(),
      setCommander: vi.fn(),
      setPartner: vi.fn(),
      setCompanion: vi.fn(),
    }),
}));

/** @returns the answer /api/import/url gives when Moxfield refused the app */
function refusedResponse(): Response {
  return new Response(
    JSON.stringify({ error: "Moxfield refused MagicAIBuilder's request.", code: "moxfield_refused" }),
    { status: 422, headers: { "content-type": "application/json" } }
  );
}

describe("ImportFromUrlTab when Moxfield refuses", () => {
  afterEach(() => vi.restoreAllMocks());

  it("points the player to the Plain Text tab to paste the list", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(refusedResponse());
    renderWithIntl(<ImportFromUrlTab />);

    await user.type(
      screen.getByRole("textbox", { name: /moxfield publicId/ }),
      "https://moxfield.com/decks/abc123"
    );
    await user.click(screen.getByRole("button", { name: "Import" }));

    expect(
      await screen.findByText(
        "Moxfield refused MagicAIBuilder's request, so this deck can't be fetched from here. To import it anyway, open the deck on moxfield.com, use Export to copy the list as text, then paste it in the Plain Text tab."
      )
    ).toBeInTheDocument();
  });

  it("gives the same way out in French, naming the French tab", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(refusedResponse());
    renderWithIntl(<ImportFromUrlTab />, { locale: "fr" });

    await user.type(
      screen.getByRole("textbox", { name: /publicId moxfield/ }),
      "https://moxfield.com/decks/abc123"
    );
    await user.click(screen.getByRole("button", { name: "Importer" }));

    expect(
      await screen.findByText(/collez-la dans l’onglet Texte brut\.$/)
    ).toBeInTheDocument();
  });
});
