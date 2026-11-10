"use client";
// TanStack Query + NextAuth providers
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { useState } from "react";
import { InitProvider } from "@/components/providers/InitProvider";
import { ThemeSync } from "@/components/providers/ThemeSync";
import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";
import { GuestDeckClaimPrompt } from "@/components/deck/GuestDeckClaimPrompt";
import { ToastContainer } from "@/components/ui/Toast";

export function Providers({ children }: { readonly children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 min default
            retry: 2,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <QueryClientProvider client={queryClient}>
        <ThemeSync />
        <InitProvider>
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
