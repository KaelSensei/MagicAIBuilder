"use client";
/**
 * The "Collection" switch of the deck list toolbar: hides or shows the Owned
 * and Buy badges on the deck's rows (I-37 requirement 6.5).
 *
 * A toggle button: `aria-pressed` carries the state for assistive technology,
 * and the eye icon's shape (open or struck through) carries it on screen, so
 * the state is never told by colour alone (WCAG 1.4.1). The target is at least
 * 24 px high (WCAG 2.5.8).
 *
 * @module deck/CollectionBadgesToggle
 */
import { useTranslations } from "next-intl";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/components/ui/utils";
import { useHasCollectionCards } from "@/lib/collection/owned-quantity";
import { useDeckRowPreferencesStore } from "@/lib/ui/deck-row-preferences";

/**
 * Shows the switch only when there is something to hide: renders nothing while
 * the collection is empty (a guest, a player who has recorded no card, or a
 * collection still loading), as the badges themselves do.
 */
export function CollectionBadgesToggle() {
  const t = useTranslations("builder.collectionToggle");
  const hasCollection = useHasCollectionCards();
  const shown = useDeckRowPreferencesStore((s) => s.showCollectionBadges);
  const setShown = useDeckRowPreferencesStore((s) => s.setShowCollectionBadges);
  if (!hasCollection) return null;

  const Icon = shown ? Eye : EyeOff;
  return (
    <button
      type="button"
      onClick={() => setShown(!shown)}
      aria-pressed={shown}
      title={t(shown ? "hide" : "show")}
      className={cn(
        "ml-auto flex items-center gap-1 min-h-6 px-2 rounded text-[10px] font-medium transition-colors",
        shown
          ? "bg-[var(--accent)]/20 text-[var(--accent-text)]"
          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
      )}
    >
      <Icon className="w-3 h-3" aria-hidden="true" />
      {t("label")}
    </button>
  );
}
