"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { SUPPORTED_LOCALES } from "@/i18n/routing";
import type { SupportedLocale } from "@/i18n/routing";
import { Globe } from "lucide-react";
import { useCallback, useRef, useState } from "react";

/** Locale switcher dropdown — shows current locale and a popover with all supported locales */
export function LocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleSwitch = useCallback(
    (next: SupportedLocale) => {
      router.replace(pathname, { locale: next });
      setOpen(false);
    },
    [router, pathname]
  );

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm"
        aria-label={t("locale.switchLocale")}
        title={t("locale.switchLocale")}
      >
        <Globe className="w-4 h-4" />
        <span className="uppercase">{locale}</span>
      </button>

      {open && (
        <>
          {/* Backdrop to close on outside click */}
          <div
            className="fixed inset-0 z-40"
            role="presentation"
            onClick={() => setOpen(false)}
            onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
          />
          <div className="absolute right-0 top-full mt-1 z-50 min-w-[160px] rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-lg py-1">
            {SUPPORTED_LOCALES.map((loc) => (
              <button
                key={loc}
                onClick={() => handleSwitch(loc)}
                className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                  loc === locale
                    ? "text-[var(--accent)] font-medium bg-[var(--accent)]/10"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
                }`}
              >
                <span className="uppercase mr-2 text-xs opacity-60">{loc}</span>
                {t(`locale.${loc}`)}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
