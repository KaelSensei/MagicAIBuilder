"use client";
/**
 * The client-side composition root of every localized page: the session,
 * TanStack Query, the theme painter, the sign-in bootstrap and the app-wide
 * overlays (onboarding wizard, guest-deck claim offer, toasts).
 *
 * Wiring lives here, not in the providers it composes: the bootstrap payload
 * is handed to the collection store from this file, so `InitProvider` knows
 * no store (master plan P1-38).
 *
 * @module app/[locale]/providers
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { useCallback, useState } from "react";
import { InitProvider } from "@/components/providers/InitProvider";
import { ThemeSync } from "@/components/providers/ThemeSync";
import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";
import { GuestDeckClaimPrompt } from "@/components/deck/GuestDeckClaimPrompt";
import { ToastContainer } from "@/components/ui/Toast";
import type { UserInitData } from "@/lib/auth/user-init";
import { STALE_TIME_5MIN } from "@/lib/query/stale-times";
import { useCollectionStore } from "@/lib/collection/store";

export function Providers({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: STALE_TIME_5MIN,
            retry: 2,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const hydrateCollection = useCollectionStore(
    (state) => state.hydrateCollection
  );
  // The bootstrap payload carries the collection so that no signed-in page
  // fetches it a second time. Stable identity: InitProvider restarts the
  // request when this callback changes.
  const hydrateCollectionFromBootstrap = useCallback(
    (data: UserInitData) => hydrateCollection(data.collection),
    [hydrateCollection]
  );

  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <QueryClientProvider client={queryClient}>
        <ThemeSync />
        <InitProvider onInitialized={hydrateCollectionFromBootstrap}>
          <OnboardingProvider>{children}</OnboardingProvider>
          {/* Here rather than on one page: sign-in can return to any page. */}
          <GuestDeckClaimPrompt />
          {/* Mounted once here: it used to live only in the builder page, so
              toasts raised anywhere else were queued and never rendered. */}
          <ToastContainer />
        </InitProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
