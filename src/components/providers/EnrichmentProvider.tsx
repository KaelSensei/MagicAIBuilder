"use client";
// Syncs Game Changers and Banlist data into the Zustand store
import { useEffect } from "react";
import { useGameChangersSet } from "@/hooks/useGameChangers";
import { useBanlistSet } from "@/hooks/useBanlist";
import { useDeckStore } from "@/lib/deck/store";

export function EnrichmentProvider({ children }: { readonly children: React.ReactNode }) {
  const { gameChangerNames, isLoaded: gcLoaded } = useGameChangersSet();
  const { bannedNames, isLoaded: banLoaded } = useBanlistSet();
  const setGameChangerNames = useDeckStore((s) => s.setGameChangerNames);
  const setBannedNames = useDeckStore((s) => s.setBannedNames);

  useEffect(() => {
    if (gcLoaded) setGameChangerNames(gameChangerNames);
  }, [gcLoaded, gameChangerNames, setGameChangerNames]);

  useEffect(() => {
    if (banLoaded) setBannedNames(bannedNames);
  }, [banLoaded, bannedNames, setBannedNames]);

  return <>{children}</>;
}
