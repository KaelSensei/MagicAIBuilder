/**
 * Pins what the card-package library tells the player: why a previewed card is
 * blocked, in the player's language, and how many cards an apply added.
 *
 * Sociable: the real component with the real catalogs, and the package routes
 * answered over HTTP by MSW, as the browser would reach them.
 */
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { setupMsw } from "@/test/msw";
import { renderWithProviders, type TestLocale } from "@/test/render";
import { CardPackageLibrary } from "./CardPackageLibrary";

const LIBRARY_URL = "/api/community/card-packages";
const PREVIEW_URL = "/api/community/card-packages/package-1/preview";
const APPLY_URL = "/api/community/card-packages/package-1/apply";

const PACKAGE = {
  id: "package-1",
  name: "Interaction core",
  description: "",
  category: "interaction",
  author: { username: "brewer", name: null },
  cards: [],
};

const READY_CARD = {
  scryfallId: "ready",
  name: "Counterspell",
  quantity: 1,
  status: "ready",
  issues: [],
};

function aBlockedCard(...kinds: readonly string[]) {
  return {
    scryfallId: "blocked",
    name: "Demonic Tutor",
    quantity: 1,
    status: "blocked",
    issues: kinds.map((kind) => ({ kind, message: `Server says ${kind}` })),
  };
}

const server = setupMsw(
  http.get(LIBRARY_URL, () => HttpResponse.json([PACKAGE]))
);

function answerPreviewWith(cards: readonly unknown[]): void {
  server.use(
    http.post(PREVIEW_URL, () =>
      HttpResponse.json({ readyCount: 1, blockedCount: 1, cards })
    )
  );
}

async function openPreview(locale: TestLocale = "en"): Promise<void> {
  renderWithProviders(
    <CardPackageLibrary deckId="deck-1" refreshKey={0} scope="library" />,
    { locale }
  );
  await screen.findByText("Interaction core");
  fireEvent.click(
    screen.getByRole("button", { name: /Preview|Prévisualiser/ })
  );
  await screen.findByText("Demonic Tutor");
}

describe("CardPackageLibrary — why a card is blocked", () => {
  it("names the reason of a blocked card in French", async () => {
    answerPreviewWith([READY_CARD, aBlockedCard("colorIdentity")]);

    await openPreview("fr");

    expect(
      screen.getByText("Hors de l’identité couleur du commandant")
    ).toBeInTheDocument();
  });

  it.each([
    ["banned", "Banned in this format"],
    ["colorIdentity", "Outside the commander's color identity"],
    ["singleton", "Already in the deck"],
    ["copyLimit", "Copy limit reached"],
  ])("names the %s reason in the player's words", async (kind, reason) => {
    answerPreviewWith([READY_CARD, aBlockedCard(kind)]);

    await openPreview();

    expect(screen.getByText(reason)).toBeInTheDocument();
    expect(screen.queryByText(`Server says ${kind}`)).not.toBeInTheDocument();
  });

  it("names every reason when a card has two", async () => {
    answerPreviewWith([READY_CARD, aBlockedCard("banned", "colorIdentity")]);

    await openPreview();

    expect(screen.getByText("Banned in this format")).toBeInTheDocument();
    expect(
      screen.getByText("Outside the commander's color identity")
    ).toBeInTheDocument();
  });

  it("reads a reason the page does not know as a generic one", async () => {
    answerPreviewWith([READY_CARD, aBlockedCard("reservedList")]);

    await openPreview();

    expect(screen.getByText("Cannot be added")).toBeInTheDocument();
  });

  it("names the checkbox with the translated status and describes it with the reasons", async () => {
    answerPreviewWith([READY_CARD, aBlockedCard("copyLimit")]);

    await openPreview("fr");

    const blocked = screen.getByRole("checkbox", {
      name: "Demonic Tutor (Bloquée)",
    });
    expect(blocked).toBeDisabled();
    expect(blocked).toHaveAccessibleDescription(
      "Limite d’exemplaires atteinte"
    );
    expect(
      screen.getByRole("checkbox", { name: "Counterspell (Compatible)" })
    ).toBeEnabled();
  });

  it("shows the existing error when the preview answer is not a preview", async () => {
    server.use(
      http.post(PREVIEW_URL, () => HttpResponse.json({ cards: "none" }))
    );
    renderWithProviders(
      <CardPackageLibrary deckId="deck-1" refreshKey={0} scope="library" />
    );
    await screen.findByText("Interaction core");

    fireEvent.click(screen.getByRole("button", { name: "Preview" }));

    expect(
      await screen.findByText("This action failed. Please try again.")
    ).toBeInTheDocument();
  });
});

describe("CardPackageLibrary — what an apply added", () => {
  function answerApplyWith(answer: Response): void {
    server.use(http.post(APPLY_URL, () => answer));
  }

  async function applyThePackage(locale: TestLocale = "en"): Promise<void> {
    answerPreviewWith([READY_CARD, { ...aBlockedCard(), status: "ready" }]);
    await openPreview(locale);
    fireEvent.click(
      screen.getByRole("button", { name: /Add 2 cards|Ajouter 2 cartes/ })
    );
  }

  it("tells how many cards were added", async () => {
    answerApplyWith(HttpResponse.json({ addedCount: 2, blockedCount: 0 }));

    await applyThePackage();

    expect(await screen.findByRole("status")).toHaveTextContent(
      "2 cards added to the main deck."
    );
  });

  it("tells, in French, how many were added and how many the changed deck refused", async () => {
    answerApplyWith(HttpResponse.json({ addedCount: 1, blockedCount: 1 }));

    await applyThePackage("fr");

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "1 carte ajoutée au deck principal. 1 carte n’a pas été ajoutée, car votre deck a changé depuis l’aperçu."
      )
    );
  });

  it("tells how many were added and how many the changed deck refused", async () => {
    answerApplyWith(HttpResponse.json({ addedCount: 1, blockedCount: 1 }));

    await applyThePackage();

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "1 card added to the main deck. 1 card was not added because your deck changed since the preview."
      )
    );
  });

  it("still shows the existing error when the apply fails", async () => {
    answerApplyWith(
      HttpResponse.json(
        { error: "Failed to apply card package" },
        { status: 500 }
      )
    );

    await applyThePackage();

    expect(
      await screen.findByText("This action failed. Please try again.")
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });
});
