"use client";

import { useTranslations } from "next-intl";
import { PublicPageLoading } from "@/components/profile/PublicPageLoading";

/** Route fallback while the player's statistics are counted. */
export default function Loading() {
  const t = useTranslations("stats");
  return <PublicPageLoading label={t("loading")} variant="decks" />;
}
