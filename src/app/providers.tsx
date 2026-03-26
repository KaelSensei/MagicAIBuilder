"use client";
// TanStack Query + NextAuth providers
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { useState } from "react";
import { EnrichmentProvider } from "@/components/providers/EnrichmentProvider";
import { CollectionProvider } from "@/components/providers/CollectionProvider";
import { ThemeSync } from "@/components/providers/ThemeSync";

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
          <EnrichmentProvider>{children}</EnrichmentProvider>
        </CollectionProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
