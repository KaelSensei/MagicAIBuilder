/**
 * Behaviour of the collection page, through its store and the browser APIs it calls.
 *
 * Collection context. The first three tests cover the load notice and the keyboard-visible
 * row actions. The rest are COL-01's characterization tests: they pin today's figures, sort,
 * name filter, text and CSV exports and printing swap before COL-12 and COL-13 split the
 * page into a toolbar, a summary, a grid, a list, `useCollectionExport` and
 * `usePrintingSwap` (audit catalog_collection A4, F12). They describe today's behaviour;
 * a later slice that changes it updates them in its own Red step.
 *
 * Collaborators: the real `useCollectionStore`, fed through `GET /api/collection`; the real
 * Scryfall client, answered by the shared card cache route; `downloadTextFile` and
 * user-event's clipboard. The modal and panels mocked below have tests of their own.
 */
import type { ComponentProps } from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PrintingSelectorModal as RealPrintingSelectorModal } from "@/components/card/PrintingSelectorModal";
import {
  useCollectionStore,
  type CollectionStore,
} from "@/lib/collection/store";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { aScryfallCard } from "@/test/builders/scryfall";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useFormatter: () => ({ number: (value: number) => String(value) }),
}));
// The real dialog has tests of its own; this stand-in only shows when the page opens it.
vi.mock(import("./AddToCollectionDialog"), () => ({
  AddToCollectionDialog: ({ open }) =>
    open ? <dialog open aria-label="add to collection" /> : <></>,
}));
// The real selector loads every printing of the card; this stand-in shows which card it was
// opened on and offers one printing, `OTHER_PRINTING`, which is read only when clicked.
vi.mock(import("@/components/card/PrintingSelectorModal"), () => ({
  PrintingSelectorModal: ({
    card,
    onSelect,
    onClose,
  }: ComponentProps<typeof RealPrintingSelectorModal>) => (
    <dialog open aria-label={`printings of ${card.id}`}>
      <button type="button" onClick={() => onSelect(OTHER_PRINTING)}>
        pick other printing
      </button>
      <button type="button" onClick={onClose}>
        close printings
      </button>
    </dialog>
  ),
}));
vi.mock(import("@/components/collection/AcquisitionPlanPanel"), () => ({ AcquisitionPlanPanel: () => <></> }));
vi.mock(import("@/components/collection/PrintingDeckUsage"), () => ({ PrintingDeckUsage: () => <></> }));

import { CollectionPageClient } from "./CollectionPageClient";

/**
 * The printing the stand-in selector picks: a JPEG-era image list with two sizes, so the size
 * the page asks for shows in the URL, and both dollar prices, so the one it reads shows too.
 */
const OTHER_PRINTING: ScryfallCard = aScryfallCard({
  id: "sol-ring-2",
  name: "Sol Ring",
  prices: { usd: "2.50", usd_foil: "9.99", eur: "2.10" },
  image_uris: {
    normal:
      "https://cards.scryfall.io/normal/front/a/b/0a1b2c3d-0000-4000-8000-000000000002.jpg",
    large:
      "https://cards.scryfall.io/large/front/a/b/0a1b2c3d-0000-4000-8000-000000000002.jpg",
  },
});

/** One owned row as `GET /api/collection` sends it; the fields a test names win. */
function ownedRow(
  overrides: Readonly<Record<string, unknown>>
): Readonly<Record<string, unknown>> {
  return {
    id: "owned-1",
    scryfallId: "sol-ring-1",
    name: "Sol Ring",
    quantity: 1,
    foil: false,
    condition: "NM",
    acquiredAt: null,
    price: 1,
    imageUri: "",
    createdAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

/** Listed out of name order on purpose; one printing is owned both plain and foil, one has no price. */
const OWNED_ROWS = [
  ownedRow({
    id: "owned-sol",
    scryfallId: "sol-ring-1",
    quantity: 2,
    price: 1.5,
  }),
  ownedRow({
    id: "owned-sol-foil",
    scryfallId: "sol-ring-1",
    foil: true,
    condition: "LP",
    price: 4,
  }),
  ownedRow({
    id: "owned-island",
    scryfallId: "island-1",
    name: "Island",
    quantity: 10,
    condition: null,
    price: null,
  }),
];

/**
 * A `fetch` that serves the collection, and the shared card cache for the ids in `cachedCards`.
 * Every other request, api.scryfall.com included, gets a 404.
 */
function serveCollection(
  rows: readonly unknown[],
  cachedCards: readonly ScryfallCard[] = []
) {
  const cached = new Map(
    cachedCards.map((card) => [`/api/cache/cards?id=${card.id}`, card])
  );
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = input instanceof Request ? input.url : String(input);
    if (url === "/api/collection") return Response.json(rows);
    const card = cached.get(url);
    return card
      ? Response.json({ data: card })
      : new Response(null, { status: 404 });
  });
}

