import { Header } from "@/components/layout/Header";
import { DeckReportQueue } from "@/components/moderation/DeckReportQueue";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

/** Private moderation workspace for reports submitted against public decks. */
export default async function ModerationReportsPage() {
  const session = await auth();
  if (!session?.user?.id) notFound();
  const moderator = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isModerator: true },
  });
  if (!moderator?.isModerator) notFound();

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
