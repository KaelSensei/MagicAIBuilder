/**
 * `/stats`: one year of the signed-in player's deck statistics (I-60 slice 2,
 * requirement 2.1), private to its owner.
 *
 * The middleware sends a signed-out visitor to sign-in (`/stats` is not in
 * `public-paths.ts`); this page does the same for a session whose account is
 * gone. The current year is read in-process, as `/u/[username]` reads its
 * profile, and handed to the client view, which reads other years from
 * `GET /api/user/stats`. A failed read is logged and left to the client view,
 * whose own read shows a message and a retry.
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { PlayerStatsView } from "@/components/stats/PlayerStatsView";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth/config";
import {
  readPlayerStatsReport,
  type PlayerStatsReadResult,
} from "@/lib/deck/player-stats-read";
import { logger } from "@/lib/logger";

interface Params {
  readonly params: Promise<{ locale: string }>;
}

/** The sign-in page, back to `/stats` once signed in. */
const SIGN_IN = { pathname: "/auth/signin", query: { callbackUrl: "/stats" } };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("stats");
  return { title: t("eyebrow"), robots: { index: false } };
}

export default async function StatsPage({ params }: Params) {
  const { locale } = await params;
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return redirect({ href: SIGN_IN, locale });

  const now = new Date();
  const read = await readCurrentYear(userId, now);
  if (read?.kind === "no-account") return redirect({ href: SIGN_IN, locale });

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <Header />
      <main className="mx-auto w-full max-w-5xl px-4 py-10 md:px-6">
        <PlayerStatsView
          initialReport={read?.kind === "found" ? read.report : null}
          initialYear={now.getUTCFullYear()}
        />
      </main>
    </div>
  );
}

/**
 * The current year's report, read in-process.
 *
 * @returns the read's result, or null when the read failed (logged), so the
 *   client view reads again and offers a retry
 */
async function readCurrentYear(
  userId: string,
  now: Date
): Promise<PlayerStatsReadResult | null> {
  try {
    return await readPlayerStatsReport({ userId, year: null, now });
  } catch (error) {
    logger.error(error instanceof Error ? error : String(error), "/stats");
    return null;
  }
}
