"use client";

import { useTranslations } from "next-intl";
import { PublicPageLoading } from "@/components/profile/PublicPageLoading";

/** Route fallback for the private library of saved public decks. */
export default function Loading() {
  const t = useTranslations("deck.savedFolders");
  return <PublicPageLoading label={t("loading")} variant="decks" />;
}
