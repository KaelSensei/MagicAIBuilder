"use client";
/**
 * The "More" menu of a deck card row (I-37): "Add to my collection" and
 * "Add to another deck…", for a signed-in player.
 *
 * Deck-building context. Both actions need an account, so a guest, and a
 * signed-out visitor on the guest deck, see no menu. The menu is a Radix
 * dropdown, reachable by keyboard and named after the card; its trigger shows
 * on hover and on focus, as the row's other buttons do. A failed add to the
 * collection leaves a retry button on the row until an add is saved.
 *
 * @module card/CardRowMoreMenu
 */
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { MoreHorizontal, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { AddToOtherDeckDialog } from "@/components/deck/AddToOtherDeckDialog";
import { cn } from "@/components/ui/utils";
import { useAddRowToCollection } from "@/hooks/useAddRowToCollection";
import { useIsSignedIn } from "@/hooks/useIsSignedIn";
import { isGuestDeckId } from "@/lib/deck/guest-deck";
import { useDeckStore } from "@/lib/deck/store";
import type { DeckCard } from "@/lib/deck/types";

const ROW_BUTTON =
  "opacity-0 group-hover:opacity-60 focus-visible:opacity-100 hover:!opacity-100 data-[state=open]:opacity-100 transition-opacity p-0.5 rounded text-[var(--text-secondary)] hover:text-[var(--accent-text)]";
const MENU_ITEM =
  "cursor-pointer select-none rounded px-2 py-1.5 text-sm text-[var(--text-primary)] outline-none data-[highlighted]:bg-[var(--surface-hover)]";

/**
 * The row's "More actions" menu, or nothing when no player is signed in.
 */
export function CardRowMoreMenu({ card }: { readonly card: DeckCard }) {
  const t = useTranslations("builder.rowAddElsewhere");
  const isSignedIn = useIsSignedIn();
  const openDeckId = useDeckStore((s) => s.activeDeckId);
  const collection = useAddRowToCollection(card);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  if (!isSignedIn || openDeckId === null || isGuestDeckId(openDeckId)) {
    return null;
  }
  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            aria-label={t("moreActions", { name: card.name })}
            className={ROW_BUTTON}
          >
            <MoreHorizontal className="w-3 h-3" aria-hidden="true" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={4}
            className="z-50 min-w-[12rem] rounded-md border border-[var(--border)] bg-[var(--surface)] p-1 shadow-lg"
          >
            <DropdownMenu.Item
              className={MENU_ITEM}
              onSelect={() => void collection.add()}
            >
              {t("addToCollection")}
            </DropdownMenu.Item>
            <DropdownMenu.Item
              className={MENU_ITEM}
              onSelect={() => setIsPickerOpen(true)}
            >
              {t("addToOtherDeck")}
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      {collection.failed && (
        <button
          type="button"
          onClick={() => void collection.add()}
          aria-label={t("retryCollection", { name: card.name })}
          title={t("retryCollection", { name: card.name })}
          className={cn(ROW_BUTTON, "opacity-100 text-red-400")}
        >
          <RotateCcw className="w-3 h-3" aria-hidden="true" />
        </button>
      )}
      {isPickerOpen && (
        <AddToOtherDeckDialog
          card={card}
          openDeckId={openDeckId}
          onClose={() => setIsPickerOpen(false)}
        />
      )}
    </>
  );
}
