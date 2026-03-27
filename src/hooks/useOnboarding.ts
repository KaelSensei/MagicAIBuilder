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

export function useOnboarding() {
  const { data: session, status } = useSession();
  const [showWizard, setShowWizard] = useState(false);
  const [loading, setLoading] = useState(true);

  // Determine whether to show wizard on mount
  useEffect(() => {
    if (status === "loading") return;

    if (session?.user) {
      // Fetch onboardingDone from API
      fetch("/api/user/profile")
        .then((r) => r.json())
        .then((data: { onboardingDone?: boolean }) => {
          if (!data.onboardingDone) setShowWizard(true);
        })
        .catch(() => {
          // Fail silently — don't block UI on network error
        })
        .finally(() => setLoading(false));
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
  }, [session, status]);

  /** Mark onboarding as done (complete or skip) */
  const completeOnboarding = useCallback(async () => {
    setShowWizard(false);

    if (session?.user) {
      await fetch("/api/user/onboarding", { method: "POST" }).catch(() => {});
    } else {
      try {
        localStorage.setItem(LS_KEY, "true");
      } catch {
        // ignore
      }
    }
  }, [session]);

  /** Reset onboarding so wizard shows again (replay from settings) */
  const resetOnboarding = useCallback(async () => {
    if (session?.user) {
      await fetch("/api/user/onboarding", { method: "DELETE" }).catch(() => {});
    } else {
      try {
        localStorage.removeItem(LS_KEY);
      } catch {
        // ignore
      }
    }
    setShowWizard(true);
  }, [session]);

  return { showWizard, loading, completeOnboarding, resetOnboarding };
}
