import { getTranslations } from "next-intl/server";
import { AccountDataSection } from "@/components/settings/AccountDataSection";
import { Header } from "@/components/layout/Header";
import { fixedPageMetadata } from "@/lib/seo/page-metadata";

export const generateMetadata = fixedPageMetadata("settings.account", {
  // A private page about one account: nothing a search engine should list.
  robots: { index: false, follow: false },
});

/**
 * Settings → Account: a signed-in player downloads their account archive
 * (I-38 slice 5, export half). Account deletion arrives here with I-38
 * slice 3 and I-61 slice 3; until then the page only says so.
 *
 * Private: `/settings` is not a public path (`src/lib/auth/public-paths.ts`),
 * so the middleware sends a signed-out visitor to sign-in.
 */
export default async function AccountSettingsPage() {
  const t = await getTranslations("settings.account");
  return (
    <div className="flex h-screen flex-col bg-[var(--bg)] text-[var(--text-primary)]">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 overflow-y-auto p-6">
        <header className="space-y-1">
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            {t("title")}
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">{t("intro")}</p>
        </header>
        <AccountDataSection />
        <p className="text-sm text-[var(--text-secondary)]">
          {t("deletionComing")}
        </p>
      </main>
    </div>
  );
}
