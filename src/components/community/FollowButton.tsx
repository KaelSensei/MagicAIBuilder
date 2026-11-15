"use client";
/**
 * Follow / unfollow toggle with optimistic state, shown on public profiles.
 *
 * Community context (UI). The toggle flips at once, sends the write through
 * the community client, then adopts the state and the follower count the
 * route answers; any rejection rolls the flip back and shows one failure
 * line. Not responsible for: the request wire format
 * (`lib/community/community-client.ts`).
 */
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { UserPlus, UserCheck } from "lucide-react";
import { followUser, unfollowUser } from "@/lib/community/community-client";

interface FollowButtonProps {
  readonly username: string;
  readonly initialFollowing: boolean;
  readonly initialFollowerCount: number;
  /** False for anonymous viewers — the button becomes a sign-in prompt. */
  readonly canFollow: boolean;
}

export function FollowButton({
  username,
  initialFollowing,
  initialFollowerCount,
  canFollow,
}: FollowButtonProps) {
  const t = useTranslations("profile");
  const [following, setFollowing] = useState(initialFollowing);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [failed, setFailed] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function toggle() {
    const nextFollowing = !following;

    // Optimistic: flip immediately, roll back if the request fails.
    setFollowing(nextFollowing);
    setFollowerCount((count) => count + (nextFollowing ? 1 : -1));
    setFailed(false);

    try {
      const data = nextFollowing
        ? await followUser(username)
        : await unfollowUser(username);
      setFollowing(data.following);
      setFollowerCount(data.followerCount);
    } catch {
      setFollowing(!nextFollowing);
      setFollowerCount((count) => count + (nextFollowing ? -1 : 1));
      setFailed(true);
    }
  }

  if (!canFollow) {
    return (
      <p className="text-sm text-[var(--text-secondary)]">
        {t("followers", { count: followerCount })} · {t("signInToFollow")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => startTransition(toggle)}
          disabled={isPending}
          aria-pressed={following}
          className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border font-medium transition-colors disabled:opacity-60 ${
            following
              ? "border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-red-400/50"
              : "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent-text)] hover:bg-[var(--accent)]/20"
          }`}
        >
          {following ? (
            <UserCheck className="w-4 h-4" aria-hidden="true" />
          ) : (
            <UserPlus className="w-4 h-4" aria-hidden="true" />
          )}
          {following ? t("following") : t("follow")}
        </button>
        <span className="text-sm text-[var(--text-secondary)]">
          {t("followers", { count: followerCount })}
        </span>
      </div>
      {failed && <p className="text-xs text-red-400">{t("followFailed")}</p>}
    </div>
  );
}
