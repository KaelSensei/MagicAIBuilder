"use client";
/**
 * Share-link state of one deck, for its owner: whether a link is live, its
 * URL once known, and whether a request is in flight.
 *
 * A share link is a capability: whoever holds `/share/{token}` reads the deck
 * until the owner revokes it. `enable` switches the link on through
 * `POST /api/decks/[id]/share` and keeps the URL it answers; `revoke` closes
 * it through `DELETE`. The owner's deck says whether a link is live but never
 * carries the token (`deck-for-viewer.ts` omits it), so a deck that starts
 * enabled has no URL until `enable` recovers it: `POST` reuses the existing
 * token instead of rotating it.
 */
import { useState } from "react";
import { logger } from "@/lib/logger";

/** What the share popover reads and drives. */
export interface ShareLinkState {
  readonly isEnabled: boolean;
  /** The live link, or null while sharing is off or the URL is not recovered yet. */
  readonly shareUrl: string | null;
  /** True while a request is in flight; a second action is ignored meanwhile. */
  readonly loading: boolean;
  /** Switches sharing on, or recovers the URL of a link that is already live. */
  readonly enable: () => Promise<void>;
  /** Revokes the link; the state is unchanged when the server refuses. */
  readonly revoke: () => Promise<void>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Switches sharing on, or recovers the live link; null when the server refuses. */
async function requestShareLink(deckId: string): Promise<string | null> {
  const res = await fetch(`/api/decks/${deckId}/share`, { method: "POST" });
  if (!res.ok) return null;
  const body: unknown = await res.json();
  return isRecord(body) && typeof body.shareUrl === "string"
    ? body.shareUrl
    : null;
}

/** Revokes the link; false when the server refuses. */
async function revokeShareLink(deckId: string): Promise<boolean> {
  const res = await fetch(`/api/decks/${deckId}/share`, { method: "DELETE" });
  return res.ok;
}

/**
 * Share-link state of `deckId`, seeded with what the owner's deck reports.
 *
 * @param deckId - a deck the signed-in player owns
 * @param initialShareEnabled - `shareEnabled` as `GET /api/decks/[id]` reports it
 * @returns the state and the two actions; a failed request logs and leaves the state as it was
 */
export function useShareLink(
  deckId: string,
  initialShareEnabled: boolean
): ShareLinkState {
  const [isEnabled, setIsEnabled] = useState(initialShareEnabled);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async (action: () => Promise<void>): Promise<void> => {
    if (loading) return;
    setLoading(true);
    try {
      await action();
    } catch (err) {
      logger.error("Share link request failed", "useShareLink", err);
    } finally {
      setLoading(false);
    }
  };

  const enable = () =>
    run(async () => {
      const url = await requestShareLink(deckId);
      if (url === null) return;
      setIsEnabled(true);
      setShareUrl(url);
    });

  const revoke = () =>
    run(async () => {
      if (!(await revokeShareLink(deckId))) return;
      setIsEnabled(false);
      setShareUrl(null);
    });

  return { isEnabled, shareUrl, loading, enable, revoke };
}
