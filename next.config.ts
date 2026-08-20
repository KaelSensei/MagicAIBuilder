import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import withBundleAnalyzer from "@next/bundle-analyzer";
import createNextIntlPlugin from "next-intl/plugin";
import { buildSecurityHeaders } from "./src/lib/security-headers";

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cards.scryfall.io" },
      { protocol: "https", hostname: "svgs.scryfall.io" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        // CSP, HSTS, COOP/CORP and the classic hardening set — see the module
        // for the host allowlist. X-XSS-Protection was dropped: the auditor is
        // gone from every evergreen browser and a CSP supersedes it.
        headers: [
          ...buildSecurityHeaders({ isDev: process.env.NODE_ENV !== "production" }),
        ],
      },
    ];
  },
};

export default withSentryConfig(withNextIntl(withAnalyzer(nextConfig)), {
  org: "kaelsensei",
  project: "magic-ai-builder",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  sourcemaps: { disable: false },
  webpack: {
    treeshake: { removeDebugLogging: true },
    automaticVercelMonitors: true,
  },
});
