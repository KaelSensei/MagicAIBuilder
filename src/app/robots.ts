import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://magicaibuilder.com";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/share/"],
        disallow: ["/api/", "/builder/", "/collection/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
