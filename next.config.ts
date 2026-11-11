import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import withBundleAnalyzer from "@next/bundle-analyzer";
import createNextIntlPlugin from "next-intl/plugin";
import { buildSecurityHeaders } from "./src/lib/security-headers";

/**
 * Settings for the Docker E2E stack only (`docker-compose.e2e.yml`), which builds
 * the app once and serves it with `next start` instead of `next dev`.
 *
 * - `allowDevelopmentBuild`: a production build inlines
 *   `process.env.NODE_ENV = "production"` into every bundle, which compiles out
 *   the `PLAYWRIGHT_TEST` auth bypass (`requireAuth`, `authorized()`) the specs
 *   seed their data through. This flag makes `NODE_ENV=development next build`
 *   inline "development" instead, and Next.js refuses it under any other
 *   NODE_ENV. Source: next 15.5.29 `dist/build/define-env.js:77` and
 *   `dist/server/config.js:298` (read 2026-11-11).
 * - `ignoreBuildErrors`: types are gated by `tsc --noEmit` in CI and the pre-PR
 *   gate; the E2E build only needs runnable bundles.
 */
const e2eDevelopmentBuild: NextConfig =
  process.env.E2E_DEVELOPMENT_BUILD === "1" &&
  process.env.NODE_ENV === "development"
    ? {
        experimental: { allowDevelopmentBuild: true },
        typescript: { ignoreBuildErrors: true },
      }
    : {};

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // `next build` lints through the ESLint Node.js API, and ESLint 9 applies
  // bulk suppressions (`eslint-suppressions.json`) only in its CLI. The build
  // would therefore fail on every breach the lint ratchet has recorded. The
  // lint gate is `pnpm lint` (the CLI) in CI and on commit; Next.js 16 drops
  // linting from `next build` altogether.
  eslint: { ignoreDuringBuilds: true },
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
  ...e2eDevelopmentBuild,
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
