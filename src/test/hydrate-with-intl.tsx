/**
 * Renders a component the way a page reaches the browser: once on the server
 * (`renderToString`), then hydrated over that HTML (`hydrateRoot`), both inside
 * next-intl with the real catalogs. Part of the shared test kit; it exists for
 * the components whose text depends on something the server and the browser
 * can see differently, such as the clock.
 *
 * A test moves the clock between the two steps (fake timers), then asserts that
 * the hydration reported no mismatch and what the page shows afterwards.
 *
 * @module test/hydrate-with-intl
 */
import type { ReactElement, ReactNode } from "react";
import { act } from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { vi } from "vitest";
import { testMessages, type TestLocale } from "@/test/intl-catalogs";

interface IntlOptions {
  /** Locale to render under. Defaults to `en`. */
  readonly locale?: TestLocale;
}

/** What a hydration left behind. */
export interface HydrationResult {
  /** The element hydrated over the server HTML, attached to the document. */
  readonly container: HTMLElement;
  /**
   * Every mismatch React reported while hydrating: the recoverable errors (a
   * text that differs, after which React re-renders on the client) and the
   * development warnings (an attribute that differs, which React leaves as is).
   * Empty when the server HTML and the first browser render agree.
   */
  readonly mismatches: readonly string[];
  /** Unmounts the hydrated tree and detaches its container. */
  readonly unmount: () => void;
}

/**
 * The provider every render of this kit uses: UTC like `renderWithIntl`, so a
 * date means the same thing on a developer's machine and in CI, and the
 * server render and the hydration share one time zone, as they do in the app,
 * where the layout's provider hands the server's zone to the browser.
 */
function intlTree(ui: ReactElement, locale: TestLocale): ReactNode {
  return (
    <NextIntlClientProvider
      locale={locale}
      timeZone="UTC"
      messages={testMessages(locale)}
    >
      {ui}
    </NextIntlClientProvider>
  );
}

/**
 * Renders a component to HTML as the server would, inside next-intl.
 *
 * @param ui - element under test
 * @param options - the locale, `en` by default
 * @returns the server HTML
 */
export function renderToStringWithIntl(
  ui: ReactElement,
  options?: IntlOptions
): string {
  return renderToString(intlTree(ui, options?.locale ?? "en"));
}

/** The text of anything React hands to `onRecoverableError` or `console.error`. */
function messageOf(reported: unknown): string {
  return reported instanceof Error ? reported.message : String(reported);
}

/**
 * Hydrates a component over server HTML, as the browser would, and collects
 * every mismatch React reports while doing so.
 *
 * @param serverHtml - the HTML from {@link renderToStringWithIntl}
 * @param ui - the same element the server rendered
 * @param options - the locale, `en` by default; it must match the server's
 * @returns the hydrated container, the mismatches and an unmount
 */
export async function hydrateWithIntl(
  serverHtml: string,
  ui: ReactElement,
  options?: IntlOptions
): Promise<HydrationResult> {
  const container = document.createElement("div");
  container.innerHTML = serverHtml;
  document.body.append(container);

  const mismatches: string[] = [];
  const consoleError = vi
    .spyOn(console, "error")
    .mockImplementation((...args: readonly unknown[]) => {
      mismatches.push(args.map(messageOf).join(" "));
    });
  let root: Root | undefined;
  try {
    await act(async () => {
      root = hydrateRoot(container, intlTree(ui, options?.locale ?? "en"), {
        onRecoverableError: (error) => mismatches.push(messageOf(error)),
      });
    });
  } finally {
    consoleError.mockRestore();
  }

  return {
    container,
    mismatches,
    unmount: () => {
      act(() => root?.unmount());
      container.remove();
    },
  };
}
