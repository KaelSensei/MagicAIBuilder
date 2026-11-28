"use client";

/**
 * What the collection page shows while the player owns no card.
 *
 * Collection context, page UI. It used to be an icon, "Your collection is
 * empty." and no action. It now says what the collection is for and offers
 * "Add cards", which opens the page's one `AddToCollectionDialog` (I-13
 * AC-13-05, design audit S11). There is no "Import a list": the collection has
 * no list import yet.
 *
 * @module components/collection/EmptyCollection
 */

import { useTranslations } from "next-intl";
import { Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

/** Props of {@link EmptyCollection}. */
export interface EmptyCollectionProps {
  /** Opens the add-to-collection dialog the page hosts. */
  readonly onAddCards: () => void;
}

/**
 * The empty collection: what it is for, in one sentence, and "Add cards".
 *
 * The icon is decorative, so it is hidden from assistive technology and needs
 * no contrast of its own (WCAG 2.2, 1.4.11 applies to graphics "required to
 * understand the content", https://www.w3.org/TR/WCAG22/#non-text-contrast,
 * read 2026-11-26).
 */
export function EmptyCollection({ onAddCards }: EmptyCollectionProps) {
  const t = useTranslations("collection");
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center text-[var(--text-secondary)]">
      <Package className="h-10 w-10" aria-hidden="true" />
      <p className="text-sm">{t("empty.title")}</p>
      <p className="max-w-sm text-sm">{t("empty.purpose")}</p>
      <Button type="button" variant="primary" size="sm" onClick={onAddCards}>
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        {t("empty.addCards")}
      </Button>
    </div>
  );
}
