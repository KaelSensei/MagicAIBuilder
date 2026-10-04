import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import { SavePublicDeckButton } from "./SavePublicDeckButton";

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    children,
    href,
  }: {
    readonly children: React.ReactNode;
    readonly href: string;
  }) => <a href={href}>{children}</a>,
}));

describe("SavePublicDeckButton", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("saves a public deck into the selected private folder", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            folders: [{ id: "f1", name: "Ideas", savedDecks: [] }],
            unfiled: [],
          })
        )
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ saved: true, folderId: "f1" }), {
          status: 201,
        })
      );

    renderWithIntl(
      <SavePublicDeckButton deckId="deck-1" isSignedIn isOwner={false} />
    );
    fireEvent.click(screen.getByRole("button", { name: /save deck/i }));
    fireEvent.change(await screen.findByLabelText(/folder/i), {
      target: { value: "f1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => expect(screen.getByText(/saved/i)).toBeInTheDocument());
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/community/decks/deck-1/save",
      expect.objectContaining({ body: JSON.stringify({ folderId: "f1" }) })
    );
  });

  it("stays hidden for anonymous viewers and deck owners", () => {
    const anonymous = renderWithIntl(
      <SavePublicDeckButton
        deckId="deck-1"
        isSignedIn={false}
        isOwner={false}
      />
    );
    expect(screen.queryByRole("button", { name: /save deck/i })).toBeNull();
    anonymous.unmount();
    renderWithIntl(<SavePublicDeckButton deckId="deck-1" isSignedIn isOwner />);
    expect(screen.queryByRole("button", { name: /save deck/i })).toBeNull();
  });
});
