"use client";
// Badge pills earned by a builder, derived server-side by getPlayerBadges().
import { useTranslations } from "next-intl";
import { Award, Star, TrendingUp } from "lucide-react";
import type { PlayerBadge } from "@/lib/social/follow";

interface PlayerBadgesProps {
  readonly badges: readonly PlayerBadge[];
}

const BADGE_STYLES: Record<PlayerBadge, string> = {
  community_builder: "text-blue-400 border-blue-400/30 bg-blue-400/10",
  highly_rated: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  trending: "text-green-400 border-green-400/30 bg-green-400/10",
};

const BADGE_LABEL_KEYS: Record<PlayerBadge, string> = {
  community_builder: "badgeCommunityBuilder",
  highly_rated: "badgeHighlyRated",
  trending: "badgeTrending",
};

const BADGE_ICONS: Record<PlayerBadge, typeof Award> = {
  community_builder: Award,
  highly_rated: Star,
  trending: TrendingUp,
};

export function PlayerBadges({ badges }: PlayerBadgesProps) {
  const t = useTranslations("profile");

  if (badges.length === 0) return null;

  return (
    <ul className="flex flex-wrap items-center gap-2 list-none p-0 m-0">
      {badges.map((badge) => {
        const Icon = BADGE_ICONS[badge];
        return (
          <li
            key={badge}
            className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${BADGE_STYLES[badge]}`}
          >
            <Icon className="w-3 h-3" aria-hidden="true" />
            {t(BADGE_LABEL_KEYS[badge])}
          </li>
        );
      })}
    </ul>
  );
}
