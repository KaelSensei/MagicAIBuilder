import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Geist, Geist_Mono, Cinzel, Cinzel_Decorative, Inter } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "@/styles/globals.css";
import { routing } from "@/i18n/routing";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-cinzel",
});

const cinzelDeco = Cinzel_Decorative({
  subsets: ["latin"],
  weight: ["700", "900"],
  variable: "--font-cinzel-deco",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "MagicAIBuilder — Commander Deck Builder",
    template: "%s | MagicAIBuilder",
  },
  description:
    "Build Commander decks with live bracket scoring, AI suggestions, and Scryfall integration.",
  keywords: ["MTG", "Magic the Gathering", "Commander", "EDH", "deck builder"],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "MagicAIBuilder — Commander Deck Builder",
    description:
      "Build Commander decks with live bracket scoring, AI suggestions, and Scryfall integration.",
    type: "website",
    images: [{ url: "/og-image.svg", width: 1200, height: 630 }],
  },
};

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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const stored = JSON.parse(localStorage.getItem('magic-ai-builder-theme') || '{}');
                const theme = stored.state?.theme || 'dark';
                document.documentElement.setAttribute('data-theme', theme);
              } catch(_e) { /* default theme applied */ }
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cinzel.variable} ${cinzelDeco.variable} ${inter.variable} antialiased min-h-screen bg-[var(--background)] text-[var(--text-primary)]`}
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
