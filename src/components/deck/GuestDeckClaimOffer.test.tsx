import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import {
  createGuestDeck,
  GUEST_DECK_ID,
  GUEST_DECK_STORAGE_KEY,
  saveGuestDeck,
} from "@/lib/deck/guest-deck";
import { useDeckStore } from "@/lib/deck/store";
import type { Deck, DeckCard } from "@/lib/deck/types";
import { GuestDeckClaimOffer } from "./GuestDeckClaimOffer";

const { session } = vi.hoisted(() => ({
  session: { status: "unauthenticated" },
}));
vi.mock("next-auth/react", () => ({ useSession: () => session }));
vi.mock(
  import("@/i18n/navigation"),
  () => import("@/test/i18n-navigation-stub")
);

const OFFER_TITLE = "Save your guest deck to your account?";
const ACCEPT = "Save to my account";
const DECLINE = "Not now";

function card(
  overrides: Partial<DeckCard> & Pick<DeckCard, "id" | "name">
): DeckCard {
  return {
    scryfallId: overrides.id,
    manaCost: "",
    cmc: 0,
    typeLine: "",
    oracleText: "",
    colorIdentity: [],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "https://cards.scryfall.io/normal/front/card.jpg",
    artCropUri: "",
    category: "other",
    quantity: 1,
    zone: "main",
    ...overrides,
  };
}

/** A guest deck with a commander, a ramp spell and thirty Forests: 32 cards. */
function guestDeck(): Deck {
  return {
    ...createGuestDeck(),
    name: "Counters",
    commander: card({
      id: "d0d33d52-3d28-4635-b985-51e126289259",
      name: "Atraxa, Praetors' Voice",
      category: "commander",
    }),
    cards: [
      card({
        id: "4cbc6901-6a4a-4d0a-83ea-7eefa3b35021",
        name: "Sol Ring",
        category: "ramp",
      }),
      card({
        id: "b34bb2dc-c1af-4d77-b0b3-a0fb342a5fc6",
        name: "Forest",
        category: "land",
        quantity: 30,
      }),
    ],
  };
}

interface Deferred {
  readonly promise: Promise<Response>;
  readonly resolve: (response: Response) => void;
}

function deferredResponse(): Deferred {
  let resolve: (response: Response) => void = () => undefined;
  const promise = new Promise<Response>((settle) => {
    resolve = settle;
  });
  return { promise, resolve };
}

function created(): Response {
  return new Response(
    JSON.stringify({ id: "deck-42", name: "Counters", cards: [] }),
    {
      status: 201,
      headers: { "content-type": "application/json" },
    }
  );
}

const fetchMock =
  vi.fn<(input: string, init?: RequestInit) => Promise<Response>>();

function postedKeys(): readonly (string | null)[] {
  return fetchMock.mock.calls.map(([, init]) =>
    new Headers(init?.headers).get("Idempotency-Key")
  );
}

function storedGuestDeck(): string | null {
  return window.localStorage.getItem(GUEST_DECK_STORAGE_KEY);
}

/**
 * A guest builds a deck in the browser, then creates an account. The first
 * signed-in page offers to save that deck: saved through `POST /api/decks`
 * once, and removed from the browser only after the server answered.
 */
