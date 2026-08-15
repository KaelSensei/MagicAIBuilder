"use client";
// Follow / unfollow toggle with optimistic state, shown on public profiles.
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { UserPlus, UserCheck } from "lucide-react";

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
      const res = await fetch(
        `/api/community/users/${encodeURIComponent(username)}/follow`,
        { method: nextFollowing ? "POST" : "DELETE" }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: { following: boolean; followerCount: number } = await res.json();
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
              : "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20"
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
