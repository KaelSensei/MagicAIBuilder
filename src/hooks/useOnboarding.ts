"use client";
/**
 * useOnboarding — manages first-run wizard state.
 *
 * For authenticated users: reads onboardingDone from InitProvider (pre-fetched),
 * writes via POST/DELETE to /api/user/onboarding.
 * For unauthenticated users: falls back to localStorage.
 *
 * The wizard is wanted for one of two reasons, and they differ on where it may
 * open. An onboarding not yet done opens it only where the page allows it
 * unasked (I-39 requirement 1.1: never on a public page). A replay the player
 * asked for opens it on whatever page they are on.
 */
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useInitContext } from "@/components/providers/InitProvider";

const LS_KEY = "mab-onboarding-done";

/** Why the wizard is wanted: not at all, onboarding not done yet, or a replay the player asked for. */
type OnboardingRequest = "none" | "first-run" | "replay";

/** Where the wizard is about to show. */
interface OnboardingPlacement {
  /** False on a page where the wizard must not open unless the player asks for it. */
  readonly mayOpenUnasked: boolean;
}

/**
 * First-run wizard state for the current visitor or account.
 *
 * @param placement Whether the current page lets the wizard open unasked.
 * @returns Whether to show the wizard, whether its state is still resolving,
 *   and the actions that finish or replay the onboarding.
 */
export function useOnboarding({ mayOpenUnasked }: OnboardingPlacement) {
  const { data: session, status } = useSession();
  const {
    onboardingDone: initOnboardingDone,
    initializationStatus,
  } = useInitContext();
  const sessionUserId = typeof session?.user?.id === "string" ? session.user.id : null;
  const [request, setRequest] = useState<OnboardingRequest>("none");
  const [loading, setLoading] = useState(true);

  // Resolve wizard visibility from InitProvider data or localStorage
  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated") {
      // Wait for InitProvider to resolve
      if (initializationStatus === "loading" || initializationStatus === "idle") return;
      if (initializationStatus === "error") {
        setRequest("none");
        setLoading(false);
        return;
      }
      if (initOnboardingDone === null) return;
      setRequest(initOnboardingDone ? "none" : "first-run");
      setLoading(false);
    } else {
      // Unauthenticated: use localStorage
      try {
        const done = localStorage.getItem(LS_KEY) === "true";
        if (!done) setRequest("first-run");
      } catch {
        // localStorage may be unavailable (SSR, private mode)
      }
      setLoading(false);
    }
  }, [initializationStatus, initOnboardingDone, status]);

  /** Mark onboarding as done (complete or skip) */
  const completeOnboarding = useCallback(async () => {
    setRequest("none");

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
    setRequest("replay");
  }, [sessionUserId, status]);

  const showWizard =
    request === "replay" || (request === "first-run" && mayOpenUnasked);

  return { showWizard, loading, completeOnboarding, resetOnboarding };
}
