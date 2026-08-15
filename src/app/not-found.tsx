import Link from "next/link";

/**
 * Root 404 page.
 *
 * Requests that never resolve to a `[locale]` segment — an unsupported locale
 * such as `/xx`, or any unmatched path — bypass `[locale]/layout.tsx`, which is
 * the only layout rendering `<html>`/`<body>` (the root layout is a passthrough).
 * Without this file such responses carried no `<html lang>` at all, leaving
 * screen readers and crawlers with no language for the page.
 *
 * Like `global-error.tsx`, it renders its own document and stays in English:
 * no locale has been resolved at this point, so no translations are available.
 */
export default function NotFound() {
  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: 0,
          padding: "1.5rem",
          background: "#0b0b12",
          color: "#e8e8f0",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
        }}
      >
        <main style={{ maxWidth: "28rem" }}>
          <p
            style={{
              fontSize: "3rem",
              fontWeight: 700,
              margin: "0 0 0.5rem",
              opacity: 0.25,
            }}
          >
            404
          </p>

          <h1 style={{ fontSize: "1.25rem", margin: "0 0 0.5rem" }}>
            Page not found
          </h1>

          <p
            style={{
              fontSize: "0.875rem",
              opacity: 0.7,
              margin: "0 0 1.5rem",
              lineHeight: 1.5,
            }}
          >
            This address does not match any page on MagicAIBuilder.
          </p>

          <Link
            href="/"
            style={{
              display: "inline-block",
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              background: "#7c3aed",
              color: "#fff",
              fontSize: "0.875rem",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Back to MagicAIBuilder
          </Link>
        </main>
      </body>
    </html>
  );
}
