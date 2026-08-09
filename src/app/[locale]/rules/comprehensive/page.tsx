import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { ComprehensiveRulesView } from "@/components/rules/ComprehensiveRulesView";

export const metadata: Metadata = {
  title: "Comprehensive Rules — MagicAIBuilder",
  description:
    "Browse the official Magic: The Gathering Comprehensive Rules, chapter by chapter, including the full glossary.",
};

interface ComprehensiveRulesPageProps {
  readonly searchParams: Promise<{ chapter?: string }>;
}

export default async function ComprehensiveRulesPage({
  searchParams,
}: ComprehensiveRulesPageProps) {
  const { chapter } = await searchParams;

  return (
    <div className="flex flex-col min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <Header />
      <ComprehensiveRulesView requestedChapter={chapter} />
    </div>
  );
}
