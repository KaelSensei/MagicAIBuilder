import { getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { SavedDeckLibrary } from "@/components/community/SavedDeckLibrary";

/** Private library of bookmarked public decks and personal folders. */
export default async function SavedDecksPage() {
  const t = await getTranslations("deck.savedFolders");
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
        <SavedDeckLibrary />
      </main>
    </div>
  );
}
