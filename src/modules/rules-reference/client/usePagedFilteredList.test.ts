/**
 * Solitary tests of the paged-and-filtered list hook (master plan RR-04), with plain string items.
 * The Game Changers page suite (`ui/GameChangersPageClient.test.tsx`) is the contract for what a
 * visitor sees; these pin the hook's own API for its next user. Next's router is replaced, as the
 * hook writes the page number to the URL through it.
 */
import { act, renderHook } from "@testing-library/react";
import { ReadonlyURLSearchParams } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePagedFilteredList } from "./usePagedFilteredList";

const { router, searchParams } = vi.hoisted(() => ({
  router: {
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  },
  searchParams: { current: new URLSearchParams() },
}));

vi.mock(import("next/navigation"), async (importOriginal) => ({
  ...(await importOriginal()),
  useRouter: () => router,
  useSearchParams: () => new ReadonlyURLSearchParams(searchParams.current),
}));

/** "Card 1" … "Card N". */
const cards = (count: number): readonly string[] =>
  Array.from({ length: count }, (_, index) => `Card ${index + 1}`);

const matches = (item: string, query: string) =>
  item.toLowerCase().includes(query);

function renderList(
  items: readonly string[],
  { isLoading = false, isError = false, url = "" } = {}
) {
  searchParams.current = new URLSearchParams(url);
  return renderHook(
    (list: readonly string[]) =>
      usePagedFilteredList({
        items: list,
        matches,
        pageSize: 2,
        isLoading,
        isError,
      }),
    { initialProps: items }
  );
}

beforeEach(() => {
  router.replace.mockClear();
});

describe("searching", () => {
  it("keeps every item while the search is empty or blank", () => {
    const { result } = renderList(cards(3));
    act(() => result.current.changeSearch("   "));

    expect(result.current.filtered).toEqual(cards(3));
  });

  it("keeps the items the predicate matches, with the typed text trimmed and lower-cased", () => {
    const { result } = renderList(["Sol Ring", "Rhystic Study"]);
    act(() => result.current.changeSearch("  RING "));

    expect(result.current.filtered).toEqual(["Sol Ring"]);
    expect(result.current.search).toBe("  RING ");
  });

  it("returns to page 1 and writes it to the URL when the search changes", () => {
    const { result } = renderList(cards(5));
    act(() => result.current.goToPage(3));
    router.replace.mockClear();

    act(() => result.current.changeSearch("Card"));

    expect(result.current.currentPage).toBe(1);
    expect(router.replace).toHaveBeenCalledWith("?page=1", { scroll: false });
  });
});

describe("paging", () => {
  it("slices the filtered list by the page size and counts at least one page", () => {
    const { result } = renderList(cards(5));

    expect(result.current.totalPages).toBe(3);
    expect(result.current.pageSlice).toEqual(["Card 1", "Card 2"]);
    expect(renderList([]).result.current.totalPages).toBe(1);
  });

  it("shows the requested page, keeps the other query parameters when it writes the URL, and scrolls the top into view", () => {
    const { result } = renderList(cards(5), { url: "tab=banlist" });
    const top = document.createElement("div");
    top.scrollIntoView = vi.fn();
    result.current.topRef.current = top;
    router.replace.mockClear();

    act(() => result.current.goToPage(3));

    expect(result.current.pageSlice).toEqual(["Card 5"]);
    expect(router.replace).toHaveBeenCalledWith("?tab=banlist&page=3", {
      scroll: false,
    });
    expect(top.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
  });

  it("clamps the shown page to the last one when the list shrinks", () => {
    const { result, rerender } = renderList(cards(5));
    act(() => result.current.goToPage(3));

    rerender(cards(3));

    expect(result.current.currentPage).toBe(2);
    expect(result.current.pageSlice).toEqual(["Card 3"]);
  });
});

describe("a ?page=N link", () => {
  it("opens the named page once the list is known, without touching the URL", () => {
    const { result } = renderList(cards(5), { url: "page=2" });

    expect(result.current.currentPage).toBe(2);
    expect(result.current.pageSlice).toEqual(["Card 3", "Card 4"]);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("waits for the list before judging the named page", () => {
    renderList([], { url: "page=99", isLoading: true });

    expect(router.replace).not.toHaveBeenCalled();
  });

  it("lands on page 1 and rewrites the URL when the list has no such page, or the URL names none", () => {
    renderList(cards(5), { url: "page=99" });
    expect(router.replace).toHaveBeenCalledWith("?page=1", { scroll: false });

    router.replace.mockClear();
    renderList(cards(5));
    expect(router.replace).toHaveBeenCalledWith("?page=1", { scroll: false });
  });

  it("leaves the URL alone when the list failed to load", () => {
    renderList([], { url: "page=99", isError: true });

    expect(router.replace).not.toHaveBeenCalled();
  });
});
