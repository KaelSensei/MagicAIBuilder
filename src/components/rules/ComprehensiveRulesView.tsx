/**
 * ComprehensiveRulesView — server-rendered browser for the MTG Comprehensive
 * Rules. One chapter (or the glossary) is rendered at a time, selected via the
 * `?chapter=` query param; navigation is plain locale-aware links.
 */
import { getTranslations } from "next-intl/server";
import { BookOpen, Shield } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  loadComprehensiveRules,
  type RulesChapter,
} from "@/lib/rules/comprehensive";
import { cn } from "@/components/ui/utils";

const GLOSSARY_KEY = "glossary";

interface ComprehensiveRulesViewProps {
  /** Raw `?chapter=` value: a chapter number like "903", or "glossary". */
  readonly requestedChapter?: string;
}

function ChapterArticle({ chapter }: { readonly chapter: RulesChapter }) {
  return (
    <article className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">
        {chapter.number}. {chapter.title}
      </h2>
      {chapter.paragraphs.map((p, index) => {
        const isSubrule = p.ref !== null && /[a-z]$/.test(p.ref);
        const isExample = p.ref === null;
        return (
          <p
            key={p.ref ?? `${chapter.number}-${index}`}
            className={cn(
              "text-sm leading-relaxed text-[var(--text-primary)]",
              isSubrule && "ml-5",
              isExample && "ml-5 italic text-[var(--text-secondary)]"
            )}
          >
            {p.text}
          </p>
        );
      })}
    </article>
  );
}

export async function ComprehensiveRulesView({
  requestedChapter,
}: ComprehensiveRulesViewProps) {
  const t = await getTranslations("rules");
  const rules = loadComprehensiveRules();

  const allChapters = rules.sections.flatMap((s) => s.chapters);
  const showGlossary = requestedChapter === GLOSSARY_KEY;
  const activeChapter = showGlossary
    ? null
    : (allChapters.find((c) => c.number === requestedChapter) ??
      allChapters[0]);

  return (
    <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 flex flex-col gap-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          {t("comprehensive.title")}
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {t("comprehensive.subtitle")}{" "}
          {t("comprehensive.effectiveDate", { date: rules.effectiveDate })}
        </p>
      </div>

      {/* Tabs — links across the two rules pages */}
      <div className="flex gap-1 p-1 rounded-lg bg-[var(--surface)] border border-[var(--border)] w-fit">
        <Link
          href="/rules/game-changers"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <Shield className="w-3.5 h-3.5" />
          {t("title")}
        </Link>
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium bg-[var(--accent)] text-white">
          <BookOpen className="w-3.5 h-3.5" />
          {t("comprehensive.tabLabel")}
        </span>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Contents navigation */}
        <nav
          aria-label={t("comprehensive.contents")}
          className="md:w-64 shrink-0 flex flex-col gap-4 md:max-h-[70vh] md:overflow-y-auto md:sticky md:top-6"
        >
          {rules.sections.map((section) => (
            <div key={section.number}>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)] mb-1">
                {section.number}. {section.title}
              </p>
              <ul className="flex flex-col">
                {section.chapters.map((chapter) => (
                  <li key={chapter.number}>
                    <Link
                      href={{
                        pathname: "/rules/comprehensive",
                        query: { chapter: chapter.number },
                      }}
                      className={cn(
                        "block px-2 py-1 rounded text-sm transition-colors",
                        chapter.number === activeChapter?.number
                          ? "bg-[var(--accent)]/15 text-[var(--accent)] font-medium"
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      )}
                    >
                      {chapter.number}. {chapter.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <Link
            href={{
              pathname: "/rules/comprehensive",
              query: { chapter: GLOSSARY_KEY },
            }}
            className={cn(
              "block px-2 py-1 rounded text-sm font-semibold transition-colors",
              showGlossary
                ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            {t("comprehensive.glossary")}
          </Link>
        </nav>

        {/* Chapter content or glossary */}
        <div className="flex-1 min-w-0">
          {showGlossary ? (
            <article className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                {t("comprehensive.glossary")}
              </h2>
              <dl className="flex flex-col gap-3">
                {rules.glossary.map((entry) => (
                  <div key={entry.term}>
                    <dt className="text-sm font-semibold text-[var(--text-primary)]">
                      {entry.term}
                    </dt>
                    <dd className="text-sm leading-relaxed text-[var(--text-secondary)] whitespace-pre-line">
                      {entry.definition}
                    </dd>
                  </div>
                ))}
              </dl>
            </article>
          ) : (
            activeChapter && <ChapterArticle chapter={activeChapter} />
          )}
        </div>
      </div>
    </main>
  );
}
