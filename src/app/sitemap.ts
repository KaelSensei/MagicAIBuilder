import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://magicaibuilder.com";

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
  ];

  // Include all publicly shared decks
  let sharedDecks: MetadataRoute.Sitemap = [];
  try {
    // shareEnabled / shareToken fields added in feat/deck-sharing migration
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const decks = await (prisma.deck as any).findMany({
      where: { shareEnabled: true, shareToken: { not: null } },
      select: { shareToken: true, updatedAt: true },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sharedDecks = decks.map((deck: any) => ({
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
