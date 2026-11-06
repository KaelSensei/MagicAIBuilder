"use client";
// Shared clipboard hook — copied state resets after 2 s
import { useCallback, useEffect, useRef, useState } from "react";

/** How long the "copied" flag stays on after a successful write. */
const COPY_RESET_MS = 2000;

/**
 * Copies text and reports whether the latest copy is still fresh.
 *
 * A second copy replaces the first timer. The flag stays true until two
 * seconds after the latest success, and a failed write leaves it unchanged.
 *
 * @returns a tuple of the copied flag and the copy function
 */
export function useCopyToClipboard(): [boolean, (text: string) => Promise<void>] {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearResetTimer = useCallback(() => {
    if (resetTimer.current === null) return;
    clearTimeout(resetTimer.current);
    resetTimer.current = null;
  }, []);

  useEffect(() => clearResetTimer, [clearResetTimer]);

  const copy = useCallback(async (text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      clearResetTimer();
      resetTimer.current = setTimeout(() => {
        resetTimer.current = null;
        setCopied(false);
      }, COPY_RESET_MS);
    } catch {
      // clipboard API unavailable — silently ignore
    }
  }, [clearResetTimer]);

  return [copied, copy];
}
