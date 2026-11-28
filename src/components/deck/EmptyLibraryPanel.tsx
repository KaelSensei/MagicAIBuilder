"use client";

/**
 * What the deck library shows while the player owns no deck.
 *
 * Deck library context, page UI. It moved out of `app/[locale]/decks/page.tsx`
 * to keep that page under its size limit; the decks page still owns every
 * handler it calls.
 *
 * @module components/deck/EmptyLibraryPanel
 */

import { useId } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Layers, Loader2, Plus, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";

/** Props of {@link EmptyLibraryPanel}. */
export interface EmptyLibraryPanelProps {
  /** The page's "Create Deck": a deck in the format picked on the page. */
  readonly onCreate: () => void;
  readonly isCreating: boolean;
  /** The header's import: a dated deck, then the header's import dialog on it. */
  readonly onImport: () => void;
  readonly isImporting: boolean;
  readonly onOpenWizard: () => void;
}

/**
 * The library holds no deck: it says so, and offers the three ways to start
 * that the toolbar and the header already offer, "Create Deck" first (I-13
 * AC-13-05, design audit S11). "Import a decklist" runs the header's own
 * import, so the header's one import dialog opens. When it closes, focus goes
 * back to the header's desktop "Import", the dialog's trigger, at `md` widths
 * and up. Below `md` that button is hidden by CSS, so focus falls to `<body>`;
 * a fallback target is a follow-up.
 */
export function EmptyLibraryPanel({
  onCreate,
  isCreating,
  onImport,
  isImporting,
  onOpenWizard,
}: EmptyLibraryPanelProps) {
  const t = useTranslations("deck");
  const headingId = useId();
  return (
    <motion.section
      aria-labelledby={headingId}
      className="flex flex-wrap items-center justify-center gap-3 py-24 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex w-full flex-col items-center">
        <Layers className="mb-4 h-12 w-12 text-[var(--accent-text)] opacity-60" />
        <h2
          id={headingId}
          className="mb-2 text-lg font-semibold text-[var(--text-primary)]"
        >
          {t("home.startBuilding")}
        </h2>
        <p className="mb-3 max-w-sm text-sm text-[var(--text-secondary)]">
          {t("home.startBuildingDescription")}
        </p>
      </div>
      <button
        type="button"
        onClick={onCreate}
        disabled={isCreating}
        className="flex items-center gap-2 rounded-[var(--lumen-radius-pill)] bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white shadow-[var(--lumen-shadow-sm)] transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isCreating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        {t("home.createDeck")}
      </button>
      <Button
        variant="secondary"
        size="lg"
        onClick={onImport}
        disabled={isImporting}
      >
        {isImporting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        {t("home.importDeck")}
      </Button>
      <Button variant="secondary" size="lg" onClick={onOpenWizard}>
        <Sparkles className="h-4 w-4" />
        {t("controls.buildWithAI")}
      </Button>
    </motion.section>
  );
}
