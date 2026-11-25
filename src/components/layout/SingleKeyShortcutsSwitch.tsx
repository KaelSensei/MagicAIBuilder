"use client";
/**
 * The single-key shortcut switch, shared by every shortcut list: the deck builder's list
 * (`KeyboardShortcutsModal`) and the playtest's cheat sheet (`PlaytestKeysDialog`). Both read and
 * write the one preference store, so turning it off in one list turns it off everywhere.
 *
 * @module components/layout/SingleKeyShortcutsSwitch
 */

import { useId } from "react";
import { useTranslations } from "next-intl";
import { useShortcutPreferencesStore } from "@/lib/ui/shortcut-preferences";
import { cn } from "@/components/ui/utils";

interface SingleKeyShortcutsSwitchProps {
  /** Classes merged over the bordered box, such as the builder list's outer margin. */
  readonly className?: string;
}

/**
 * The off switch for shortcuts pressed without Ctrl or ⌘, which speech-input
 * and screen-reader users need (WCAG 2.2 SC 2.1.4). A native checkbox with the
 * switch role, named by its label and described by the line under it.
 */
export function SingleKeyShortcutsSwitch({
  className,
}: SingleKeyShortcutsSwitchProps = {}) {
  const t = useTranslations("common");
  const descriptionId = useId();
  const enabled = useShortcutPreferencesStore(
    (s) => s.singleKeyShortcutsEnabled
  );
  const setEnabled = useShortcutPreferencesStore(
    (s) => s.setSingleKeyShortcutsEnabled
  );

  return (
    <div
      className={cn(
        "space-y-1 rounded-[var(--lumen-radius-lg)] border border-[var(--border)] p-3",
        className
      )}
    >
      <label className="flex items-center justify-between gap-4 text-sm font-medium text-[var(--text-primary)]">
        {t("shortcuts.singleKeyLabel")}
        <input
          type="checkbox"
          role="switch"
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
          aria-describedby={descriptionId}
          className="h-4 w-4 shrink-0 accent-[var(--accent)]"
        />
      </label>
      <p id={descriptionId} className="text-xs text-[var(--text-secondary)]">
        {t("shortcuts.singleKeyDescription")}
      </p>
    </div>
  );
}
