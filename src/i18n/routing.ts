import { defineRouting } from "next-intl/routing";

export const SUPPORTED_LOCALES = [
  "en",
  "fr",
  "de",
  "it",
  "es",
  "ja",
  "zh",
  "ko",
  "ru",
  "pt",
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const routing = defineRouting({
  locales: [...SUPPORTED_LOCALES],
  defaultLocale: "en",
  localePrefix: "always",
});
