"use client";

import { useTranslations } from "next-intl";
import { LibraryRouteSkeleton } from "@/components/layout/RouteSkeleton";

/** Route fallback that preserves deck-library context during navigation. */
export default function Loading() {
  const t = useTranslations("deck");
  return <LibraryRouteSkeleton label={t("home.loading")} />;
}
