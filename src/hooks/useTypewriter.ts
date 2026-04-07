"use client";

import { useEffect, useState } from "react";

const TEXTS = [
  '\u2726 Ask AI: "Suggest 5 discard engines under $10"',
  '\u2726 Ask AI: "What should I cut to lower the curve?"',
  '\u2726 Ask AI: "Find me a finisher for this strategy"',
  '\u2726 Ask AI: "Is this deck Bracket 3 or 4?"',
] as const;

/** Default rotation interval in milliseconds */
const DEFAULT_INTERVAL_MS = 3500;

/**
 * Cycles through AI prompt texts on a timer.
 *
 * @param interval - rotation interval in ms (default 3500)
 * @returns the current prompt text
 */
export function useTypewriter(interval = DEFAULT_INTERVAL_MS): string {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setIndex((i) => (i + 1) % TEXTS.length),
      interval
    );
    return () => clearInterval(id);
  }, [interval]);

  return TEXTS[index];
}
