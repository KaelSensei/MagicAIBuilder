import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Header } from "@/components/layout/Header";
import { PublicProfileView } from "@/components/profile/PublicProfileView";
import { auth } from "@/lib/auth/config";
import { logger } from "@/lib/logger";
import { alternatesFor } from "@/lib/seo/alternates";
import { isIndexableProfile } from "@/lib/seo/index-policy";
import { metadataTranslations } from "@/lib/seo/page-metadata";
import { isUsername, type PublicProfile } from "@/lib/social/public-profile";
import { findPublicProfileForViewer } from "@/lib/social/public-profile-lookup";

interface Params {
  readonly params: Promise<{ locale: string; username: string }>;
}

/** Thrown when the profile cannot be read; the route error boundary offers a retry. */
const PROFILE_UNAVAILABLE = "PROFILE_UNAVAILABLE";

/** The profile as this request's viewer may see it, and who that viewer is. */
interface ProfileForViewer {
  readonly profile: PublicProfile | null;
  readonly viewerId: string | null;
}

/**
 * The profile as this request's viewer may see it, read in-process once per
 * request: `generateMetadata` and the page share the result. A signed-out
 * visitor is served from the data cache; a signed-in viewer reads fresh, so
 * their `isFollowing` is never served to anyone else.
 *
 * A username no account can carry reads as missing without asking the
 * database. A database failure is logged and thrown as
 * {@link PROFILE_UNAVAILABLE} rather than read as "no profile": the visitor
 * gets a retry, not a 404 for a profile that exists.
 */
const fetchProfileForViewer = cache(
  async (username: string): Promise<ProfileForViewer> => {
    const session = await auth();
    const viewerId = session?.user?.id ?? null;
    if (!isUsername(username)) return { profile: null, viewerId };

    try {
      const profile = await findPublicProfileForViewer(username, viewerId);
      return { profile, viewerId };
    } catch (error) {
      logger.error(
        error instanceof Error ? error : String(error),
        "/u/[username]",
        { username }
      );
      throw new Error(PROFILE_UNAVAILABLE);
    }
  }
);

/**
 * Robots metadata for a found profile: `noindex` while it lists no public
 * deck (I-34 spec §4.5), so a typo'd or empty profile is not a page.
 *
 * @param profile The profile to describe.
 * @returns `{ robots: { index: false } }` for an empty profile, else nothing.
 */
function profileRobots(profile: PublicProfile): Pick<Metadata, "robots"> {
  if (isIndexableProfile(profile.decks.length)) return {};
  return { robots: { index: false } };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { username, locale } = await params;
  const t = await metadataTranslations(locale, "profile");
  let profile: PublicProfile | null;
  try {
    ({ profile } = await fetchProfileForViewer(username));
  } catch {
    return { title: t("unavailable") };
  }

  if (!profile) {
    return { title: t("notFound") };
  }

  const displayName = profile.name ?? profile.username;
  return {
    ...profileRobots(profile),
    alternates: alternatesFor(locale, `/u/${username}`),
    title: t("title", { name: displayName }),
    description: t("description", { name: displayName }),
  };
}

export default async function UserProfilePage({ params }: Params) {
  const { username } = await params;
  const { profile, viewerId } = await fetchProfileForViewer(username);

  if (!profile) notFound();

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
