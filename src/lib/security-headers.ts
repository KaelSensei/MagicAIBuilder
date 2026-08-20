/**
 * HTTP security headers, built once and handed to `next.config.ts`.
 *
 * Kept out of the config file so the policy is unit-testable: a CSP that is
 * one host short breaks a feature silently in production, and the only place
 * that is cheap to catch is a test that names every host the browser needs.
 *
 * The script policy still carries `'unsafe-inline'`: Next.js hydrates through
 * inline scripts and removing it needs per-request nonces threaded through
 * middleware and the root layout. That is the next step, not this one — the
 * present policy already refuses any script from a third-party origin.
 *
 * @module security-headers
 */

export interface SecurityHeader {
  readonly key: string;
  readonly value: string;
}

export interface SecurityHeadersOptions {
  /** The dev server needs eval for fast refresh and has no TLS to pin. */
  readonly isDev: boolean;
}

/** Hosts the browser fetches from. Add here, then to the test, then ship. */
const CONNECT_HOSTS = [
  // Printing lookups run from the client (see useCardPrintings).
  "https://api.scryfall.com",
  // Sentry ingest, both regions.
  "https://*.ingest.sentry.io",
  "https://*.ingest.de.sentry.io",
  // @vercel/speed-insights
  "https://vitals.vercel-insights.com",
] as const;

const IMAGE_HOSTS = [
  "https://cards.scryfall.io",
  "https://svgs.scryfall.io",
  // Google OAuth avatars stored on User.image.
  "https://*.googleusercontent.com",
] as const;

/**
 * Builds the Content-Security-Policy value.
 *
 * @param options - environment flags
 * @returns the policy, directives joined with `; `
 */
export function buildContentSecurityPolicy({ isDev }: SecurityHeadersOptions): string {
  const scriptSrc = ["'self'", "'unsafe-inline'", ...(isDev ? ["'unsafe-eval'"] : [])];
  const directives: readonly string[] = [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    // Tailwind and framer-motion both write inline styles.
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${IMAGE_HOSTS.join(" ")}`,
    // next/font self-hosts every face; data: covers icon fonts inlined by libraries.
    "font-src 'self' data:",
    `connect-src 'self' ${CONNECT_HOSTS.join(" ")}`,
    // Three.js / R3F spawn blob workers on the landing scene.
    "worker-src 'self' blob:",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://accounts.google.com",
    "frame-ancestors 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ];
  return directives.join("; ");
}

/**
 * Builds the full header list for every route.
 *
 * @param options - environment flags
 * @returns headers in the shape `next.config.ts` expects
 */
export function buildSecurityHeaders(options: SecurityHeadersOptions): readonly SecurityHeader[] {
  const headers: SecurityHeader[] = [
    { key: "Content-Security-Policy", value: buildContentSecurityPolicy(options) },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  ];
  if (!options.isDev) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    });
  }
  return headers;
}
