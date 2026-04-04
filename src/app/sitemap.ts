import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://magicaibuilder.com";

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  // Include all publicly shared decks
  let sharedDecks: MetadataRoute.Sitemap = [];
  try {
    // shareEnabled / shareToken fields added in feat/deck-sharing migration
    const decks: unknown[] = await (prisma.deck as { findMany: (args: unknown) => Promise<unknown[]> }).findMany({
      where: { shareEnabled: true, shareToken: { not: null } },
      select: { shareToken: true, updatedAt: true },
    });

    sharedDecks = decks
      .filter((d): d is { shareToken: string; updatedAt: Date } =>
        typeof d === "object" && d !== null && "shareToken" in d && "updatedAt" in d
      )
      .map((deck) => ({
        url: `${baseUrl}/share/${deck.shareToken}`,
        lastModified: deck.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
  } catch {
    // Prisma not available at build time — skip dynamic entries
  }

  return [...staticPages, ...sharedDecks];
}
