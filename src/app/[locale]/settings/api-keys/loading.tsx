"use client";

import { useTranslations } from "next-intl";

/** Route fallback that keeps private API-key settings responsive while loading. */
export default function Loading() {
  const t = useTranslations("settings.apiKeys");
  return <output aria-busy="true" className="sr-only">{t("loading")}</output>;
}
