/**
 * Structured data (JSON-LD) for search engines, rendered on the server.
 *
 * Site context. A page passes a schema.org object and gets one inline
 * `<script type="application/ld+json">` back. Nothing here needs the browser:
 * the component stays a Server Component so the structured data costs no
 * client JavaScript. The home page (`app/[locale]/page.tsx`) is its only user.
 *
 * @module components/JsonLd
 */
import { siteUrl } from "@/lib/seo/alternates";

interface JsonLdProps {
  readonly data: Record<string, unknown>;
}

/**
 * Serializes `data` for inline injection into a `<script>` tag.
 *
 * `JSON.stringify` does **not** escape `<`, `>` or `&`, so on its own a value
 * holding `</script>` would close the tag and a value holding `<!--` would put
 * the HTML parser in its escaped script state (HTML spec, "script data escaped
 * state", https://html.spec.whatwg.org/multipage/parsing.html#script-data-escaped-state,
 * read 2026-11-13). This helper replaces those three characters with their
 * JSON unicode escapes, which `JSON.parse` reads back as the original
 * characters. U+2028 and U+2029 are left as JSON emits them: the block is a
 * data block, not executed script, so they cannot break it.
 *
 * @returns Valid JSON holding no `<`, `>` or `&`; `JSON.parse` of it equals `data`.
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replaceAll("<", String.raw`\u003C`)
    .replaceAll(">", String.raw`\u003E`)
    .replaceAll("&", String.raw`\u0026`);
}

/**
 * One inline JSON-LD block for `data`.
 *
 * Renders on the server: a client component here shipped JavaScript to the
 * browser for a static `<script>` tag that never changes after the first paint.
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }}
    />
  );
}

/**
 * The schema.org `SoftwareApplication` entry for the site.
 *
 * `url` comes from `siteUrl()`, the same origin the canonical, hreflang,
 * robots and sitemap URLs use, so the structured data never advertises a
 * different site than the rest of the page. A page may override it with its
 * own canonical URL, as the home page does for its locale. Without
 * `NEXT_PUBLIC_BASE_URL` the value is the shared fallback domain.
 *
 * No `offers`: a price or an AI claim here must be verified first.
 */
export const softwareApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "MagicAIBuilder",
  applicationCategory: "GameApplication",
  operatingSystem: "Web",
  description:
    "Commander deckbuilding for card search, collection tracking, goldfish playtesting, and sharing.",
  url: siteUrl(),
};
