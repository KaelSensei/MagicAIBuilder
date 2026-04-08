"use client";
/**
 * useOnboarding — manages first-run wizard state.
 *
 * For authenticated users: reads/writes onboardingDone via API.
 * For unauthenticated users: falls back to localStorage.
 */
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const LS_KEY = "mab-onboarding-done";
const AUTH_ONBOARDING_CACHE = new Map<string, boolean>();
const AUTH_ONBOARDING_REQUESTS = new Map<string, Promise<boolean>>();

interface OnboardingStatusResponse {
  readonly onboardingDone: boolean;
}

/**
 * Narrow unknown JSON into the onboarding payload shape.
 *
 * @param value - Unknown JSON payload returned by the API
 * @returns Whether the payload contains a boolean onboardingDone field
 */
function isOnboardingStatusResponse(value: unknown): value is OnboardingStatusResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "onboardingDone" in value &&
    typeof value.onboardingDone === "boolean"
  );
}

/**
 * Persist the latest authenticated onboarding status in the in-memory cache.
 *
 * @param userId - Authenticated user identifier
 * @param onboardingDone - Latest onboarding completion state
 * @returns Nothing
 */
function setCachedAuthenticatedOnboarding(userId: string, onboardingDone: boolean): void {
  AUTH_ONBOARDING_CACHE.set(userId, onboardingDone);
  AUTH_ONBOARDING_REQUESTS.delete(userId);
}

/**
 * Drop cached onboarding status after a failed mutation so the next page load revalidates.
 *
 * @param userId - Authenticated user identifier
 * @returns Nothing
 */
function clearCachedAuthenticatedOnboarding(userId: string): void {
  AUTH_ONBOARDING_CACHE.delete(userId);
  AUTH_ONBOARDING_REQUESTS.delete(userId);
}

/**
 * Fetch onboarding status once per authenticated user and share the pending request across mounts.
 *
 * @param userId - Authenticated user identifier
 * @returns Whether onboarding is already completed
 */
async function getAuthenticatedOnboardingStatus(userId: string): Promise<boolean> {
  const cached = AUTH_ONBOARDING_CACHE.get(userId);
  if (typeof cached === "boolean") {
    return cached;
  }

  const pendingRequest = AUTH_ONBOARDING_REQUESTS.get(userId);
  if (pendingRequest) {
    return pendingRequest;
  }

  const request = fetch("/api/user/onboarding")
    .then(async (response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch onboarding status");
      }

      const data: unknown = await response.json();
      const onboardingDone = isOnboardingStatusResponse(data) ? data.onboardingDone : false;
      AUTH_ONBOARDING_CACHE.set(userId, onboardingDone);
      return onboardingDone;
    })
    .finally(() => {
      AUTH_ONBOARDING_REQUESTS.delete(userId);
    });

  AUTH_ONBOARDING_REQUESTS.set(userId, request);
  return request;
}

export function useOnboarding() {
  const { data: session, status } = useSession();
  const sessionUserId = typeof session?.user?.id === "string" ? session.user.id : null;
  const [showWizard, setShowWizard] = useState(false);
  const [loading, setLoading] = useState(true);

  // Determine whether to show wizard on mount
  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated" && sessionUserId) {
      let isCurrent = true;

      getAuthenticatedOnboardingStatus(sessionUserId)
        .then((onboardingDone) => {
          if (!isCurrent) {
            return;
          }

          setShowWizard(!onboardingDone);
        })
        .catch(() => {
          // Fail silently — don't block UI on network error
        })
        .finally(() => {
          if (isCurrent) {
            setLoading(false);
          }
        });

      return () => {
        isCurrent = false;
      };
    } else {
      // Unauthenticated: use localStorage
      try {
        const done = localStorage.getItem(LS_KEY) === "true";
        if (!done) setShowWizard(true);
      } catch {
        // localStorage may be unavailable (SSR, private mode)
      }
      setLoading(false);
    }
  }, [sessionUserId, status]);

  /** Mark onboarding as done (complete or skip) */
  const completeOnboarding = useCallback(async () => {
    setShowWizard(false);

    if (status === "authenticated" && sessionUserId) {
      setCachedAuthenticatedOnboarding(sessionUserId, true);
      await fetch("/api/user/onboarding", { method: "POST" }).catch(() => {
        clearCachedAuthenticatedOnboarding(sessionUserId);
      });
    } else {
      try {
        localStorage.setItem(LS_KEY, "true");
      } catch {
        // ignore
      }
    }
  }, [sessionUserId, status]);

  /** Reset onboarding so wizard shows again (replay from settings) */
  const resetOnboarding = useCallback(async () => {
    if (status === "authenticated" && sessionUserId) {
      setCachedAuthenticatedOnboarding(sessionUserId, false);
      await fetch("/api/user/onboarding", { method: "DELETE" }).catch(() => {
        clearCachedAuthenticatedOnboarding(sessionUserId);
      });
    } else {
      try {
        localStorage.removeItem(LS_KEY);
      } catch {
        // ignore
      }
    }
    setShowWizard(true);
  }, [sessionUserId, status]);

  return { showWizard, loading, completeOnboarding, resetOnboarding };
}
