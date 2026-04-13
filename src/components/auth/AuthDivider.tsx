"use client";

import { useTranslations } from "next-intl";

/** Visual "or" divider between OAuth and credentials sections on auth pages. */
export function AuthDivider() {
  const t = useTranslations("auth");

  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-[var(--border)]" />
      </div>
      <div className="relative flex justify-center text-xs">
        <span className="px-2 bg-[var(--background)] text-[var(--text-secondary)]">
          {t("divider")}
        </span>
      </div>
    </div>
  );
}
