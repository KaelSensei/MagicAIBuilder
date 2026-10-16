"use client";

import { useTranslations } from "next-intl";
import { PublicPageLoading } from "@/components/profile/PublicPageLoading";

/** Route fallback while the public profile and viewer context are loading. */
export default function Loading() {
  const t = useTranslations("profile");
  return <PublicPageLoading label={t("loading")} variant="profile" />;
}
