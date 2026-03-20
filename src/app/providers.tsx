"use client";
// TanStack Query provider
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { EnrichmentProvider } from "@/components/providers/EnrichmentProvider";

export function Providers({ children }: { children: React.ReactNode }) {
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
    <QueryClientProvider client={queryClient}>
      <EnrichmentProvider>{children}</EnrichmentProvider>
    </QueryClientProvider>
  );
}