/** @returns the value shown under a stat card's label */
function figure(label: string): string | null | undefined {
  return screen.getByText(label).nextElementSibling?.textContent;
}

/** @returns the text of the Blob a download was given, read the way a browser saves it */
function readText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

beforeEach(() => {
  // Back to the real store, actions included, so a stubbed action never leaks into the next test.
  useCollectionStore.setState(useCollectionStore.getInitialState(), true);
  vi.restoreAllMocks();
});

it("shows a retryable error instead of an empty collection after the initial load fails", async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce({ ok: false })
    .mockResolvedValueOnce({ ok: true, json: async () => [] });
  vi.stubGlobal("fetch", fetchMock);

  render(<CollectionPageClient />);

  expect(await screen.findByRole("alert")).toHaveTextContent("loadFailed");
  expect(screen.queryByText("empty.title")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "retry" }));
  expect(await screen.findByText("empty.title")).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

it("keeps cached cards visible with a refresh warning", async () => {
  useCollectionStore.setState({
    collectionCards: {
      "printing-1": {
        id: "owned-1",
        scryfallId: "printing-1",
        name: "Sol Ring",
        quantity: 1,
        foil: false,
        condition: "NM",
        acquiredAt: null,
        price: 1,
        imageUri: "https://example.com/card.jpg",
        createdAt: new Date("2024-01-01"),
      },
    },
  });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

  render(<CollectionPageClient />);

  expect(await screen.findByRole("alert")).toHaveTextContent("loadFailed");
  expect(screen.getByText("Sol Ring")).toBeInTheDocument();
  expect(screen.queryByText("empty.title")).not.toBeInTheDocument();
});

it("keeps focused list-row actions visible for keyboard users", async () => {
  useCollectionStore.setState({
    collectionCards: {
      "printing-1": {
        id: "owned-1",
        scryfallId: "printing-1",
        name: "Sol Ring",
        quantity: 1,
        foil: false,
        condition: "NM",
        acquiredAt: null,
        price: 1,
        imageUri: "",
        createdAt: new Date("2024-01-01"),
      },
    },
  });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

  render(<CollectionPageClient />);

  const changeArt = await screen.findByRole("button", { name: "actions.changeArtFor" });
  const remove = screen.getByRole("button", { name: "actions.removeFromCollection" });

  expect(changeArt).toHaveClass("focus-visible:opacity-100");
  expect(remove).toHaveClass("focus-visible:opacity-100");
});

