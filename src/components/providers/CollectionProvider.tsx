"use client";
// Loads the collection from the DB into the Zustand store at app startup
import { useEffect } from "react";
import { useCollectionStore } from "@/lib/collection/store";

export function CollectionProvider({ children }: { children: React.ReactNode }) {
  const loadCollection = useCollectionStore((s) => s.loadCollection);

  useEffect(() => {
    loadCollection();
  }, [loadCollection]);

  return <>{children}</>;
}
