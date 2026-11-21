"use client";
/**
 * The builder's target for a card dragged or pasted from Scryfall or EDHREC (I-37): the hint
 * shown while an outside drag is over the window, and the messages that say what each drop did.
 *
 * Mounted once by the builder page with the zone the editor shows. It needs nothing else from
 * the page: the hook turns itself off while a dialog is open and decides everything else.
 *
 * @module components/builder/ExternalCardDropTarget
 */
import { useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  useExternalCardDrop,
  type ExternalCardDropOutcome,
} from "@/hooks/useExternalCardDrop";
import { useToastStore } from "@/hooks/useToast";
import type { DeckZone } from "@/lib/deck/types";

/** The `builder.zones` label of each zone, as the zone tabs name them. */
const ZONE_LABEL_KEYS: Readonly<
  Record<DeckZone, "main" | "sideboard" | "considering">
> = {
  main: "main",
  sideboard: "sideboard",
  maybeboard: "considering",
};

/** Props of {@link ExternalCardDropTarget}. */
export interface ExternalCardDropTargetProps {
  /** The zone the editor shows, where a dropped or pasted card lands. */
  readonly zone: DeckZone;
}

/**
 * Accepts a card dragged or pasted from another site into the zone the editor shows.
 *
 * Renders a polite live region that announces the drop hint once per drag, and a visual
 * overlay that ignores the pointer, so the drop reaches the window underneath.
 */
export function ExternalCardDropTarget({ zone }: ExternalCardDropTargetProps) {
  const t = useTranslations("builder.externalDrop");
  const tZones = useTranslations("builder.zones");
  const addToast = useToastStore((state) => state.add);

  const report = useCallback(
    (outcome: ExternalCardDropOutcome) => {
      switch (outcome.kind) {
        case "added":
          addToast(
            "success",
            t("added", {
              name: outcome.cardName,
              zone: tZones(ZONE_LABEL_KEYS[outcome.zone]),
            })
          );
          return;
        case "unreadable-link":
          addToast("error", t("unreadableLink"));
          return;
        case "lookup-failed":
          addToast("error", t("lookupFailed"));
          return;
        case "file":
          addToast("info", t("file"));
          return;
      }
      const unknown: never = outcome;
      return unknown;
    },
    [addToast, t, tZones]
  );

  const { isDragOver } = useExternalCardDrop({ zone, onOutcome: report });
  const hint = t("dropHint", { zone: tZones(ZONE_LABEL_KEYS[zone]) });

  return (
    <>
      <output aria-live="polite" className="sr-only">
        {isDragOver ? hint : null}
      </output>
      {isDragOver && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        >
          <p className="rounded-[var(--lumen-radius-xl)] border border-dashed border-[var(--accent)] bg-[var(--surface)] px-6 py-4 text-base font-semibold text-[var(--text-primary)] shadow-[var(--lumen-shadow-lg)]">
            {hint}
          </p>
        </div>
      )}
    </>
  );
}
