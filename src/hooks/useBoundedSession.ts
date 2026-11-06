"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

/** A session request that is still pending after this long is shown as failed. */
export const SESSION_LOAD_TIMEOUT_MS = 8_000;

/**
 * Session status that cannot stay on "loading" forever.
 *
 * The last session payload from next-auth stays available. A stalled request
 * becomes a timeout the caller can retry.
 *
 * @returns Session data, whether the load timed out, and a retry callback
 */
export function useBoundedSession() {
  const { data, status, update } = useSession();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (status !== "loading") {
      setTimedOut(false);
      return;
    }
    const timeoutId = setTimeout(() => setTimedOut(true), SESSION_LOAD_TIMEOUT_MS);
    return () => clearTimeout(timeoutId);
  }, [status]);

  const retry = useCallback(() => {
    setTimedOut(false);
    void update();
  }, [update]);

  return { data, status, timedOut, retry };
}
