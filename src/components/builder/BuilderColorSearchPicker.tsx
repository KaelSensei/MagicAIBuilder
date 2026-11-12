"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/components/ui/utils";
import { manaSymbolSvgUrl } from "@/lib/scryfall/constants";

/**
 * Colours the builder's colour search can filter by: WUBRG, then colourless.
 * Each one is named by `builder.manaColors.<code>`.
 */
const COLOR_CODES = ["W", "U", "B", "R", "G", "C"] as const;

/** One mana colour code the colour search can filter by. */
export type ColorSearchCode = (typeof COLOR_CODES)[number];

export interface BuilderColorSearchPickerProps {
  /** Colour codes currently selected. */
  readonly selected: readonly string[];
  /** Whether the optional name filter next to the picker holds text. */
  readonly hasNameFilter: boolean;
  /** Called with the colour whose button was pressed. */
  readonly onToggle: (code: ColorSearchCode) => void;
}

/**
 * Mana symbol toggles for the builder's "by colour" search, plus the hint shown
 * while neither a colour nor a name filter narrows the search.
 */
export function BuilderColorSearchPicker({
  selected,
  hasNameFilter,
  onToggle,
}: BuilderColorSearchPickerProps) {
  const t = useTranslations("builder");
  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {COLOR_CODES.map((code) => {
          const label = t(`manaColors.${code}`);
          return (
            <button
              type="button"
              key={code}
              onClick={() => onToggle(code)}
              className={cn(
                "w-9 h-9 rounded-full transition-all border-2 p-0.5",
                selected.includes(code)
                  ? "border-[var(--accent)] scale-110"
                  : "border-transparent opacity-50 hover:opacity-100"
              )}
              title={label}
            >
              {/* Official Scryfall mana symbol SVGs — SVG external URL, next/image not applicable */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={manaSymbolSvgUrl(code)}
                alt={label}
                className="w-full h-full"
              />
            </button>
          );
        })}
      </div>
      {selected.length === 0 && !hasNameFilter && (
        <p className="text-xs text-[var(--text-secondary)] italic">
          {t("colorSearchHint")}
        </p>
      )}
    </>
  );
}
