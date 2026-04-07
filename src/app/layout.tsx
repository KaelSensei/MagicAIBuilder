import type { Metadata } from "next";
import { Geist, Geist_Mono, Cinzel, Cinzel_Decorative, Inter } from "next/font/google";
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
        className={`${geistSans.variable} ${geistMono.variable} ${cinzel.variable} ${cinzelDeco.variable} ${inter.variable} antialiased min-h-screen bg-[var(--background)] text-[var(--text-primary)]`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
