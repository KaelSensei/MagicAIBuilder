"use client";
/**
 * The export dialog's Registration sheet row: print the decklist registration
 * sheet, or download it as an `.html` file, with the notices of the cards it
 * leaves out (I-50, thirteenth-pass scope line).
 *
 * Deck interchange, UI. The sheet's headings and blank-line labels follow the
 * player's locale; card names print as stored. Not responsible for building
 * the sheet (`registrationSheetExport`) or for the text targets' rows
 * (`ExportModal`).
 *
 * @module components/deck/RegistrationSheetRow
 */
import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Download, Printer } from "lucide-react";
import {
  registrationSheetExport,
  type RegistrationSheetLabels,
} from "@/lib/deck/export";
import type { Deck } from "@/lib/deck/types";
import { downloadTextFile } from "@/lib/download-text-file";
import { printHtmlDocument } from "@/lib/print-html-document";
import { Button } from "@/components/ui/Button";
import { ExportNotices } from "./ExportNotices";

interface RegistrationSheetRowProps {
  /** The deck to print; it is not changed. */
  readonly deck: Deck;
}

/** The sheet's labels from the `deck.export.registrationSheet` catalogue, in the player's locale. */
function useRegistrationSheetLabels(): RegistrationSheetLabels {
  const t = useTranslations("deck.export.registrationSheet");
  const lang = useLocale();
  return useMemo(
    () => ({
      lang,
      title: t("title"),
      playerName: t("playerName"),
      event: t("event"),
      date: t("date"),
      signature: t("signature"),
      deckName: t("deckName"),
      format: t("format"),
      commander: t("commander"),
      companion: t("companion"),
      mainDeck: t("mainDeck"),
      sideboard: t("sideboard"),
      total: (count: number) => t("total", { count }),
    }),
    [t, lang]
  );
}

/** One row: a Print button, an `.html` download, and the sheet's notices. */
export function RegistrationSheetRow({ deck }: RegistrationSheetRowProps) {
  const t = useTranslations("deck.export");
  const labels = useRegistrationSheetLabels();
  const sheet = useMemo(
    () => registrationSheetExport(deck, labels),
    [deck, labels]
  );
  const rowLabel = t("registrationSheet.row");
  return (
    <div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => printHtmlDocument(sheet.content)}
          className="flex-1 justify-start"
        >
          <Printer className="w-3.5 h-3.5 text-[var(--text-secondary)] shrink-0" />
          {t("registrationSheet.print")}
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() =>
            downloadTextFile(sheet.content, sheet.fileName, sheet.mimeType)
          }
          title={t("downloadFormat", { format: rowLabel })}
        >
          <Download className="w-3.5 h-3.5" />
          .html
        </Button>
      </div>
      <ExportNotices format={rowLabel} notices={sheet.notices} />
    </div>
  );
}
