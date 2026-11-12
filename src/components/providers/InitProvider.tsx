"use client";
/**
 * The sign-in bootstrap: one GET /api/user/init answers the onboarding status
 * and the player's collection, and `useInitContext` reports the request's
 * progress to the pages that wait on it.
 *
 * Identity context, browser side. The provider owns the request lifecycle
 * only. What the app does with the payload (hydrating the collection store)
 * is composed by `app/[locale]/providers.tsx` through `onInitialized`, so
 * this module depends on no store (master plan P1-38).
 *
 * @module providers/InitProvider
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import { fetchUserInit, type UserInitData } from "@/lib/auth/user-init";

interface InitContextValue {
  /** null = not yet loaded, boolean = resolved */
  readonly onboardingDone: boolean | null;
  /** Whether the bootstrap request is idle, pending, ready, or failed. */
  readonly initializationStatus: "idle" | "loading" | "ready" | "error";
  /** Ask for the bootstrap payload again after a timeout or a failed response. */
  readonly retryInitialization: () => void;
}

const InitContext = createContext<InitContextValue>({
  onboardingDone: null,
  initializationStatus: "idle",
  retryInitialization: () => undefined,
});

/** Read pre-fetched onboarding status from InitProvider */
export function useInitContext(): InitContextValue {
  return useContext(InitContext);
}

interface InitProviderProps {
  readonly children: React.ReactNode;
  /**
   * Receives every successful bootstrap payload, retries included, before
   * the context turns ready. Keep its identity stable (`useCallback`): the
   * request restarts when it changes, as it does when the session changes.
   */
  readonly onInitialized: (data: UserInitData) => void;
}

/**
 * Runs the bootstrap request for the signed-in user and publishes its state.
 *
 * Signed out, the context stays idle with an unknown onboarding status. A
 * failed or timed-out request turns the status to error and leaves the
 * payload callback silent; `retryInitialization` sends the request again.
 */
export function InitProvider({
  children,
  onInitialized,
}: Readonly<InitProviderProps>) {
  const { data: session, status } = useSession();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  const [initializationStatus, setInitializationStatus] =
    useState<InitContextValue["initializationStatus"]>("idle");
  const [attempt, setAttempt] = useState(0);
  const retryInitialization = useCallback(() => {
    setAttempt((current) => current + 1);
  }, []);

  useEffect(() => {
    if (status !== "authenticated") {
      setOnboardingDone(null);
      setInitializationStatus("idle");
      return;
    }

    let isCurrent = true;
    setInitializationStatus("loading");

    const userId = session?.user?.id ?? "authenticated";

    fetchUserInit(userId)
      .then((data) => {
        if (!isCurrent) return;
        onInitialized(data);
        setOnboardingDone(data.onboardingDone);
        setInitializationStatus("ready");
      })
      .catch(() => {
        if (!isCurrent) return;
        setInitializationStatus("error");
      });

    return () => {
      isCurrent = false;
    };
  }, [attempt, onInitialized, session?.user?.id, status]);

  const contextValue = useMemo(
    () => ({ onboardingDone, initializationStatus, retryInitialization }),
    [initializationStatus, onboardingDone, retryInitialization]
  );

  return (
    <InitContext.Provider value={contextValue}>{children}</InitContext.Provider>
  );
}
