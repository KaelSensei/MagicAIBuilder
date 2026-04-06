"use client";
// Loads the collection from the DB into the Zustand store — only when authenticated
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useCollectionStore } from "@/lib/collection/store";

export function CollectionProvider({ children }: { readonly children: React.ReactNode }) {
  const { status } = useSession();
  const loadCollection = useCollectionStore((s) => s.loadCollection);

  useEffect(() => {
    if (status === "authenticated") {
      loadCollection();
    }
  }, [status, loadCollection]);

  return <>{children}</>;
}
