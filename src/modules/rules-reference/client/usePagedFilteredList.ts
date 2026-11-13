"use client";
/**
 * A list a visitor searches and pages through, with the current page mirrored
 * in the URL (`?page=N`) so it can be shared or reloaded.
 *
 * Rules reference context, `client/`: browser state and Next.js navigation, no
 * JSX. The Game Changers and banlist page composes it with its two Scryfall
 * lists; the items are opaque, the page supplies the search predicate.
 *
 * What it owns, as #1459 left it in the page:
 * - the search text and the filtered list (empty search keeps every item);
 * - the page slice and the pager's page, clamped to the last page;
 * - the URL: every page change writes `?page=N` and keeps the other query
 *   parameters; a new search starts over from page 1; a `?page=N` link opens
 *   page N once the list is known, and lands on page 1 when the list has no
 *   such page;
 * - the scroll: a page change brings `topRef` back into view, the first load of
 *   a link does not.
 *
 * @module rules-reference/client/usePagedFilteredList
 */
import {
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  type ReadonlyURLSearchParams,
  useRouter,
  useSearchParams,
} from "next/navigation";

/** What the hook needs from its caller: the list, how to search it, and its load state. */
export interface PagedFilteredListOptions<T> {
  /** The full list; `[]` while it loads. */
  readonly items: readonly T[];
  /**
   * Whether an item matches the search. `query` is the typed text trimmed and
   * lower-cased, never empty.
   */
  readonly matches: (item: T, query: string) => boolean;
  readonly pageSize: number;
  /** True until the list is known: the deep-link check waits for it. */
  readonly isLoading: boolean;
  /** True when the list failed to load: the deep-link check then leaves the URL alone. */
  readonly isError: boolean;
}

/** The search and page state the hook holds, with the actions that change it. */
export interface PagedFilteredList<T> {
  /** The search text as typed. */
  readonly search: string;
  /** Replaces the search text and returns to page 1. */
  readonly changeSearch: (value: string) => void;
  /** Every item the search keeps, in list order. */
  readonly filtered: readonly T[];
  /** The items of the current page. */
  readonly pageSlice: readonly T[];
  /** The page shown, between 1 and `totalPages`. */
  readonly currentPage: number;
  /** At least 1, so an empty list still has a page. */
  readonly totalPages: number;
  /** Shows `page`, writes it to the URL and scrolls `topRef` into view. */
  readonly goToPage: (page: number) => void;
  /** Attach to the element to bring back into view on a page change. */
  readonly topRef: RefObject<HTMLDivElement | null>;
}

/**
 * The page a `?page=N` link names, or `null` when the URL has no page or an unusable one
 * (`?page=0`, `?page=abc`, `?page=1.5`).
 */
function pageNamedByUrl(searchParams: ReadonlyURLSearchParams): number | null {
  const page = Number(searchParams.get("page"));
  return Number.isInteger(page) && page > 0 ? page : null;
}

/**
 * Searches and pages `items`, mirroring the page in the URL.
 *
 * @param options - the list, its search predicate, the page size and the load state
 * @returns the search and page state with the actions that change them
 */
export function usePagedFilteredList<T>({
  items,
  matches,
  pageSize,
  isLoading,
  isError,
}: PagedFilteredListOptions<T>): PagedFilteredList<T> {
  const searchParams = useSearchParams();
  const router = useRouter();
  const topRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");

  // A link may name a page; it is shown as soon as the list confirms it exists.
  const linkedPage = pageNamedByUrl(searchParams);
  const [currentPage, setCurrentPage] = useState(linkedPage ?? 1);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) => matches(item, query));
  }, [items, matches, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageSlice = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  // The URL mirrors the page so the visitor can share or reload it.
  const writePageToUrl = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(page));
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  // Pager navigation: show the page, write it to the URL, bring the title back into view.
  const goToPage = useCallback(
    (page: number) => {
      setCurrentPage(page);
      writePageToUrl(page);
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [writePageToUrl]
  );

  // Another search starts over from page 1.
  const changeSearch = useCallback(
    (value: string) => {
      setSearch(value);
      goToPage(1);
    },
    [goToPage]
  );

  // A link may name a page the list does not have, or no page at all: the visitor then lands on
  // page 1 and the URL says so (RR-01 pins this). The page count is known only once the list has
  // loaded, so the check waits for it and runs once. A link to a page the list has is left alone:
  // no reset, no URL write and no scroll, so the visitor sees the page they were sent to.
  const deepLinkChecked = useRef(false);
  useEffect(() => {
    if (deepLinkChecked.current || isLoading) return;
    deepLinkChecked.current = true;
    if (isError) return;
    const landingPage = currentPage > totalPages ? 1 : currentPage;
    if (landingPage === linkedPage) return;
    setCurrentPage(landingPage);
    writePageToUrl(landingPage);
  }, [isLoading, isError, currentPage, totalPages, linkedPage, writePageToUrl]);

  return {
    search,
    changeSearch,
    filtered,
    pageSlice,
    currentPage: safePage,
    totalPages,
    goToPage,
    topRef,
  };
}
