"use client";
/**
 * The commander / partner banner: a card's art strip with its colour identity
 * rendered as mana pips.
 *
 * Lifted out of `DeckEditor`, which was the project's largest component at
 * 1214 lines. This block was self-contained — four helpers, two gradient
 * constants and one already-exported component, with `BannerManaColor` used
 * nowhere else — so the cut is a move, not a redesign.
 *
 * @module deck/ColorIdentityBanner
 */

import Image from "next/image";
import { useMemo } from "react";
import { useTranslations } from "next-intl";

/** The identity symbols this banner can draw a pip for. */
export type BannerManaColor = "W" | "U" | "B" | "R" | "G" | "C";

const MANA_BANNER_KEYS: Record<BannerManaColor, string> = {
  W: "W",
  U: "U",
  B: "B",
  R: "R",
  G: "G",
  C: "C",
};

const COLOR_IDENTITY_BANNER_BACKGROUND =
  "linear-gradient(135deg, rgba(84, 97, 120, 0.74), rgba(28, 34, 46, 0.96))";

const COLOR_IDENTITY_BANNER_OVERLAY =
  "radial-gradient(circle at top right, rgba(255,255,255,0.16), transparent 34%), linear-gradient(180deg, rgba(255,255,255,0.08), transparent 45%)";

/**
 * Check whether a raw identity symbol can be rendered as a mana-color banner pip.
 *
 * @param color Raw identity symbol from deck data.
 * @returns `true` when the value is a supported mana-color symbol.
 */
function isBannerManaColor(color: string): color is BannerManaColor {
  return ["W", "U", "B", "R", "G", "C"].includes(color);
}

/**
 * Normalize a card color identity into unique display symbols, with `C` for colorless.
 *
 * @param colorIdentity Raw deck-card color identity.
 * @returns Ordered unique symbols suitable for banner rendering.
 */
function getDisplayColorIdentity(
  colorIdentity: readonly string[]
): readonly BannerManaColor[] {
  const normalized = Array.from(
    new Set(
      colorIdentity
        .map((color) => color.toUpperCase())
        .filter(isBannerManaColor)
    )
  );

  return normalized.length > 0 ? normalized : ["C"];
}

/**
 * Build the Scryfall SVG URL for a mana symbol used in the banner.
 *
 * @param color Supported mana color symbol.
 * @returns Remote SVG asset URL.
 */
function getBannerManaSymbolUrl(color: BannerManaColor): string {
  return `https://svgs.scryfall.io/card-symbols/${color}.svg`;
}

/**
 * Build the i18n key for a banner mana color label.
 *
 * @param color Supported mana color symbol.
 * @returns The mana-color key used to look up a translated label.
 */
function getBannerManaColorKey(color: BannerManaColor): string {
  return MANA_BANNER_KEYS[color];
}

/**
 * Decorative banner for a commander slot, using identity symbols on a neutral surface.
 *
 * @param props Banner content, colors, and remove action for the slot.
 * @returns A dismissible slot banner that replaces the old commander art crop.
 */
export function ColorIdentityBanner({
  name,
  colorIdentity,
  onRemove,
  label,
}: {
  readonly name: string;
  readonly colorIdentity: readonly string[];
  readonly onRemove: () => void;
  readonly label?: string;
}) {
  const t = useTranslations("builder");
  const displayColors = useMemo(
    () => getDisplayColorIdentity(colorIdentity),
    [colorIdentity]
  );

  return (
    <div
      className="group/banner relative flex-1 h-[82px] overflow-hidden rounded-lg border border-white/10 text-white shadow-[0_18px_50px_rgba(0,0,0,0.22)]"
      style={{ backgroundImage: COLOR_IDENTITY_BANNER_BACKGROUND }}
    >
      <div
        className="absolute inset-0"
        style={{ backgroundImage: COLOR_IDENTITY_BANNER_OVERLAY }}
      />
      <div className="relative z-10 flex h-full items-end justify-between gap-4 px-3 py-2">
        <div className="min-w-0 flex-1 space-y-1">
          {label && (
            <div className="inline-flex rounded bg-yellow-400/90 px-1 text-[8px] font-bold leading-tight text-black">
              {label}
            </div>
          )}
          <p
            className="max-w-[16rem] truncate text-sm font-semibold tracking-[0.01em]"
            style={{ textShadow: "0 1px 3px rgba(0,0,0,0.35)" }}
          >
            {name}
          </p>
        </div>
        <div className="shrink-0 rounded-full border border-white/12 bg-white/10 px-3 py-2 shadow-[0_12px_28px_rgba(0,0,0,0.16)] backdrop-blur-md">
          <div className="flex items-center gap-2">
            {displayColors.map((color) => (
              <div
                key={`${label ?? "slot"}-${color}`}
                className="relative rounded-full ring-1 ring-black/10 shadow-[0_6px_18px_rgba(0,0,0,0.14)]"
              >
                <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.5),_transparent_42%)]" />
                <Image
                  src={getBannerManaSymbolUrl(color)}
                  alt={t("manaSymbolAlt", {
                    color: t(`manaColors.${getBannerManaColorKey(color)}`),
                  })}
                  width={34}
                  height={34}
                  unoptimized
                  className="relative h-8 w-8 drop-shadow-[0_3px_8px_rgba(0,0,0,0.28)]"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 opacity-0 group-hover/banner:opacity-100 transition-opacity bg-red-600/80 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-lg"
        title={t("actions.removeNamed", { name })}
      >
        ×
      </button>
    </div>
  );
}
