/**
 * Renders a component inside next-intl alone, with the real catalogs. Part of the shared test kit;
 * `render.tsx` adds TanStack Query and Auth.js on top for components that need them.
 *
 * @module test/render-with-intl
 */
import type { ReactElement, ReactNode } from "react";
import {
  render,
  type RenderOptions,
  type RenderResult,
} from "@testing-library/react";
import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";
import { testMessages, type TestLocale } from "@/test/intl-catalogs";

export type { TestLocale } from "@/test/intl-catalogs";

interface RenderWithIntlOptions extends Omit<RenderOptions, "wrapper"> {
  /** Locale to render under. Defaults to `en`. */
  readonly locale?: TestLocale;
  /**
   * Catalogs to use instead of the locale's real ones. Only for a test that
   * proves a text comes from the catalog: it starts from `testMessages(locale)`,
   * rewords one entry and checks the component shows the new words.
   */
  readonly messages?: AbstractIntlMessages;
}

/**
 * Renders a component inside `NextIntlClientProvider` with the real catalogs.
 *
 * Any component calling `useTranslations` throws without this provider, so every
 * test of a translated component needs it. Using the real catalogs rather than
 * stubs means a test breaks when a key is removed or renamed, which is the point.
 * Every namespace of the locale is loaded (`intl-catalogs.ts`). A component that
 * also needs TanStack Query or a session renders with `renderWithProviders`
 * (`render.tsx`) instead.
 *
 * The locale is a parameter rather than a constant because `en` is the one
 * locale under which a hardcoded `toLocaleDateString("en-US")` looks correct.
 * Asserting anything about localization needs a second locale to compare with.
 *
 * `timeZone` is pinned to UTC so a date assertion means the same thing on a
 * developer's machine as it does in CI.
 *
 * The provider is passed as Testing Library's `wrapper`, not wrapped around `ui`,
 * so `rerender(<Other />)` keeps it; wrapped around `ui`, a rerender mounted the
 * new element bare and `useTranslations` threw.
 *
 * @param ui - element under test
 * @param options - forwarded to Testing Library's `render`, plus `locale` and,
 *   for a test of catalog wording only, `messages`
 * @returns the usual render result
 */
export function renderWithIntl(
  ui: ReactElement,
  options?: RenderWithIntlOptions
): RenderResult {
  const { locale = "en", messages, ...renderOptions } = options ?? {};
  const catalogs = messages ?? testMessages(locale);

  function IntlProvider({ children }: { readonly children: ReactNode }) {
    return (
      <NextIntlClientProvider
        locale={locale}
        timeZone="UTC"
        messages={catalogs}
      >
        {children}
      </NextIntlClientProvider>
    );
  }

  return render(ui, { ...renderOptions, wrapper: IntlProvider });
}
