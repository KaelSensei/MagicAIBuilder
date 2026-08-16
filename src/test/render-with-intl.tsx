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

/**
 * Renders a component inside `NextIntlClientProvider` with the real English
 * catalogs.
 *
 * Any component calling `useTranslations` throws without this provider, so every
 * test of a translated component needs it. Using the real catalogs rather than
 * stubs means a test breaks when a key is removed or renamed, which is the point.
 *
 * @param ui - element under test
 * @param options - forwarded to Testing Library's `render`
 * @returns the usual render result
 */
export function renderWithIntl(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
): RenderResult {
  return render(
    <NextIntlClientProvider
      locale="en"
      messages={{ common, builder, card, deck, playtest, search, collection, profile }}
    >
      {ui}
    </NextIntlClientProvider>,
    options
  );
}
