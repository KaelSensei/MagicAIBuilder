"use client";
/**
 * The deck editor's layout controls: list or grid, and, in the grid, how many
 * cards per row. Both are segmented controls, so each option is a 28 px
 * target, the chosen one is marked without colour alone and pressed for a
 * screen reader (design audit S3). They were 20 px buttons, and the density
 * buttons exposed no state.
 *
 * Reads and writes the deck store's view preferences; the editor reads the
 * same preferences to lay its zones out.
 *
 * @module components/deck/DeckLayoutControls
 */
import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { LayoutGrid, List, Rows3 } from "lucide-react";
import {
  SegmentedControl,
  type SegmentedOption,
} from "@/components/ui/SegmentedControl";
import { useDeckStore, type DeckStore } from "@/lib/deck/store";

type DeckViewMode = DeckStore["deckViewMode"];
type GridDensity = DeckStore["deckGridCols"];

/** The grid densities the editor offers, in cards per row. */
const GRID_DENSITIES: readonly GridDensity[] = [2, 3, 4, 6, 8];

/**
 * The density an option value stands for. The control's values are strings,
 * so a density travels as its decimal digits.
 */
function densityOf(value: string): GridDensity | undefined {
  return GRID_DENSITIES.find((density) => String(density) === value);
}

/**
 * List and grid toggles, then, in the grid, the density toggles: each shows
 * its icon or number and is named for screen readers ("4 cards per row").
 */
export function DeckLayoutControls() {
  const t = useTranslations("builder");
  const viewMode = useDeckStore((s) => s.deckViewMode);
  const setViewMode = useDeckStore((s) => s.setDeckViewMode);
  const gridCols = useDeckStore((s) => s.deckGridCols);
  const setGridCols = useDeckStore((s) => s.setDeckGridCols);

  const chooseDensity = useCallback(
    (value: string) => {
      const density = densityOf(value);
      if (density !== undefined) setGridCols(density);
    },
    [setGridCols]
  );

  const viewOptions: readonly SegmentedOption<DeckViewMode>[] = [
    {
      value: "list",
      label: t("viewMode.listView"),
      icon: <List className="h-3 w-3" />,
      hideLabel: true,
    },
    {
      value: "grid",
      label: t("viewMode.gridView"),
      icon: <LayoutGrid className="h-3 w-3" />,
      hideLabel: true,
    },
  ];
  const densityOptions = GRID_DENSITIES.map(
    (density): SegmentedOption<string> => ({
      value: String(density),
      label: t("viewMode.cardsPerRow", { count: density }),
      icon: density,
      hideLabel: true,
    })
  );

  return (
    <>
      <SegmentedControl
        aria-label={t("viewMode.layout")}
        options={viewOptions}
        value={viewMode}
        onChange={setViewMode}
      />
      {viewMode === "grid" && (
        <div className="ml-1 flex items-center gap-0.5 border-l border-[var(--border)] pl-1">
          <Rows3 className="mr-0.5 h-3 w-3 text-[var(--text-secondary)]" />
          <SegmentedControl
            aria-label={t("viewMode.density")}
            options={densityOptions}
            value={String(gridCols)}
            onChange={chooseDensity}
          />
        </div>
      )}
    </>
  );
}
