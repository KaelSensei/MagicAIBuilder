/**
 * Renders a component inside next-intl alone, with the real catalogs. Part of the shared test kit;
 * `render.tsx` adds TanStack Query and Auth.js on top for components that need them.
 *
 * @module test/render-with-intl
 */
import type { ReactElement } from "react";
import {
  render,
  type RenderOptions,
  type RenderResult,
} from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { testMessages, type TestLocale } from "@/test/intl-catalogs";

export type { TestLocale } from "@/test/intl-catalogs";

interface RenderWithIntlOptions extends Omit<RenderOptions, "wrapper"> {
  /** Locale to render under. Defaults to `en`. */
  readonly locale?: TestLocale;
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
 * @param ui - element under test
 * @param options - forwarded to Testing Library's `render`, plus `locale`
 * @returns the usual render result
 */
export function renderWithIntl(
  ui: ReactElement,
  options?: RenderWithIntlOptions
): RenderResult {
  const { locale = "en", ...renderOptions } = options ?? {};

  return render(
    <NextIntlClientProvider
      locale={locale}
      timeZone="UTC"
      messages={testMessages(locale)}
    >
      {ui}
    </NextIntlClientProvider>,
    renderOptions
  );
}
