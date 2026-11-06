"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  applyAcquisitionChoice,
  readAcquisitionIntents,
  type AcquisitionChoice,
  type AcquisitionMode,
} from "@/lib/collection/acquisition-intent";

/**
 * Saved buy / proxy choices for one deck's shopping list.
 *
 * A failed toggle rolls back only that printing, and only when it is still the
 * latest toggle for that printing. Replacing the whole map would wipe a later
 * successful choice on a different card.
 *
 * @param deckId - deck whose intents are loaded and updated
 * @returns the current modes and a setter for one printing
 */
export function useAcquisitionIntent(deckId: string): {
  readonly intentById: Readonly<Record<string, AcquisitionMode>>;
  readonly setIntent: (scryfallId: string, mode: AcquisitionChoice) => void;
} {
  const [intentById, setIntentById] = useState<Readonly<Record<string, AcquisitionMode>>>({});
  const intentRef = useRef(intentById);
  const requestIds = useRef<Record<string, number>>({});

  const replaceIntents = useCallback((next: Readonly<Record<string, AcquisitionMode>>) => {
    intentRef.current = next;
    setIntentById(next);
  }, []);

  useEffect(() => {
    let active = true;
    void fetch(`/api/decks/${encodeURIComponent(deckId)}/acquisition-intent`)
      .then(async (response) => (response.ok ? response.json() : { intents: [] }))
      .then((payload: unknown) => {
        if (!active) return;
        const intents = readAcquisitionIntents(payload);
        if (intents === null) return;
        replaceIntents(intents);
      })
      .catch(() => {
        if (active) replaceIntents({});
      });
    return () => {
      active = false;
    };
  }, [deckId, replaceIntents]);

  const setIntent = useCallback(
    (scryfallId: string, mode: AcquisitionChoice) => {
      const previous = intentRef.current[scryfallId];
      const requestId = (requestIds.current[scryfallId] ?? 0) + 1;
      requestIds.current[scryfallId] = requestId;
      replaceIntents(applyAcquisitionChoice(intentRef.current, scryfallId, mode));

      const revert = () => {
        if (requestIds.current[scryfallId] !== requestId) return;
        replaceIntents(
          applyAcquisitionChoice(intentRef.current, scryfallId, previous ?? "buy_now")
        );
      };

      void fetch(`/api/decks/${encodeURIComponent(deckId)}/acquisition-intent`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ scryfallId, mode }),
      })
        .then((response) => {
          if (!response.ok) revert();
        })
        .catch(() => revert());
    },
    [deckId, replaceIntents]
  );

  return { intentById, setIntent };
}
