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
  keywords: ["MTG", "Magic the Gathering", "Commander", "EDH", "deck builder", "bracket scoring"],
  openGraph: {
    title: "MagicAIBuilder — Commander Deck Builder",
    description: "Build Commander decks with live bracket scoring, AI suggestions, and Scryfall integration.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-[var(--background)] text-[var(--text-primary)]`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
