"use client";

import { useTranslations } from "next-intl";

/** Route fallback that keeps the restricted moderation queue responsive while loading. */
export default function Loading() {
  const t = useTranslations("deck.moderation");
  return <output aria-busy="true" className="sr-only">{t("loading")}</output>;
}
