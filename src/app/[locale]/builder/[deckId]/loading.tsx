"use client";

import { useTranslations } from "next-intl";
import { EditorRouteSkeleton } from "@/components/layout/RouteSkeleton";

/** Route fallback that preserves the editor workspace during navigation. */
export default function Loading() {
  const t = useTranslations("builder");
  return <EditorRouteSkeleton label={t("loading")} />;
}
