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
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "@/styles/globals.css";
import { routing } from "@/i18n/routing";
import { themeBootScript } from "@/lib/theme/preference";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
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
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} antialiased min-h-screen bg-[var(--background)] text-[var(--text-primary)]`}
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
