import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo/alternates";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        // `/share/<token>` is a capability URL. The sharing dialog promises
        // "anyone with this link can view your deck", and the route serving it
        // checks `shareEnabled` and never `isPublic` — so a private deck is
        // readable at its token, by design, for whoever the owner sent it to.
        // This used to be an explicit `allow`, paired with a sitemap that
        // listed every token. Both are gone.
        disallow: ["/api/", "/builder/", "/collection/", "/share/"],
      },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
