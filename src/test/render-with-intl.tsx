import type { ReactElement } from "react";
import { render, type RenderOptions, type RenderResult } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import common from "@/messages/en/common.json";
import builder from "@/messages/en/builder.json";
import card from "@/messages/en/card.json";
import deck from "@/messages/en/deck.json";
import playtest from "@/messages/en/playtest.json";
import search from "@/messages/en/search.json";
import collection from "@/messages/en/collection.json";
import profile from "@/messages/en/profile.json";
import settings from "@/messages/en/settings.json";

import frCommon from "@/messages/fr/common.json";
import frBuilder from "@/messages/fr/builder.json";
import frCard from "@/messages/fr/card.json";
import frDeck from "@/messages/fr/deck.json";
import frPlaytest from "@/messages/fr/playtest.json";
import frSearch from "@/messages/fr/search.json";
import frCollection from "@/messages/fr/collection.json";
import frProfile from "@/messages/fr/profile.json";
import frSettings from "@/messages/fr/settings.json";

const CATALOGS = {
  en: { common, builder, card, deck, playtest, search, collection, profile, settings },
  fr: {
    common: frCommon,
    builder: frBuilder,
    card: frCard,
    deck: frDeck,
    playtest: frPlaytest,
    search: frSearch,
    collection: frCollection,
    profile: frProfile,
    settings: frSettings,
  },
} as const;

/** The locales `renderWithIntl` can render under — the two `routing` actually serves. */
export type TestLocale = keyof typeof CATALOGS;

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
    <NextIntlClientProvider locale={locale} timeZone="UTC" messages={CATALOGS[locale]}>
      {ui}
    </NextIntlClientProvider>,
    renderOptions
  );
}
