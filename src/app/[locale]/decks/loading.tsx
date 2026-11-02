"use client";

import { useTranslations } from "next-intl";
import { PublicPageLoading } from "@/components/profile/PublicPageLoading";

/** Route fallback that preserves deck-workspace context during navigation. */
export default function Loading() {
  const t = useTranslations("deck");

  return <PublicPageLoading label={t("home.loading")} variant="decks" />;
}
