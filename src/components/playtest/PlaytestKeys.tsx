"use client";
/**
 * The playtest's keyboard control: the "Keys" button, the cheat sheet it opens, and the
 * listener that turns the playtest's keys into moves.
 *
 * Context: playtest, the UI. `PlaytestModal` mounts it once in its header, so the keys work for
 * as long as the playtest is open, from the start screen on. Each key sends its command through
 * the store's `dispatch`, as the buttons do.
 *
 * @module components/playtest/PlaytestKeys
 */

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { Keyboard } from "lucide-react";
import { usePlaytestStore } from "@/lib/playtest/store";
import { PlaytestKeysDialog } from "@/components/playtest/PlaytestKeysDialog";
import { usePlaytestHotkeys } from "@/components/playtest/usePlaytestHotkeys";

/** The "Keys" button and cheat sheet, and the playtest's keyboard while it is mounted. */
export function PlaytestKeys() {
  const t = useTranslations("playtest.hotkeys");
  const dispatch = usePlaytestStore((s) => s.dispatch);
  const [open, setOpen] = useState(false);
  const showKeys = useCallback(() => setOpen(true), []);
  const closeKeys = useCallback(() => setOpen(false), []);

  usePlaytestHotkeys({
    onDispatch: dispatch,
    onShowKeys: showKeys,
    paused: open,
  });

  return (
    <>
      <button
        type="button"
        onClick={showKeys}
        aria-haspopup="dialog"
        title={t("openHint")}
        className="flex shrink-0 items-center gap-1.5 rounded px-2 py-1 text-xs text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
      >
        <Keyboard className="h-3.5 w-3.5" aria-hidden="true" />
        {t("open")}
      </button>
      <PlaytestKeysDialog open={open} onClose={closeKeys} />
    </>
  );
}
