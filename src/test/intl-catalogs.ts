/**
 * The app's message catalogs for the served locales, assembled the way `src/i18n/request.ts` hands
 * them to next-intl, for tests that render translated components.
 *
 * Part of the shared test kit; `render-with-intl.tsx` and `render.tsx` read it. Using the real
 * catalogs rather than stubs means a test breaks when a key is removed or renamed. Every namespace
 * is loaded, `auth` included, so a test never needs a second provider to add one.
 *
 * @module test/intl-catalogs
 */
import type { AbstractIntlMessages } from "next-intl";
import enAuth from "@/messages/en/auth.json";
import enBuilder from "@/messages/en/builder.json";
import enCard from "@/messages/en/card.json";
import enCollection from "@/messages/en/collection.json";
import enCommanderRules from "@/messages/en/commander-rules.json";
import enCommon from "@/messages/en/common.json";
import enDeck from "@/messages/en/deck.json";
import enLanding from "@/messages/en/landing.json";
import enMetadata from "@/messages/en/metadata.json";
import enOnboarding from "@/messages/en/onboarding.json";
import enPlaytestEvidence from "@/messages/en/playtest-evidence.json";
import enPlaytest from "@/messages/en/playtest.json";
import enProfile from "@/messages/en/profile.json";
import enRules from "@/messages/en/rules.json";
import enSearch from "@/messages/en/search.json";
import enSettings from "@/messages/en/settings.json";
import frAuth from "@/messages/fr/auth.json";
import frBuilder from "@/messages/fr/builder.json";
import frCard from "@/messages/fr/card.json";
import frCollection from "@/messages/fr/collection.json";
import frCommanderRules from "@/messages/fr/commander-rules.json";
import frCommon from "@/messages/fr/common.json";
import frDeck from "@/messages/fr/deck.json";
import frLanding from "@/messages/fr/landing.json";
import frMetadata from "@/messages/fr/metadata.json";
import frOnboarding from "@/messages/fr/onboarding.json";
import frPlaytestEvidence from "@/messages/fr/playtest-evidence.json";
import frPlaytest from "@/messages/fr/playtest.json";
import frProfile from "@/messages/fr/profile.json";
import frRules from "@/messages/fr/rules.json";
import frSearch from "@/messages/fr/search.json";
import frSettings from "@/messages/fr/settings.json";

/**
 * The locales a test can render under: the two `src/i18n/routing.ts` serves
 * (`SUPPORTED_LOCALES`). The dormant catalogs are kept at key parity with `en` but never routed.
 */
export type TestLocale = "en" | "fr";

const CATALOGS: Readonly<Record<TestLocale, AbstractIntlMessages>> = {
  en: {
    common: enCommon,
    card: enCard,
    auth: enAuth,
    builder: enBuilder,
    deck: enDeck,
    landing: enLanding,
    onboarding: enOnboarding,
    search: enSearch,
    rules: enRules,
    collection: enCollection,
    profile: enProfile,
    playtest: enPlaytest,
    playtestEvidence: enPlaytestEvidence,
    commanderRules: enCommanderRules,
    settings: enSettings,
    metadata: enMetadata,
  },
  fr: {
    common: frCommon,
    card: frCard,
    auth: frAuth,
    builder: frBuilder,
    deck: frDeck,
    landing: frLanding,
    onboarding: frOnboarding,
    search: frSearch,
    rules: frRules,
    collection: frCollection,
    profile: frProfile,
    playtest: frPlaytest,
    playtestEvidence: frPlaytestEvidence,
    commanderRules: frCommanderRules,
    settings: frSettings,
    metadata: frMetadata,
  },
};

/**
 * Every namespace of one locale's catalog, keyed as `src/i18n/request.ts` keys them
 * (`playtest-evidence.json` is `playtestEvidence`, `commander-rules.json` is `commanderRules`).
 *
 * @param locale - a served locale
 * @returns the messages to hand to `NextIntlClientProvider`; shared, so never mutate them
 */
export function testMessages(locale: TestLocale): AbstractIntlMessages {
  return CATALOGS[locale];
}