describe("collection figures and list (characterization, COL-01)", () => {
  it("counts each foil and plain row as a unique card, sums copies, and values unpriced copies at zero", async () => {
    vi.stubGlobal("fetch", serveCollection(OWNED_ROWS));

    render(<CollectionPageClient />);

    expect(await screen.findByText("Island")).toBeInTheDocument();
    expect(figure("stats.uniqueCards")).toBe("3");
    expect(figure("stats.totalCards")).toBe("13");
    // 2 × 1.5 + 1 × 4; the ten unpriced Islands add nothing.
    expect(figure("stats.totalValue")).toBe("7");
  });

  it("lists plain and foil rows together by name, plain before foil for the same name", async () => {
    vi.stubGlobal("fetch", serveCollection(OWNED_ROWS));

    render(<CollectionPageClient />);

    await screen.findByText("Island");
    const names = screen
      .getAllByText(/^(Island|Sol Ring)$/)
      .map((name) => name.textContent);
    expect(names).toEqual(["Island", "Sol Ring", "Sol Ring"]);
    expect(screen.getByText("✨ foilBadge")).toBeInTheDocument();
  });

  it("filters rows by a case-insensitive part of the name and keeps the figures for the whole collection", async () => {
    vi.stubGlobal("fetch", serveCollection(OWNED_ROWS));
    const user = userEvent.setup();

    render(<CollectionPageClient />);
    await screen.findByText("Island");
    await user.type(
      screen.getByRole("textbox", { name: "searchPlaceholder" }),
      "SOL r"
    );

    expect(screen.queryByText("Island")).not.toBeInTheDocument();
    expect(screen.getAllByText("Sol Ring")).toHaveLength(2);
    expect(figure("stats.uniqueCards")).toBe("3");
    expect(figure("stats.totalCards")).toBe("13");
  });

  it("says no card matches when the filter excludes every row, and not that the collection is empty", async () => {
    vi.stubGlobal("fetch", serveCollection(OWNED_ROWS));
    const user = userEvent.setup();

    render(<CollectionPageClient />);
    await screen.findByText("Island");
    await user.type(
      screen.getByRole("textbox", { name: "searchPlaceholder" }),
      "Forest"
    );

    expect(screen.getByText("empty.noMatch")).toBeInTheDocument();
    expect(screen.queryByText("empty.title")).not.toBeInTheDocument();
  });

  it("offers no copy or CSV export while the collection is empty", async () => {
    vi.stubGlobal("fetch", serveCollection([]));

    render(<CollectionPageClient />);

    expect(await screen.findByText("empty.title")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "actions.copy" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "actions.csv" })
    ).not.toBeInTheDocument();
  });
});

/*
 * The empty collection was an icon and a sentence, with no action at all. It
 * now says what the collection is for and opens the add dialog (I-13
 * AC-13-05, design audit S11). `EmptyCollection.test.tsx` covers its copy.
 */
describe("the empty collection", () => {
  it("opens the add-to-collection dialog from Add cards", async () => {
    vi.stubGlobal("fetch", serveCollection([]));
    const user = userEvent.setup();
    render(<CollectionPageClient />);

    await user.click(
      await screen.findByRole("button", { name: "empty.addCards" })
    );

    expect(
      screen.getByRole("dialog", { name: "add to collection" })
    ).toBeInTheDocument();
    expect(screen.getByText("empty.purpose")).toBeInTheDocument();
  });

  it("offers no Add cards when the name filter only hides the owned cards", async () => {
    vi.stubGlobal("fetch", serveCollection(OWNED_ROWS));
    const user = userEvent.setup();
    render(<CollectionPageClient />);
    await screen.findByText("Island");

    await user.type(
      screen.getByRole("textbox", { name: "searchPlaceholder" }),
      "Forest"
    );

    expect(screen.getByText("empty.noMatch")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "empty.addCards" })
    ).not.toBeInTheDocument();
  });
});

describe("collection exports (characterization, COL-01)", () => {
  it("copies one line per row in list order, with a [Foil] tag, whatever the filter shows", async () => {
    vi.stubGlobal("fetch", serveCollection(OWNED_ROWS));
    const user = userEvent.setup();

    render(<CollectionPageClient />);
    await screen.findByText("Island");
    await user.type(
      screen.getByRole("textbox", { name: "searchPlaceholder" }),
      "Island"
    );
    await user.click(screen.getByRole("button", { name: "actions.copy" }));

    expect(await navigator.clipboard.readText()).toBe(
      "10× Island\n2× Sol Ring\n1× Sol Ring [Foil]"
    );
    expect(
      screen.getByRole("button", { name: "actions.copied" })
    ).toBeInTheDocument();
  });

  it("downloads my-collection.csv with one row per owned row and its printing id", async () => {
    vi.stubGlobal("fetch", serveCollection(OWNED_ROWS));
    const createObjectURL = vi.fn((_blob: Blob) => "blob:my-collection");
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    const downloads: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement
    ) {
      downloads.push(this.download);
    });
    const user = userEvent.setup();

    render(<CollectionPageClient />);
    await screen.findByText("Island");
    await user.click(screen.getByRole("button", { name: "actions.csv" }));

    expect(downloads).toEqual(["my-collection.csv"]);
    const blob = createObjectURL.mock.calls[0]?.[0];
    expect(blob?.type).toBe("text/csv;charset=utf-8;");
    if (blob === undefined) throw new Error("Expected a CSV blob");
    expect((await readText(blob)).split("\n")).toEqual([
      "Name,Quantity,Foil,Condition,Price (USD),Scryfall ID",
      '"Island",10,No,,,"island-1"',
      '"Sol Ring",2,No,NM,1.5,"sol-ring-1"',
      '"Sol Ring",1,Yes,LP,4,"sol-ring-1"',
    ]);
  });
});

