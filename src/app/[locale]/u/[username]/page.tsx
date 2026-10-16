import type { Metadata } from "next";
import { alternatesFor } from "@/lib/seo/alternates";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { PublicProfileView } from "@/components/profile/PublicProfileView";
import {
  buildViewerScopedRequestInit,
  resolveAppBaseUrl,
} from "@/lib/api/viewer-request";
import { auth } from "@/lib/auth/config";

interface Params {
  readonly params: Promise<{ locale: string; username: string }>;
}

/**
 * The profile response is viewer-relative (isFollowing), so an authenticated
 * request must forward its cookie and bypass the ISR cache — otherwise one
 * viewer's follow state would be served to everyone.
 */
async function fetchProfile(username: string) {
  try {
    const cookieHeader = (await headers()).get("cookie");
    const res = await fetch(
      `${resolveAppBaseUrl()}/api/users/${username}`,
      { ...buildViewerScopedRequestInit(cookieHeader), signal: AbortSignal.timeout(15_000) }
    );
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("PROFILE_UNAVAILABLE");
    return res.json();
  } catch {
    throw new Error("PROFILE_UNAVAILABLE");
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { username, locale } = await params;
  let profile;
  try {
    profile = await fetchProfile(username);
  } catch {
    return { title: "Profile unavailable — MagicAIBuilder" };
  }

  if (!profile) {
    return { title: "Profile not found — MagicAIBuilder" };
  }

  const displayName = profile.name ?? profile.username;
  return {
    alternates: alternatesFor(locale, `/u/${username}`),
    title: `${displayName} — MagicAIBuilder`,
    description: `${displayName}'s public Commander decks on MagicAIBuilder.`,
  };
}

export default async function UserProfilePage({ params }: Params) {
  const { username } = await params;
  const [profile, session] = await Promise.all([fetchProfile(username), auth()]);

  if (!profile) notFound();

  const viewerId = session?.user?.id ?? null;

  return (
    <div className="flex flex-col min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <Header />
      <PublicProfileView
        profile={profile}
        canFollow={viewerId !== null && viewerId !== profile.id}
      />
    </div>
  );
}
