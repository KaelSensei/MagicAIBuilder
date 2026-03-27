import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { PublicProfileView } from "@/components/profile/PublicProfileView";

interface Params {
  readonly params: Promise<{ username: string }>;
}

async function fetchProfile(username: string) {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    const res = await fetch(`${baseUrl}/api/users/${username}`, {
      next: { revalidate: 60 },
    });
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
  const profile = await fetchProfile(username);

  if (!profile) notFound();

  return (
    <div className="flex flex-col min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <Header />
      <PublicProfileView profile={profile} />
    </div>
  );
}
