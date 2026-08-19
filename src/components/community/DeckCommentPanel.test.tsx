import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import enDeck from "@/messages/en/deck.json";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/",
}));

import { DeckCommentPanel } from "./DeckCommentPanel";

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={{ deck: enDeck }}>
      {ui}
    </NextIntlClientProvider>
  );
}

function thread(overrides: Record<string, unknown> = {}) {
  return {
    id: "c1",
    deckId: "deck-1",
    parentId: null,
    body: "Why no Cyclonic Rift?",
    createdAt: "2026-08-18T10:00:00.000Z",
    updatedAt: "2026-08-18T10:00:00.000Z",
    author: { name: "Ana", username: "ana", image: null },
    isDeckOwner: false,
    isAuthor: false,
    replies: [],
    ...overrides,
  };
}

const fetchMock = vi.fn();

function stubStream(threads: unknown[], count = threads.length) {
  fetchMock.mockImplementation((_url: string, init?: RequestInit) => {
    if (init?.method === undefined) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ comments: threads, count }),
      });
    }
    return Promise.resolve({ ok: true, status: 201, json: () => Promise.resolve({}) });
  });
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("DeckCommentPanel", () => {
  it("renders the stream with count, author and body", async () => {
    stubStream([thread()]);
    renderWithIntl(<DeckCommentPanel deckId="deck-1" isOwner={false} isSignedIn={false} />);

    expect(await screen.findByText("Why no Cyclonic Rift?")).toBeTruthy();
    expect(screen.getByText("1 comment")).toBeTruthy();
    expect(screen.getByText("Ana")).toBeTruthy();
  });

  it("badges the deck author's comments", async () => {
    stubStream([thread({ isDeckOwner: true })]);
    renderWithIntl(<DeckCommentPanel deckId="deck-1" isOwner={false} isSignedIn={false} />);

    expect(await screen.findByText("Deck author")).toBeTruthy();
  });

  it("nests replies under their parent", async () => {
    stubStream([
      thread({
        replies: [thread({ id: "c2", parentId: "c1", body: "Budget cut.", isDeckOwner: true })],
      }),
    ]);
    renderWithIntl(<DeckCommentPanel deckId="deck-1" isOwner={false} isSignedIn={false} />);

    expect(await screen.findByText("Budget cut.")).toBeTruthy();
  });

  it("asks anonymous viewers to sign in instead of showing the form", async () => {
    stubStream([]);
    renderWithIntl(<DeckCommentPanel deckId="deck-1" isOwner={false} isSignedIn={false} />);

    expect(await screen.findByText(/sign in to join/i)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /post/i })).toBeNull();
  });

  it("posts a comment and reloads the stream", async () => {
    stubStream([]);
    renderWithIntl(<DeckCommentPanel deckId="deck-1" isOwner={false} isSignedIn={true} />);

    const textarea = await screen.findByPlaceholderText(/ask a question/i);
    fireEvent.change(textarea, { target: { value: "Nice curve!" } });
    fireEvent.click(screen.getByRole("button", { name: /post/i }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/community/decks/deck-1/comments",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ body: "Nice curve!" }),
        })
      )
    );
  });

  it("offers edit and delete only on the viewer's own comments", async () => {
    stubStream([thread({ isAuthor: true }), thread({ id: "c2", body: "Not mine." })]);
    renderWithIntl(<DeckCommentPanel deckId="deck-1" isOwner={false} isSignedIn={true} />);

    await screen.findByText("Not mine.");
    expect(screen.getAllByRole("button", { name: /edit/i })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: /delete/i })).toHaveLength(1);
  });

  it("lets the deck owner delete anyone's comment", async () => {
    stubStream([thread()]);
    renderWithIntl(<DeckCommentPanel deckId="deck-1" isOwner={true} isSignedIn={true} />);

    await screen.findByText("Why no Cyclonic Rift?");
    expect(screen.getAllByRole("button", { name: /delete/i })).toHaveLength(1);
    expect(screen.queryByRole("button", { name: /edit/i })).toBeNull();
  });

  it("sends a reply with the parent id", async () => {
    stubStream([thread()]);
    renderWithIntl(<DeckCommentPanel deckId="deck-1" isOwner={false} isSignedIn={true} />);

    fireEvent.click(await screen.findByRole("button", { name: /reply/i }));
    const forms = screen.getAllByPlaceholderText(/ask a question/i);
    fireEvent.change(forms[forms.length - 1], { target: { value: "Budget." } });
    const replySubmits = screen.getAllByRole("button", { name: /reply/i });
    fireEvent.click(replySubmits[replySubmits.length - 1]);

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/community/decks/deck-1/comments",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ body: "Budget.", parentId: "c1" }),
        })
      )
    );
  });

  it("flips the top-level order with the sort toggle", async () => {
    // The API serves newest first; the toggle only reverses the top level.
    stubStream([
      thread({ id: "new", body: "Newest comment." }),
      thread({ id: "old", body: "Oldest comment.", createdAt: "2026-08-17T10:00:00.000Z" }),
    ]);
    renderWithIntl(<DeckCommentPanel deckId="deck-1" isOwner={false} isSignedIn={false} />);

    await screen.findByText("Newest comment.");
    const bodies = () =>
      screen
        .getAllByText(/comment\./i)
        .map((el) => el.textContent);
    expect(bodies()).toEqual(["Newest comment.", "Oldest comment."]);

    fireEvent.click(screen.getByRole("button", { name: /newest first/i }));

    expect(bodies()).toEqual(["Oldest comment.", "Newest comment."]);
    expect(screen.getByRole("button", { name: /oldest first/i })).toBeTruthy();
  });

  it("deletes after confirmation", async () => {
    stubStream([thread({ isAuthor: true })]);
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
    renderWithIntl(<DeckCommentPanel deckId="deck-1" isOwner={false} isSignedIn={true} />);

    fireEvent.click(await screen.findByRole("button", { name: /delete/i }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/community/decks/deck-1/comments/c1",
        expect.objectContaining({ method: "DELETE" })
      )
    );
  });
});