describe("printing swap (characterization, COL-01)", () => {
  /** Replaces the store's swap with a spy, so the test reads what the page asked for. */
  function spyOnSwap() {
    const swapPrinting = vi
      .fn<CollectionStore["swapPrinting"]>()
      .mockResolvedValue(undefined);
    useCollectionStore.setState({ swapPrinting });
    return swapPrinting;
  }

  it("opens the selector on the row's printing and swaps the row to the pick, with its grid image and non-foil dollar price", async () => {
    vi.stubGlobal(
      "fetch",
      serveCollection(
        [ownedRow({})],
        [aScryfallCard({ id: "sol-ring-1", name: "Sol Ring" })]
      )
    );
    const swapPrinting = spyOnSwap();
    const user = userEvent.setup();

    render(<CollectionPageClient />);
    await user.click(
      await screen.findByRole("button", { name: "actions.changeArtFor" })
    );
    await user.click(
      await screen.findByRole("button", { name: "pick other printing" })
    );

    expect(swapPrinting).toHaveBeenCalledExactlyOnceWith("owned-1", {
      scryfallId: "sol-ring-2",
      name: "Sol Ring",
      imageUri:
        "https://cards.scryfall.io/grid/front/a/b/0a1b2c3d-0000-4000-8000-000000000002.webp",
      price: 2.5,
    });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
  });

  it("names the printing the selector opened on", async () => {
    vi.stubGlobal(
      "fetch",
      serveCollection(
        [ownedRow({})],
        [aScryfallCard({ id: "sol-ring-1", name: "Sol Ring" })]
      )
    );
    const user = userEvent.setup();

    render(<CollectionPageClient />);
    await user.click(
      await screen.findByRole("button", { name: "actions.changeArtFor" })
    );

    expect(
      await screen.findByRole("dialog", { name: "printings of sol-ring-1" })
    ).toBeInTheDocument();
  });

  it("closes the selector without swapping when the player closes it", async () => {
    vi.stubGlobal(
      "fetch",
      serveCollection(
        [ownedRow({})],
        [aScryfallCard({ id: "sol-ring-1", name: "Sol Ring" })]
      )
    );
    const swapPrinting = spyOnSwap();
    const user = userEvent.setup();

    render(<CollectionPageClient />);
    await user.click(
      await screen.findByRole("button", { name: "actions.changeArtFor" })
    );
    await user.click(
      await screen.findByRole("button", { name: "close printings" })
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(swapPrinting).not.toHaveBeenCalled();
  });

  it("currently opens nothing and says nothing when the printing cannot be looked up (pinned)", async () => {
    const fetchMock = serveCollection([ownedRow({})]);
    vi.stubGlobal("fetch", fetchMock);
    const swapPrinting = spyOnSwap();
    const user = userEvent.setup();

    render(<CollectionPageClient />);
    await user.click(
      await screen.findByRole("button", { name: "actions.changeArtFor" })
    );

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringMatching(/\/cards\/sol-ring-1$/),
        expect.anything()
      )
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(swapPrinting).not.toHaveBeenCalled();
  });
});

// Design audit S3: the view switch is a named group whose chosen view is
// pressed and marked without colour alone. Names are catalog keys here, since
// this file stands next-intl in by the key.
describe("the view switch", () => {
  it("starts on the list, the one view pressed, and presses the grid once picked", async () => {
    vi.stubGlobal("fetch", serveCollection(OWNED_ROWS));
    const user = userEvent.setup();

    render(<CollectionPageClient />);
    await screen.findByText("Island");
    const layout = screen.getByRole("group", { name: "viewMode.layout" });
    expect(within(layout).getAllByRole("button", { pressed: true })).toEqual([
      within(layout).getByRole("button", { name: "viewMode.listView" }),
    ]);

    await user.click(
      within(layout).getByRole("button", { name: "viewMode.gridView" })
    );

    expect(
      within(layout).getByRole("button", { name: "viewMode.gridView" })
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      within(layout).getByRole("button", { name: "viewMode.listView" })
    ).toHaveAttribute("aria-pressed", "false");
  });
});
