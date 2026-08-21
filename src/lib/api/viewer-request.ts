/**
 * Request options for server components fetching viewer-relative API data.
 *
 * Some public endpoints return fields that depend on who is asking — a deck's
 * `isOwner`, a profile's `isFollowing`. Those responses must never be shared
 * from the ISR cache, so an authenticated request forwards its session cookie
 * and opts out of caching. Anonymous requests are identical for everyone and
 * stay cacheable.
 */

export interface ViewerScopedRequestInit {
  readonly headers?: Readonly<Record<string, string>>;
  readonly cache?: "no-store";
  readonly next?: { readonly revalidate: number };
}

const ANONYMOUS_REVALIDATE_SECONDS = 60;

/**
 * Builds fetch options for a viewer-relative public endpoint.
 *
 * @param cookieHeader The incoming request's cookie header, or null.
 * @returns Cookie-forwarding uncached options when signed in, else ISR options.
 */
export function buildViewerScopedRequestInit(
  cookieHeader: string | null
): ViewerScopedRequestInit {
  if (cookieHeader) {
    return { headers: { cookie: cookieHeader }, cache: "no-store" };
  }
  return { next: { revalidate: ANONYMOUS_REVALIDATE_SECONDS } };
}

const LOCAL_BASE_URL = "http://localhost:3000";

/**
 * Absolute origin for a server component calling this app's own API.
 *
 * Node's fetch rejects relative URLs, and an env var that is *present but
 * empty* (`NEXT_PUBLIC_APP_URL=` in a .env) is a realistic misconfiguration —
 * so blank values are treated as unset rather than used as an origin.
 *
 * **Not the same thing as `siteUrl()` in `@/lib/seo/alternates`, and they must
 * not be merged.** This one has to reach *the instance that is running*, so it
 * falls back to `VERCEL_URL` — the current deployment, preview URLs included.
 * `siteUrl()` is the public identity of the site, used for canonicals, hreflang
 * and the sitemap; resolving it to a preview host would publish canonical URLs
 * pointing at deployments that disappear. On a preview they are *supposed* to
 * disagree. The names look interchangeable, which is the whole hazard.
 *
 * @returns The origin to prefix API paths with, without a trailing slash.
 */
export function resolveAppBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return explicit;

  const vercelHost = process.env.VERCEL_URL?.trim();
  if (vercelHost) return `https://${vercelHost}`;

  return LOCAL_BASE_URL;
}
