"use client";
/**
 * useApiKeys — list, create and revoke the signed-in user's API credentials.
 *
 * The created token is held in its own piece of state, apart from the key list,
 * because it has a different lifetime from everything else here: the list can
 * be refetched at will, the token exists exactly once and only in the response
 * that minted it. Merging them would invite a refetch that quietly drops it.
 */
import { useCallback, useEffect, useState } from "react";

export interface ApiKeySummary {
  readonly id: string;
  readonly name: string;
  readonly displayPrefix: string;
  readonly scopes: readonly string[];
  readonly revokedAt: string | null;
  readonly expiresAt: string | null;
  readonly lastUsedAt: string | null;
  readonly createdAt: string;
}

export interface CreateKeyInput {
  readonly name: string;
  readonly scopes?: readonly string[];
  readonly expiresInDays?: number;
}

interface ListResponse {
  keys?: ApiKeySummary[];
  error?: string;
}

interface CreateResponse {
  key?: ApiKeySummary;
  token?: string;
  error?: string;
}

const ENDPOINT = "/api/user/api-keys";

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    return body.error ?? `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

export function useApiKeys() {
  const [keys, setKeys] = useState<readonly ApiKeySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** The one and only time this token exists in the browser. */
  const [freshToken, setFreshToken] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(ENDPOINT);
      if (!res.ok) throw new Error(await readError(res));
      const data = (await res.json()) as ListResponse;
      setKeys(data.keys ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load API keys");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createKey = useCallback(
    async (input: CreateKeyInput): Promise<boolean> => {
      setIsSubmitting(true);
      setError(null);
      try {
        const res = await fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        if (!res.ok) throw new Error(await readError(res));
        const data = (await res.json()) as CreateResponse;
        if (!data.token) throw new Error("The server did not return a token");

        // Surfaced before the list is refetched. If the refetch failed and this
        // were set after it, the token would be lost to a network blip — and it
        // cannot be recovered from anywhere.
        setFreshToken(data.token);
        await refresh();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create the API key");
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [refresh]
  );

  const revokeKey = useCallback(
    async (id: string): Promise<boolean> => {
      setError(null);
      try {
        const res = await fetch(`${ENDPOINT}/${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error(await readError(res));
        await refresh();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to revoke the API key");
        return false;
      }
    },
    [refresh]
  );

  /** Called when the user has confirmed they stored the token. */
  const dismissFreshToken = useCallback(() => setFreshToken(null), []);

  return {
    keys,
    isLoading,
    isSubmitting,
    error,
    freshToken,
    createKey,
    revokeKey,
    refresh,
    dismissFreshToken,
  };
}
