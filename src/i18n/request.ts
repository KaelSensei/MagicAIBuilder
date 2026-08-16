import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
    locale = routing.defaultLocale;
  }

  const common = (await import(`@/messages/${locale}/common.json`)).default;
  const auth = (await import(`@/messages/${locale}/auth.json`)).default;
  const builder = (await import(`@/messages/${locale}/builder.json`)).default;
  const deck = (await import(`@/messages/${locale}/deck.json`)).default;
  const landing = (await import(`@/messages/${locale}/landing.json`)).default;
  const onboarding = (await import(`@/messages/${locale}/onboarding.json`)).default;
  const search = (await import(`@/messages/${locale}/search.json`)).default;
  const rules = (await import(`@/messages/${locale}/rules.json`)).default;
  const collection = (await import(`@/messages/${locale}/collection.json`)).default;
  const profile = (await import(`@/messages/${locale}/profile.json`)).default;
  const playtest = (await import(`@/messages/${locale}/playtest.json`)).default;
  const card = (await import(`@/messages/${locale}/card.json`)).default;

  return {
    locale,
    messages: {
      common,
      card,
      auth,
      builder,
      deck,
      landing,
      onboarding,
      search,
      rules,
      collection,
      profile,
      playtest,
    },
  };
});
