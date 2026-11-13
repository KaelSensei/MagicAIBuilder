"use client";
/**
 * The Game Changers and Commander banlist page: two Scryfall lists behind tabs,
 * searched and paged in the browser, with a zoom and a printing selector.
 *
 * Rules reference context, `ui/`. A container: it owns the active list, the
 * zoomed card and the card whose printings are open, and composes
 * `useReferenceLists` (the two lists), `usePagedFilteredList` (search, page
 * slice and the `?page=N` URL sync), `ReferenceListTabs`, `PagedCardList`,
 * `CardZoomModal` and the catalog's `PrintingSelectorModal`.
 *
 * @module rules-reference/ui/GameChangersPageClient
 */
import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { usePagedFilteredList } from "@/modules/rules-reference/client/usePagedFilteredList";
import {
  type ReferenceList,
  useReferenceLists,
} from "@/modules/rules-reference/client/useReferenceLists";
import { CardZoomModal } from "@/modules/rules-reference/ui/CardZoomModal";
import { PagedCardList } from "@/modules/rules-reference/ui/PagedCardList";
import { ReferenceListTabs } from "@/modules/rules-reference/ui/ReferenceListTabs";
import { PrintingSelectorModal } from "@/components/card/PrintingSelectorModal";
import type { ScryfallCard } from "@/lib/scryfall/types";

/** Cards per page. */
const PAGE_SIZE = 25;

/**
 * Whether a card answers the typed search: by its oracle name or by the displayed (printed) one,
 * since a viewer reading a French list types the French name they see on screen.
 * `query` is already trimmed and lower-cased.
 */
function cardMatchesSearch(card: ScryfallCard, query: string): boolean {
  if (card.name.toLowerCase().includes(query)) return true;
  const printed = card.printed_name ?? card.card_faces?.[0]?.printed_name;
  return printed?.toLowerCase().includes(query) ?? false;
}

export function GameChangersPageClient() {
  const t = useTranslations("rules");

  const [activeList, setActiveList] = useState<ReferenceList>("game-changers");
  const [zoomedCard, setZoomedCard] = useState<ScryfallCard | null>(null);
  const [printingsCard, setPrintingsCard] = useState<ScryfallCard | null>(null);

  const lists = useReferenceLists(activeList);
  const { cards, isLoading, isError } = lists;
  const paged = usePagedFilteredList({
    items: cards,
    matches: cardMatchesSearch,
    pageSize: PAGE_SIZE,
    isLoading,
    isError,
  });
  const { goToPage } = paged;

  // Another list starts over from page 1.
  const selectList = useCallback(
    (next: ReferenceList) => {
      if (next === activeList) return;
      setActiveList(next);
      goToPage(1);
    },
    [activeList, goToPage]
  );

  // The printings open in place of the zoom, never on top of it.
  const handleOpenPrintings = useCallback(() => {
    if (zoomedCard) {
      setPrintingsCard(zoomedCard);
      setZoomedCard(null);
    }
  }, [zoomedCard]);

  return (
    <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6">
      {zoomedCard && (
        <CardZoomModal
          card={zoomedCard}
          cards={paged.pageSlice}
          onClose={() => setZoomedCard(null)}
          onNavigate={setZoomedCard}
          onOpenPrintings={handleOpenPrintings}
        />
      )}

      {printingsCard && (
        <PrintingSelectorModal
          card={printingsCard}
          onSelect={() => setPrintingsCard(null)}
          onClose={() => setPrintingsCard(null)}
        />
      )}

      <div ref={paged.topRef}>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {t("subtitle")}
        </p>
      </div>

      <ReferenceListTabs
        activeList={activeList}
        onSelect={selectList}
        gameChangersCount={lists.gameChangersCount}
        banlistCount={lists.banlistCount}
      />

      <PagedCardList
        list={activeList}
        paged={paged}
        isLoading={isLoading}
        isError={isError}
        onClickZoom={setZoomedCard}
      />
    </main>
  );
}
