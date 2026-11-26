"use client";

/**
 * The My Decks toolbar: the grid/list view switch and the sort order (from the
 * `sm` breakpoint up), then the AI wizard and New Deck buttons.
 *
 * The view switch is the shared `SegmentedControl`, so it is a named group
 * whose chosen view is marked without colour alone, like the other segmented
 * controls of the app (I-04, design audit S3).
 *
 * @module components/deck/DecksHomeControls
 */
import { useTranslations } from "next-intl";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { fieldShellClassName } from "@/components/ui/Input";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { cn } from "@/components/ui/utils";
import type {
  DecksSortDir,
  DecksSortKey,
  DecksViewMode,
} from "@/lib/deck/deck-listing";

/** The current view and sort of My Decks, and the toolbar's handlers. */
export type DecksHomeControlsProps = {
  readonly viewMode: DecksViewMode;
  readonly sortKey: DecksSortKey;
  readonly sortDir: DecksSortDir;
  readonly onSetViewMode: (mode: DecksViewMode) => void;
  readonly onSetSort: (key: DecksSortKey, dir: DecksSortDir) => void;
  readonly onOpenWizard: () => void;
  readonly onNewDeck: () => void;
  readonly disableNewDeck: boolean;
  readonly isCreating: boolean;
};

/**
 * Renders the My Decks toolbar. It holds no state: the page owns the view and
 * the sort, and each control reports the player's choice through its handler.
 *
 * @param props - see {@link DecksHomeControlsProps}
 */
export function DecksHomeControls({
  viewMode,
  sortKey,
  sortDir,
  onSetViewMode,
  onSetSort,
  onOpenWizard,
  onNewDeck,
  disableNewDeck,
  isCreating,
}: DecksHomeControlsProps) {
  const t = useTranslations("deck");

  return (
    <div className="flex items-center gap-2">
      <div className="hidden items-center gap-2 sm:flex">
        {/*
         * `md`: 32 px options; with the track's border, a 38 px switch level
         * with the row's sort select and wizard button. The border keeps the
         * track visible: its fill is the page's own `--background`, as on the
         * Collection and import switches.
         */}
        <SegmentedControl
          aria-label={t("controls.viewMode")}
          size="md"
          className="border border-[var(--border)]"
          options={[
            { value: "grid", label: t("controls.grid") },
            { value: "list", label: t("controls.list") },
          ]}
          value={viewMode}
          onChange={onSetViewMode}
        />

        <select
          value={`${sortKey}:${sortDir}`}
          onChange={(e) => {
            const [k, d] = e.target.value.split(":");
            if (k === "updatedAt" || k === "name" || k === "bracket") {
              const nextKey: DecksSortKey = k;
              if (d === "asc" || d === "desc") {
                const nextDir: DecksSortDir = d;
                onSetSort(nextKey, nextDir);
              }
            }
          }}
          className={cn(fieldShellClassName, "px-3 py-2")}
          aria-label={t("controls.sortDecks")}
        >
          <option value="updatedAt:desc">
            {t("controls.sortUpdatedNewest")}
          </option>
          <option value="updatedAt:asc">
            {t("controls.sortUpdatedOldest")}
          </option>
          <option value="name:asc">{t("controls.sortNameAsc")}</option>
          <option value="name:desc">{t("controls.sortNameDesc")}</option>
          <option value="bracket:asc">{t("controls.sortBracketAsc")}</option>
          <option value="bracket:desc">{t("controls.sortBracketDesc")}</option>
        </select>
      </div>

      <Button type="button" variant="secondary" size="sm" onClick={onOpenWizard}>
        <Sparkles className="h-4 w-4" />
        {t("controls.buildWithAI")}
      </Button>

      <Button type="button" variant="primary" size="sm" onClick={onNewDeck} disabled={disableNewDeck}>
        {isCreating ? (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        {t("controls.newDeck")}
      </Button>
    </div>
  );
}
