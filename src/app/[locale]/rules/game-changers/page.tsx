import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { GameChangersPageClient } from "@/components/rules/GameChangersPageClient";
import { fixedPageMetadata } from "@/lib/seo/page-metadata";

export const generateMetadata = fixedPageMetadata("rules.gameChangers");

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
