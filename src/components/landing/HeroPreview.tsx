"use client";

import { useTranslations } from "next-intl";

/** Bar heights for the decorative mana curve, tallest in the middle. */
const CURVE_HEIGHTS = ["28%", "46%", "72%", "100%", "84%", "58%", "36%"] as const;

/**
 * Decorative product frame beside the hero.
 * It does not name cards or promise outcomes; it only shows the Lumen surface language.
 *
 * @returns a non-interactive preview frame
 */
export function HeroPreview() {
  const t = useTranslations("landing");

  return (
    <aside className="relative hidden lg:block" aria-hidden="true">
      <div className="absolute -inset-8 -z-10 rounded-full bg-[var(--accent-soft)] blur-3xl" />
      <div className="rounded-[var(--lumen-radius-2xl)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--lumen-shadow-lg)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {t("hero.eyebrow")}
          </p>
          <span className="rounded-[var(--lumen-radius-pill)] bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-medium text-[var(--accent-text)]">
            {t("atlas.listLabel")}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {CURVE_HEIGHTS.slice(0, 4).map((height) => (
            <div
              key={height}
              className="aspect-[5/7] rounded-[var(--lumen-radius-lg)] border border-[var(--border)] bg-[var(--background)]"
            >
              <div
                className="m-2 h-8 rounded-[var(--lumen-radius-md)] bg-[var(--accent-soft)]"
                style={{ opacity: height === "28%" ? 0.7 : 1 }}
              />
            </div>
          ))}
        </div>
        <div className="mt-5 flex h-24 items-end gap-2" aria-hidden="true">
          {CURVE_HEIGHTS.map((height) => (
            <div
              key={`curve-${height}`}
              className="flex-1 rounded-t-[var(--lumen-radius-sm)] bg-[var(--accent)]"
              style={{ height }}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}
