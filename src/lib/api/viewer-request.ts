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
