"use client";

import { useTranslations } from "next-intl";

/** Route fallback that keeps the private account settings responsive while loading. */
export default function Loading() {
  const t = useTranslations("settings.account");
  return (
    <output aria-busy="true" className="sr-only">
      {t("loading")}
    </output>
  );
}
