import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { GameChangersPageClient } from "@/components/rules/GameChangersPageClient";

export const metadata: Metadata = {
  title: "Game Changers & Banlist — MagicAIBuilder",
  description:
    "Browse the full list of Commander Game Changers and banned cards, with pagination.",
};

export default function GameChangersPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <Header />
      <Suspense fallback={null}>
        <GameChangersPageClient />
      </Suspense>
    </div>
  );
}
