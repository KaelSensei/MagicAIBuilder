"use client";
// TanStack Query + NextAuth providers
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { useState } from "react";
import { CollectionProvider } from "@/components/providers/CollectionProvider";
import { ThemeSync } from "@/components/providers/ThemeSync";
import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";

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
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeSync />
        <CollectionProvider>
          <OnboardingProvider>{children}</OnboardingProvider>
        </CollectionProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
