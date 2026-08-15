"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

interface GlobalErrorProps {
  readonly error: Error & { readonly digest?: string };
  readonly reset: () => void;
}

/**
 * Last-resort boundary for failures in the root layout itself.
 *
 * It replaces the whole document, so it must render its own `<html>`/`<body>`
 * and cannot rely on providers — including next-intl. Copy stays in English.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

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
        <div style={{ maxWidth: "28rem" }}>
          <h1 style={{ fontSize: "1.25rem", margin: "0 0 0.5rem" }}>
            Something went wrong
          </h1>

          <p
            style={{
              fontSize: "0.875rem",
              opacity: 0.7,
              margin: "0 0 1.5rem",
              lineHeight: 1.5,
            }}
          >
            An unexpected error interrupted the application. The problem has
            been reported.
          </p>

          <button
            type="button"
            onClick={reset}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              border: "none",
              background: "#7c3aed",
              color: "#fff",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Try again
          </button>

          {error.digest && (
            <p style={{ marginTop: "1.5rem", fontSize: "0.75rem", opacity: 0.5 }}>
              Reference: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
