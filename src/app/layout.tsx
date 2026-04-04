import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "MagicAIBuilder — Commander Deck Builder",
    template: "%s | MagicAIBuilder",
  },
  description: "Build Commander decks with live bracket scoring, AI suggestions, and Scryfall integration.",
  keywords: ["MTG", "Magic the Gathering", "Commander", "EDH", "deck builder"],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "MagicAIBuilder — Commander Deck Builder",
    description: "Build Commander decks with live bracket scoring, AI suggestions, and Scryfall integration.",
    type: "website",
    images: [{ url: "/og-image.svg", width: 1200, height: 630 }],
  },
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
              } catch(_e) { /* default theme applied */ }
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-[var(--background)] text-[var(--text-primary)]`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
