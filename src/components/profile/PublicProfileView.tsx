"use client";
// Public profile page — shows user info + list of public decks
import { Link } from "@/i18n/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { User, Layers } from "lucide-react";
import type { PlayerBadge } from "@/lib/social/follow";
import { FollowButton } from "@/components/community/FollowButton";
import { PlayerBadges } from "@/components/community/PlayerBadges";

interface PublicDeckPreview {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly format: string;
  readonly targetBracket: number;
  readonly isAIGenerated: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly cards: ReadonlyArray<{
    readonly name: string;
    readonly artCropUri: string;
    readonly imageUri: string;
  }>;
}

interface PublicProfile {
  readonly id: string;
  readonly name: string | null;
  readonly username: string;
  readonly image: string | null;
  readonly createdAt: string;
  readonly decks: readonly PublicDeckPreview[];
  readonly followerCount: number;
  readonly followingCount: number;
  readonly isFollowing: boolean;
  readonly badges: readonly PlayerBadge[];
}

interface PublicProfileViewProps {
  readonly profile: PublicProfile;
  /** True when the viewer is signed in and is not the profile owner. */
  readonly canFollow: boolean;
}

const BRACKET_COLORS: Record<number, string> = {
  1: "text-green-400 border-green-400/30 bg-green-400/10",
  2: "text-blue-400 border-blue-400/30 bg-blue-400/10",
  3: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  4: "text-red-400 border-red-400/30 bg-red-400/10",
};

export function PublicProfileView({ profile, canFollow }: PublicProfileViewProps) {
  const t = useTranslations("profile");
  const format = useFormatter();
  const displayName = profile.name ?? profile.username;
  const memberSince = format.dateTime(new Date(profile.createdAt), {
    year: "numeric",
    month: "long",
  });

  return (
    <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 flex flex-col gap-8">
      {/* Profile header */}
      <div className="flex items-center gap-4">
        {profile.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.image}
            alt={displayName}
            className="w-16 h-16 rounded-full border-2 border-[var(--border)] object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-full border-2 border-[var(--border)] bg-[var(--surface)] flex items-center justify-center">
            <User className="w-8 h-8 text-[var(--text-secondary)]" />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{displayName}</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            {t("memberSince", { username: profile.username, date: memberSince })}
            {" · "}
            {t("followingCount", { count: profile.followingCount })}
          </p>
          <PlayerBadges badges={profile.badges} />
          <FollowButton
            username={profile.username}
            initialFollowing={profile.isFollowing}
            initialFollowerCount={profile.followerCount}
            canFollow={canFollow}
          />
        </div>
      </div>

      {/* Decks */}
      <section>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-[var(--accent-text)]" />
          {t("publicDecks")}
          <span className="text-sm font-normal text-[var(--text-secondary)]">
            ({profile.decks.length})
          </span>
        </h2>

        {profile.decks.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)] py-8 text-center">
            {t("noPublicDecks")}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {profile.decks.map((deck) => {
              const commander = deck.cards[0];
              return (
                <Link
                  key={deck.id}
                  href={`/deck/${deck.id}`}
                  className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden hover:border-[var(--accent)]/50 transition-colors"
                >
                  {/* Commander art */}
                  <div className="h-24 bg-[var(--background)] overflow-hidden relative">
                    {commander?.artCropUri ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={commander.artCropUri}
                        alt={commander.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Layers className="w-8 h-8 text-[var(--border)]" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {deck.name}
                    </p>
                    {commander && (
                      <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">
                        {commander.name}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded border font-medium ${BRACKET_COLORS[deck.targetBracket] ?? ""}`}
                      >
                        B{deck.targetBracket}
                      </span>
                      <span className="text-xs text-[var(--text-secondary)] capitalize">
                        {deck.format}
                      </span>
                      {deck.isAIGenerated && (
                        <span className="text-xs text-purple-400">✦ AI</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
