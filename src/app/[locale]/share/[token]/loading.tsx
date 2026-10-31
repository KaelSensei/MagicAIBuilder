"use client";

import { useTranslations } from "next-intl";
import { PublicPageLoading } from "@/components/profile/PublicPageLoading";

/** Route fallback while a deck opened from a share link is loading. */
export default function Loading() {
  const t = useTranslations("deck");
  return <PublicPageLoading label={t("publicLoading")} variant="deck" />;
}
