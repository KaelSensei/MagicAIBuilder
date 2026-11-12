import { Header } from "@/components/layout/Header";
import { ComprehensiveRulesView } from "@/components/rules/ComprehensiveRulesView";
import { fixedPageMetadata } from "@/lib/seo/page-metadata";

export const generateMetadata = fixedPageMetadata("rules.comprehensive");

interface ComprehensiveRulesPageProps {
  readonly searchParams: Promise<{ chapter?: string; q?: string }>;
}

export default async function ComprehensiveRulesPage({
  searchParams,
}: ComprehensiveRulesPageProps) {
  const { chapter, q } = await searchParams;

  return (
    <div className="flex flex-col min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <Header />
      <ComprehensiveRulesView requestedChapter={chapter} requestedQuery={q} />
    </div>
  );
}
