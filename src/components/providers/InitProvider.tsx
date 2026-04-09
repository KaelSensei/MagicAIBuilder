"use client";
/**
 * InitProvider — single bootstrap fetch on authentication.
 * Calls GET /api/user/init which returns onboarding status + collection
 * in one request with parallel DB queries. Replaces separate
 * CollectionProvider + useOnboarding fetch.
 */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useCollectionStore } from "@/lib/collection/store";

interface InitContextValue {
  /** null = not yet loaded, boolean = resolved */
  readonly onboardingDone: boolean | null;
}

const InitContext = createContext<InitContextValue>({ onboardingDone: null });

/** Read pre-fetched onboarding status from InitProvider */
export function useInitContext(): InitContextValue {
  return useContext(InitContext);
}

interface InitResponse {
  readonly onboardingDone: boolean;
  readonly collection: readonly unknown[];
}

function isInitResponse(value: unknown): value is InitResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "onboardingDone" in value &&
    typeof (value as Record<string, unknown>).onboardingDone === "boolean" &&
    "collection" in value &&
    Array.isArray((value as Record<string, unknown>).collection)
  );
}

export function InitProvider({ children }: { readonly children: React.ReactNode }) {
  const { status } = useSession();
  const hydrateCollection = useCollectionStore((s) => s.hydrateCollection);
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;

    let isCurrent = true;

    fetch("/api/user/init")
      .then(async (res) => {
        if (!res.ok || !isCurrent) return;
        const data: unknown = await res.json();
        if (!isCurrent || !isInitResponse(data)) return;

        hydrateCollection(data.collection);
        setOnboardingDone(data.onboardingDone);
      })
      .catch(() => {
        // Fail silently — don't block UI on network error
      });

    return () => {
      isCurrent = false;
    };
  }, [status, hydrateCollection]);

  const contextValue = useMemo(() => ({ onboardingDone }), [onboardingDone]);

  return <InitContext.Provider value={contextValue}>{children}</InitContext.Provider>;
}
