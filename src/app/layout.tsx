import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/globals.css";
import { Providers } from "./providers";
import { JsonLd, softwareApplicationJsonLd } from "@/components/JsonLd";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://magicaibuilder.com";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "MagicAIBuilder — Free MTG Commander Deck Builder",
    template: "%s | MagicAIBuilder",
  },
  description:
    "Build and optimize your Magic: The Gathering Commander decks. Live bracket scoring, Game Changers detection, AI card suggestions, and combo finder. Free EDH deck builder.",
  keywords: [
    "MTG deck builder",
    "Commander deck builder",
    "Magic the Gathering",
    "EDH deck builder",
    "Commander bracket",
    "bracket scoring",
    "Game Changers MTG",
    "MTG AI suggestions",
    "Commander combo finder",
    "free MTG deck builder",
  ],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "MagicAIBuilder — Free MTG Commander Deck Builder",
    description:
      "Build Commander decks with live bracket scoring, AI suggestions, Game Changers detection, and combo finder.",
    type: "website",
    url: baseUrl,
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "MagicAIBuilder" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MagicAIBuilder — Free MTG Commander Deck Builder",
    description:
      "Build Commander decks with live bracket scoring, AI suggestions, and combo finder.",
    images: ["/og-image.svg"],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: baseUrl },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const stored = JSON.parse(localStorage.getItem('magic-ai-builder-theme') || '{}');
                const theme = stored.state?.theme || 'dark';
                document.documentElement.setAttribute('data-theme', theme);
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-[var(--background)] text-[var(--text-primary)]`}
      >
        <JsonLd data={softwareApplicationJsonLd} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
