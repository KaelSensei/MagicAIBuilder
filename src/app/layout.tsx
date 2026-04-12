import type { ReactNode } from "react";

/**
 * Thin root layout — exists only so that API routes and other non-locale
 * segments can coexist with the [locale] segment.
 *
 * The real layout (fonts, metadata, providers) lives in [locale]/layout.tsx.
 */
export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return children;
}
