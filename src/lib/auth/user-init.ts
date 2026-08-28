"use client";

const USER_INIT_TIMEOUT_MS = 8_000;
const pendingRequests = new Map<string, Promise<UserInitData>>();

export interface UserInitData {
  readonly onboardingDone: boolean;
  readonly collection: readonly unknown[];
}

function isUserInitData(value: unknown): value is UserInitData {
  if (typeof value !== "object" || value === null) return false;

  return (
    "onboardingDone" in value &&
    typeof value.onboardingDone === "boolean" &&
    "collection" in value &&
    Array.isArray(value.collection)
  );
}

/**
 * Fetch the authenticated bootstrap payload with request deduplication and a hard timeout.
 *
 * @param userId - Stable authenticated user identifier used as the deduplication key
 * @returns The onboarding state and collection returned by the bootstrap endpoint
 */
export function fetchUserInit(userId: string): Promise<UserInitData> {
  const pending = pendingRequests.get(userId);
  if (pending) return pending;

  const request = fetchWithTimeout()
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`User initialization failed with HTTP ${response.status}`);
      }

      const data: unknown = await response.json();
      if (!isUserInitData(data)) {
        throw new Error("User initialization returned an invalid payload");
      }

      return data;
    })
    .finally(() => pendingRequests.delete(userId));

  pendingRequests.set(userId, request);
  return request;
}

async function fetchWithTimeout(): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), USER_INIT_TIMEOUT_MS);

  try {
    return await fetch("/api/user/init", { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}
