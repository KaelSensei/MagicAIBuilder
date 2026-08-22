/**
 * `GET /api/v1/openapi` — the machine-readable description of this API.
 *
 * Public and unauthenticated. A spec you need a credential to read cannot be
 * used to decide whether to ask for one, and it describes only the shape of the
 * endpoints, never anyone's data.
 */

import { NextResponse } from "next/server";
import { buildOpenApiDocument } from "@/lib/api/openapi";

/**
 * The origin this request actually arrived on.
 *
 * Deliberately neither `siteUrl()` nor `resolveAppBaseUrl()`. `siteUrl()` is
 * the site's public identity and would tell a developer reading the spec on a
 * preview deployment to call production; `resolveAppBaseUrl()` is for this app
 * fetching itself server-side. What a client needs is the host it just
 * downloaded the document from — derived from the request, so the two cannot
 * disagree.
 *
 * `x-forwarded-*` win when present because a proxy sets them and `request.url`
 * then carries the internal address.
 */
function requestOrigin(request: Request): string {
  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") ?? url.host;
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  return `${proto}://${host}`;
}

export function GET(request: Request) {
  const document = buildOpenApiDocument(`${requestOrigin(request)}/api/v1`);

  return NextResponse.json(document, {
    headers: {
      // Immutable for a given deploy but not for a given version string, so a
      // short cache with revalidation rather than a long one.
      "Cache-Control": "public, max-age=300, must-revalidate",
    },
  });
}
