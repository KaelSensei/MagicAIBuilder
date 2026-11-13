"use client";
/**
 * The two links the meta panel offers for a commander: the site's community
 * decks for it, and its EDHREC page.
 *
 * Meta-insights context, `ui/`. Presentational. Both links use the commander
 * slug the panel's data is fetched with, so they land on the same commander the
 * numbers describe.
 *
 * @module meta-insights/ui/CommanderMetaLinks
 */
import { useTranslations } from "next-intl";
import { ExternalLink, Users } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { commanderToSlug } from "@/lib/meta/commander-slug";

/** The commander the links are for. */
export interface CommanderMetaLinksProps {
  readonly commanderName: string;
}

/** An internal link to `/commanders/<slug>/decks` and an external one, in a new tab, to EDHREC. */
export function CommanderMetaLinks({ commanderName }: CommanderMetaLinksProps) {
  const t = useTranslations("deck");
  const slug = commanderToSlug(commanderName);
  return (
    <>
      <Link
        href={`/commanders/${slug}/decks`}
        className="flex items-center gap-1.5 text-[11px] text-[var(--accent-text)] hover:underline"
      >
        <Users className="w-3 h-3" aria-hidden="true" />
        {t("meta.communityDecks")}
      </Link>

      <a
        href={`https://edhrec.com/commanders/${slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-[11px] text-[var(--accent-text)] hover:underline"
      >
        <ExternalLink className="w-3 h-3" aria-hidden="true" />
        {t("meta.viewOnEdhrec")}
      </a>
    </>
  );
}
