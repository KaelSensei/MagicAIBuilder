"use client";
/**
 * The playtest's cheat sheet: every key and what it does, read from the table the keyboard
 * handler reads (`PLAYTEST_HOTKEYS`), so the list cannot disagree with the keys.
 *
 * Context: playtest, the UI. `PlaytestKeys` opens it from its button or the `?` key. The key
 * letters are printed as they are in every language; only the descriptions are translated.
 *
 * @module components/playtest/PlaytestKeysDialog
 */

import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/Modal";
import { PLAYTEST_HOTKEYS } from "@/lib/playtest/hotkeys";
import { useShortcutPreferencesStore } from "@/lib/ui/shortcut-preferences";

interface PlaytestKeysDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

/**
 * A named modal dialog listing the playtest's keys. It says when the player's single-key
 * switch has turned the letters off, since only the Ctrl/⌘ chord then works. Focus returns to
 * whatever opened it.
 */
export function PlaytestKeysDialog({ open, onClose }: PlaytestKeysDialogProps) {
  const t = useTranslations("playtest.hotkeys");
  const singleKeysEnabled = useShortcutPreferencesStore(
    (s) => s.singleKeyShortcutsEnabled
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("title")}
      maxWidth="w-[460px] max-w-[90vw]"
    >
      <div className="space-y-3 px-5 py-4">
        <p className="text-xs text-[var(--text-secondary)]">{t("intro")}</p>
        {!singleKeysEnabled && (
          <p className="rounded-md border border-[var(--border)] px-3 py-2 text-xs text-[var(--text-primary)]">
            {t("singleKeysOff")}
          </p>
        )}
        <dl>
          {PLAYTEST_HOTKEYS.map((hotkey) => (
            <div
              key={hotkey.id}
              className="flex items-center gap-4 border-b border-[var(--border)]/50 py-2 last:border-0"
            >
              <dt className="flex w-28 shrink-0 items-center gap-1">
                {hotkey.labels.map((label) => (
                  <kbd
                    key={label}
                    className="inline-flex h-6 min-w-[1.75rem] items-center justify-center rounded border border-[var(--border)] bg-[var(--background)] px-1.5 font-mono text-xs text-[var(--text-primary)] shadow-sm"
                  >
                    {label}
                  </kbd>
                ))}
              </dt>
              <dd className="text-sm text-[var(--text-secondary)]">
                {t(`actions.${hotkey.id}`)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </Modal>
  );
}
