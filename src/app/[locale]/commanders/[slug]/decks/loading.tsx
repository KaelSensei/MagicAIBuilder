"use client";

import { useTranslations } from "next-intl";
import { PublicPageLoading } from "@/components/profile/PublicPageLoading";

/** Route fallback while a commander's public deck list is loading. */
export default function Loading() {
  const t = useTranslations("deck.community");
  return <PublicPageLoading label={t("commanderDecksLoading")} variant="profile" />;
}
