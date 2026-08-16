import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/layout/Header";

/**
 * Not-found page for anything inside the localised segment.
 *
 * It supplies its own `NextIntlClientProvider` on purpose. This page renders in
 * two very different situations:
 *
 * 1. A page under `[locale]` called `notFound()` — the layout rendered, so the
 *    provider is already in the tree.
 * 2. `[locale]/layout.tsx` itself called `notFound()` for an unsupported locale
 *    — the layout bailed *before* mounting the provider, so any client
 *    component using `useTranslations` here would throw
 *    "the context from NextIntlClientProvider was not found" and be retried on
 *    the client.
 *
 * Fetching messages server-side and wrapping locally covers both. Nesting a
 * second provider in case 1 is harmless.
 */
export default async function LocaleNotFound() {
  const [t, messages] = await Promise.all([
    getTranslations("common.notFound"),
    getMessages(),
  ]);

  return (
    <NextIntlClientProvider messages={messages}>
      <div className="flex flex-col min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
        <Header />

        <main className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-md w-full text-center">
            <p className="text-5xl font-bold opacity-20 mb-2">404</p>

            <h1 className="text-xl font-semibold mb-2">{t("title")}</h1>

            <p className="text-sm text-[var(--text-secondary)] mb-6">
              {t("description")}
            </p>

            <Link
              href="/decks"
              className="inline-block px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
            >
              {t("backToDecks")}
            </Link>
          </div>
        </main>
      </div>
    </NextIntlClientProvider>
  );
}
