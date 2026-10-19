"use client";

import { useTranslations } from "next-intl";
import { PublicPageLoading } from "@/components/profile/PublicPageLoading";

/** Route fallback while a shared deck and its viewer context are loading. */
export default function Loading() {
  const t = useTranslations("deck");
  return <PublicPageLoading label={t("publicLoading")} variant="deck" />;
}
