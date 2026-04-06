"use client";
/**
 * LandingPage — renders 3D spellbook scene or static fallback
 * based on device capabilities and user preferences.
 */
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { StaticLandingPage } from "./StaticLandingPage";

const SpellbookScene = dynamic(
  () => import("./SpellbookScene"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-screen items-center justify-center bg-black">
        <div className="text-white/30 text-sm animate-pulse">Loading...</div>
      </div>
    ),
  }
);

/** Detect if the device should get the static fallback */
function shouldUseStaticFallback(): boolean {
  if (typeof globalThis.window === "undefined") return true;
  if (globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
  if (/iPhone|iPad|Android/i.test(globalThis.navigator.userAgent)) return true;
  return false;
}

export function LandingPage() {
  const [useStatic, setUseStatic] = useState(true);

  useEffect(() => {
    setUseStatic(shouldUseStaticFallback());
  }, []);

  if (useStatic) {
    return <StaticLandingPage />;
  }

  return <SpellbookScene />;
}
