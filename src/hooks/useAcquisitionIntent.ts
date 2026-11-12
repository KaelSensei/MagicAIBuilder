"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  applyAcquisitionChoice,
  readAcquisitionIntents,
  type AcquisitionChoice,
  type AcquisitionMode,
} from "@/lib/collection/acquisition-intent";

/**
 * Lays the choices made while a load was in flight over the loaded map.
 *
 * The load answers with the rows as they were when the request left, so a
 * choice saved in the meantime is newer than the row it would replace.
 *
 * @param loaded - the deck's saved modes as the route answered
 * @param choices - the choices made since the load was requested
 * @returns `loaded` with each choice applied to its printing
 */
function overlayChoices(
  loaded: Readonly<Record<string, AcquisitionMode>>,
  choices: Readonly<Record<string, AcquisitionChoice>>
): Readonly<Record<string, AcquisitionMode>> {
  return Object.entries(choices).reduce(
    (merged, [scryfallId, choice]) =>
      applyAcquisitionChoice(merged, scryfallId, choice),
    loaded
  );
}

/**
 * Saved buy / proxy choices for one deck's shopping list.
 *
 * A failed toggle rolls back only that printing, and only when it is still the
 * latest toggle for that printing. Replacing the whole map would wipe a later
 * successful choice on a different card. For the same reason the load, when it
 * answers, keeps every choice made while it was in flight.
 *
 * @param deckId - deck whose intents are loaded and updated
 * @returns the current modes and a setter for one printing
 */
export function useAcquisitionIntent(deckId: string): {
  readonly intentById: Readonly<Record<string, AcquisitionMode>>;
  readonly setIntent: (scryfallId: string, mode: AcquisitionChoice) => void;
} {
  const [intentById, setIntentById] = useState<
    Readonly<Record<string, AcquisitionMode>>
  >({});
  const intentRef = useRef(intentById);
  /**
   * The id of the latest save per printing, drawn from one counter so a save
   * of an earlier deck can never match a later one, and emptied on deck change.
   */
  const latestRequestIds = useRef<Record<string, number>>({});
  const requestCount = useRef(0);
  /** Choices still standing since the current load was requested, by printing. */
  const choicesSinceLoad = useRef<Record<string, AcquisitionChoice>>({});

  const replaceIntents = useCallback(
    (next: Readonly<Record<string, AcquisitionMode>>) => {
      intentRef.current = next;
      setIntentById(next);
    },
    []
  );

  useEffect(() => {
    let active = true;
    choicesSinceLoad.current = {};
    latestRequestIds.current = {};
    void fetch(`/api/decks/${encodeURIComponent(deckId)}/acquisition-intent`)
      .then(async (response) =>
        response.ok ? response.json() : { intents: [] }
      )
      .then((payload: unknown) => {
        if (!active) return;
        // An answer the hook cannot read counts as no intent, like a failed
        // request: the new deck must never show the previous deck's choices.
        const intents = readAcquisitionIntents(payload) ?? {};
        replaceIntents(overlayChoices(intents, choicesSinceLoad.current));
      })
      .catch(() => {
        if (active)
          replaceIntents(overlayChoices({}, choicesSinceLoad.current));
      });
    return () => {
      active = false;
    };
  }, [deckId, replaceIntents]);

  const setIntent = useCallback(
    (scryfallId: string, mode: AcquisitionChoice) => {
      const previous = intentRef.current[scryfallId];
      const requestId = ++requestCount.current;
      latestRequestIds.current[scryfallId] = requestId;
      choicesSinceLoad.current[scryfallId] = mode;
      replaceIntents(
        applyAcquisitionChoice(intentRef.current, scryfallId, mode)
      );

      const revert = () => {
        if (latestRequestIds.current[scryfallId] !== requestId) return;
        // The server never took this choice: the loaded row is the truth again.
        delete choicesSinceLoad.current[scryfallId];
        replaceIntents(
          applyAcquisitionChoice(
            intentRef.current,
            scryfallId,
            previous ?? "buy_now"
          )
        );
      };

      void fetch(
        `/api/decks/${encodeURIComponent(deckId)}/acquisition-intent`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ scryfallId, mode }),
        }
      )
        .then((response) => {
          if (!response.ok) revert();
        })
        .catch(() => revert());
    },
    [deckId, replaceIntents]
  );

  return { intentById, setIntent };
}
