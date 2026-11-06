"use client";
/**
 * InitProvider — single bootstrap fetch on authentication.
 * Calls GET /api/user/init which returns onboarding status + collection
 * in one request with parallel DB queries. Replaces separate
 * CollectionProvider + useOnboarding fetch.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useCollectionStore } from "@/lib/collection/store";
import { fetchUserInit } from "@/lib/auth/user-init";

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

export function InitProvider({ children }: { readonly children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const hydrateCollection = useCollectionStore((s) => s.hydrateCollection);
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  const [initializationStatus, setInitializationStatus] = useState<
    InitContextValue["initializationStatus"]
  >("idle");
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
        hydrateCollection(data.collection);
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
  }, [attempt, hydrateCollection, session?.user?.id, status]);

  const contextValue = useMemo(
    () => ({ onboardingDone, initializationStatus, retryInitialization }),
    [initializationStatus, onboardingDone, retryInitialization]
  );

  return <InitContext.Provider value={contextValue}>{children}</InitContext.Provider>;
}
