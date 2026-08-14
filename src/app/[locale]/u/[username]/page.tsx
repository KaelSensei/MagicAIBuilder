import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { PublicProfileView } from "@/components/profile/PublicProfileView";
import { buildViewerScopedRequestInit } from "@/lib/api/viewer-request";
import { auth } from "@/lib/auth/config";

interface Params {
  readonly params: Promise<{ username: string }>;
}

/**
 * The profile response is viewer-relative (isFollowing), so an authenticated
 * request must forward its cookie and bypass the ISR cache — otherwise one
 * viewer's follow state would be served to everyone.
 */
async function fetchProfile(username: string) {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    const cookieHeader = (await headers()).get("cookie");
    const res = await fetch(
      `${baseUrl}/api/users/${username}`,
      buildViewerScopedRequestInit(cookieHeader)
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { username } = await params;
  const profile = await fetchProfile(username);

  if (!profile) {
    return { title: "Profile not found — MagicAIBuilder" };
  }

  const displayName = profile.name ?? profile.username;
  return {
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