describe("GuestDeckClaimOffer", () => {
  beforeEach(() => {
    window.localStorage.clear();
    session.status = "authenticated";
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    saveGuestDeck(guestDeck());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    useDeckStore.getState().forgetGuestDeck();
  });

  it("offers the guest deck on sign-in, saves it with one POST, then clears the browser copy", async () => {
    session.status = "unauthenticated";
    const signedOut = renderWithIntl(
      <GuestDeckClaimOffer placement="floating" />
    );
    await act(async () => undefined);
    expect(screen.queryByRole("heading", { name: OFFER_TITLE })).toBeNull();
    signedOut.unmount();

    // Sign-in ends with a full navigation to the callback page.
    session.status = "authenticated";
    renderWithIntl(<GuestDeckClaimOffer placement="floating" />);

    expect(
      await screen.findByRole("heading", { name: OFFER_TITLE })
    ).toBeVisible();
    expect(
      screen.getByText(
        "“Counters” (32 cards) is still saved in this browser only."
      )
    ).toBeVisible();

    const pending = deferredResponse();
    fetchMock.mockReturnValueOnce(pending.promise);
    const accept = screen.getByRole("button", { name: ACCEPT });
    fireEvent.click(accept);
    fireEvent.click(accept);
    expect(storedGuestDeck()).not.toBeNull();

    await act(async () => pending.resolve(created()));

    expect(
      await screen.findByText(/“Counters” is now in your account\./)
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Open deck" })).toHaveAttribute(
      "href",
      "/builder/deck-42"
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/decks");
    expect(init?.method).toBe("POST");
    expect(postedKeys()[0]).toMatch(/^guest-claim-[0-9a-z]{11}$/);
    expect(JSON.parse(String(init?.body))).toMatchObject({
      name: "Counters",
      commanderId: "d0d33d52-3d28-4635-b985-51e126289259",
      cards: [
        { name: "Sol Ring", isCommander: false },
        { name: "Forest", quantity: 30 },
        {
          name: "Atraxa, Praetors' Voice",
          isCommander: true,
          isPartner: false,
        },
      ],
    });
    expect(storedGuestDeck()).toBeNull();
  });

  // Sonar S6819: the native <output> carries the status role, and the polite,
  // atomic announcement that role="status" implied stays explicit.
  it("confirms the saved deck in a polite, native status output with a link to open it", async () => {
    fetchMock.mockResolvedValueOnce(created());
    renderWithIntl(<GuestDeckClaimOffer placement="floating" />);

    fireEvent.click(await screen.findByRole("button", { name: ACCEPT }));

    const confirmation = await screen.findByRole("status");
    expect(confirmation).toHaveTextContent(
      "“Counters” is now in your account."
    );
    expect(
      within(confirmation).getByRole("link", { name: "Open deck" })
    ).toHaveAttribute("href", "/builder/deck-42");
    expect(confirmation).toBeInstanceOf(HTMLOutputElement);
    expect(confirmation).not.toHaveAttribute("role");
    expect(confirmation).toHaveAttribute("aria-live", "polite");
    expect(confirmation).toHaveAttribute("aria-atomic", "true");
  });

  it("drops the guest deck from the open builder too, so it is not written back", async () => {
    await useDeckStore.getState().setActiveDeck(GUEST_DECK_ID);
    fetchMock.mockResolvedValueOnce(created());
    renderWithIntl(<GuestDeckClaimOffer placement="floating" />);

    fireEvent.click(await screen.findByRole("button", { name: ACCEPT }));
    await screen.findByText(/is now in your account/);
    act(() => useDeckStore.setState({ isSyncing: false }));

    expect(useDeckStore.getState().decks[GUEST_DECK_ID]).toBeUndefined();
    expect(storedGuestDeck()).toBeNull();
  });

  it("posts nothing when declined, keeps the deck, and keeps it reachable from the deck list", async () => {
    const { unmount } = renderWithIntl(
      <GuestDeckClaimOffer placement="floating" />
    );
    const accept = await screen.findByRole("button", { name: ACCEPT });
    const decline = screen.getByRole("button", { name: DECLINE });
    expect(decline.className).toBe(accept.className);

    fireEvent.click(decline);

    expect(screen.queryByRole("heading", { name: OFFER_TITLE })).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(storedGuestDeck()).not.toBeNull();

    unmount();
    const floating = renderWithIntl(
      <GuestDeckClaimOffer placement="floating" />
    );
    await act(async () => undefined);
    expect(screen.queryByRole("heading", { name: OFFER_TITLE })).toBeNull();
    floating.unmount();

    renderWithIntl(<GuestDeckClaimOffer placement="inline" />);
    expect(
      await screen.findByRole("heading", { name: OFFER_TITLE })
    ).toBeVisible();
  });

  it("keeps the browser copy when the save fails, and a retry sends the same key", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Failed to create deck" }), {
        status: 500,
      })
    );
    renderWithIntl(<GuestDeckClaimOffer placement="floating" />);

    fireEvent.click(await screen.findByRole("button", { name: ACCEPT }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The deck could not be saved. It is still in this browser, so you can try again."
    );
    expect(storedGuestDeck()).not.toBeNull();

    fetchMock.mockResolvedValueOnce(created());
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    await screen.findByText(/is now in your account/);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(postedKeys()[1]).toBe(postedKeys()[0]);
    expect(storedGuestDeck()).toBeNull();
  });

  it("sends the same key after a reload that lost the first response", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    const firstLoad = renderWithIntl(
      <GuestDeckClaimOffer placement="floating" />
    );
    fireEvent.click(await screen.findByRole("button", { name: ACCEPT }));
    await screen.findByRole("alert");
    firstLoad.unmount();

    fetchMock.mockResolvedValueOnce(created());
    renderWithIntl(<GuestDeckClaimOffer placement="floating" />);
    fireEvent.click(await screen.findByRole("button", { name: ACCEPT }));

    await waitFor(() => expect(storedGuestDeck()).toBeNull());
    expect(postedKeys()).toHaveLength(2);
    expect(postedKeys()[1]).toBe(postedKeys()[0]);
  });

  it("offers nothing for a guest deck without cards", async () => {
    saveGuestDeck(createGuestDeck());

    renderWithIntl(<GuestDeckClaimOffer placement="inline" />);
    await act(async () => undefined);

    expect(screen.queryByRole("heading", { name: OFFER_TITLE })).toBeNull();
  });
});
