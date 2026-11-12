import type { Metadata } from "next";
import { siteUrl } from "@/lib/seo/alternates";
import {
  metadataTranslations,
  type LocaleMetadataProps,
} from "@/lib/seo/page-metadata";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import localFont from "next/font/local";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "@/styles/globals.css";
import { routing } from "@/i18n/routing";
import { themeBootScript } from "@/lib/theme/preference";
import { Providers } from "./providers";

// The fonts are committed files, so `next build` reads them from disk instead
// of downloading them from Google Fonts, whose malformed answers failed
// builds (backlog row 54). Sources, licences, and how the files were cut to
// match what Google served: `src/styles/fonts/README.md`.

/** Geist, second in the body font stack (`globals.css`): Latin. */
const geistSans = localFont({
  src: "../../styles/fonts/geist/geist-variable-latin.woff2",
  weight: "100 900",
  variable: "--font-geist-sans",
});

/**
 * Inter, the body font: Latin, and Cyrillic for the `ru` locale. The weight
 * range is the 300–600 the app has always loaded; bolder text renders at
 * 600, as it did.
 */
const inter = localFont({
  src: "../../styles/fonts/inter/inter-variable-latin-cyrillic.woff2",
  weight: "300 600",
  variable: "--font-inter",
});

/**
 * Site-wide metadata, in the language of the page. Its title and description
 * are what every page without its own shows, the home page first among them.
 */
export async function generateMetadata({
  params,
}: LocaleMetadataProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await metadataTranslations(locale, "site");
  const title = t("title");
  const description = t("description");

  return {
    // Relative URLs below (the OG image) resolve against this. Without it Next
    // warns and falls back to localhost, so shared links carried a dead preview.
    metadataBase: new URL(siteUrl()),
    title: {
      default: title,
      template: "%s | MagicAIBuilder",
    },
    description,
    keywords: [
      "MTG",
      "Magic the Gathering",
      "Commander",
      "EDH",
      "deck builder",
    ],
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: "/og-image.svg", width: 1200, height: 630 }],
    },
  };
}

/** Pre-render all supported locales at build time. */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript() }} />
      </head>
      <body
        className={`${geistSans.variable} ${inter.variable} antialiased min-h-screen bg-[var(--background)] text-[var(--text-primary)]`}
      >
        {/* `locale` is passed explicitly rather than left to be inferred from
            the request context. next-intl can infer it, but only while that
            context is available — which is not guaranteed during a partial or
            streamed re-render, and the app has an intermittent
            "context from NextIntlClientProvider was not found" on exactly that
            path. This is hardening, not a proven fix: the flake has never been
            reproduced deliberately. */}
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
