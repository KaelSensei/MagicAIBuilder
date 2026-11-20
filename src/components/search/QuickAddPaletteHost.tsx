"use client";
/**
 * The builder's quick-add control: a toolbar button and Ctrl/Cmd+K open the
 * palette, and the existing card search runs the planned query.
 *
 * Card catalog, quick add (I-37). Mounted beside the other deck actions. The
 * search panel's tabs, filters and grid are not this component. The query
 * keeps the open deck's colour identity (CR 903.5c) through `planQuickAddQuery`.
 *
 * @module search/QuickAddPaletteHost
 */
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { useCardSearch } from "@/hooks/useCardSearch";
import type { DeckZone } from "@/lib/deck/types";
import {
  planQuickAddQuery,
  type QuickAddReading,
  type QuickAddScope,
} from "@/lib/search/quick-add-query";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { QuickAddPalette, type QuickAddPhase } from "@/components/search/QuickAddPalette";

interface QuickAddPaletteHostProps {
  readonly scope: QuickAddScope;
  readonly onAdd: (card: ScryfallCard, zone: DeckZone) => void;
}

/**
 * The Quick add button and its palette.
 *
 * @param props - The open deck's search scope and the deck's add action
 * @returns The button, and the palette while it is open
 */
export function QuickAddPaletteHost({ scope, onAdd }: QuickAddPaletteHostProps) {
  const t = useTranslations("search");
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [reading, setReading] = useState<QuickAddReading>("name");
  useQuickAddShortcut(setOpen);

  const plan = planQuickAddQuery({ text, reading, scope });
  const search = useCardSearch(plan.kind === "idle" ? "" : plan.query);
  const cards = search.data?.data ?? [];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-full border border-[var(--border)] px-2.5 py-1.5 text-xs text-[var(--text-secondary)] transition-all hover:border-[var(--accent)] hover:text-[var(--text-primary)] md:px-3"
        aria-label={t("quickAdd.open")}
        title={t("quickAdd.shortcut")}
      >
        <Plus className="h-3 w-3" aria-hidden />
        <span className="hidden sm:inline">{t("quickAdd.open")}</span>
      </button>
      <QuickAddPalette
        open={open}
        onOpenChange={setOpen}
        text={text}
        onTextChange={setText}
        reading={reading}
        onReadingChange={setReading}
        scope={scope}
        cards={cards}
        phase={quickAddPhase({
        idle: plan.kind === "idle",
        isLoading: search.isLoading,
        isError: search.isError,
        count: cards.length,
      })}
        onAdd={onAdd}
      />
    </>
  );
}

/**
 * Ctrl+K, or Cmd+K on macOS, opens and closes quick add from anywhere in the builder.
 * The browser's address-bar binding of the same chord is cancelled.
 *
 * @param setOpen - The palette's open state
 */
function useQuickAddShortcut(setOpen: Dispatch<SetStateAction<boolean>>): void {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.isComposing || event.altKey || event.shiftKey) return;
      const mac = navigator.userAgent.toUpperCase().includes("MAC");
      const modifier = mac ? event.metaKey : event.ctrlKey;
      if (!modifier || event.key.toLowerCase() !== "k") return;
      event.preventDefault();
      setOpen((current) => !current);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);
}

/**
 * Which line the palette shows for this search.
 *
 * @param state - Whether the line is too short, and what the search is doing
 * @returns The phase
 */
function quickAddPhase(state: {
  readonly idle: boolean;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly count: number;
}): QuickAddPhase {
  if (state.idle) return "idle";
  if (state.isLoading) return "loading";
  if (state.isError) return "error";
  if (state.count === 0) return "empty";
  return "results";
}
