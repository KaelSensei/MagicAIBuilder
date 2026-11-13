import { Header } from "@/components/layout/Header";
import { DeckReportQueue } from "@/components/moderation/DeckReportQueue";
import { auth } from "@/lib/auth/config";
import { isModerator } from "@/lib/auth/is-moderator";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

/**
 * Private moderation workspace for reports submitted against public decks.
 * Anyone without moderation access gets 404, not 403, so the page's existence
 * is not disclosed.
 */
export default async function ModerationReportsPage() {
  const session = await auth();
  if (!(await isModerator(session?.user?.id ?? null))) notFound();

  const t = await getTranslations("deck.moderation");
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <Header />
      <main className="mx-auto w-full max-w-5xl px-4 py-10 md:px-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent-text)]">
          {t("eyebrow")}
        </p>
        <h1 className="mt-2 text-2xl font-bold">{t("title")}</h1>
        <p className="mb-8 mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
          {t("description")}
        </p>
        <DeckReportQueue />
      </main>
    </div>
  );
}
