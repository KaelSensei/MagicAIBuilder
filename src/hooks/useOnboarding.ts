"use client";
/**
 * useOnboarding — manages first-run wizard state.
 *
 * For authenticated users: reads onboardingDone from InitProvider (pre-fetched),
 * writes via POST/DELETE to /api/user/onboarding.
 * For unauthenticated users: falls back to localStorage.
 */
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useInitContext } from "@/components/providers/InitProvider";

const LS_KEY = "mab-onboarding-done";

export function useOnboarding() {
  const { data: session, status } = useSession();
  const { onboardingDone: initOnboardingDone } = useInitContext();
  const sessionUserId = typeof session?.user?.id === "string" ? session.user.id : null;
  const [showWizard, setShowWizard] = useState(false);
  const [loading, setLoading] = useState(true);

  // Resolve wizard visibility from InitProvider data or localStorage
  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated") {
      // Wait for InitProvider to resolve
      if (initOnboardingDone === null) return;
      setShowWizard(!initOnboardingDone);
      setLoading(false);
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
  }, [status, initOnboardingDone]);

  /** Mark onboarding as done (complete or skip) */
  const completeOnboarding = useCallback(async () => {
    setShowWizard(false);

    if (status === "authenticated" && sessionUserId) {
      await fetch("/api/user/onboarding", { method: "POST" }).catch(() => {
        // Fail silently — UI already updated optimistically
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
      await fetch("/api/user/onboarding", { method: "DELETE" }).catch(() => {
        // Fail silently
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
