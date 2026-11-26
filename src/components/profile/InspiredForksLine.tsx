/**
 * The "Inspiration for N decks" line of a public deck page: the public decks
 * forked from this one, each linked to its own page with its author's name
 * (I-08, AC-08-193). It sits beside the "Forked from" credit, or in its place
 * on an original deck, so a visitor can follow a deck's lineage both ways.
 *
 * Community context (ui). The page reads the forks on the server and passes
 * plain data down; this component reads nothing. A deck nobody forked
 * publicly, or whose forks could not be read, shows no line (AC-08-194,
 * AC-08-195).
 *
 * @module profile/InspiredForksLine
 */
import { useId } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { InspiredFork, InspiredForks } from "@/lib/deck/inspired-forks";

interface InspiredForksLineProps {
  /** The deck's public forks; absent or empty renders nothing. */
  readonly inspiredForks?: InspiredForks;
}

interface InspiredForkLinkProps {
  readonly fork: InspiredFork;
}

/** One fork, linked to its public page and named with its author when known. */
function InspiredForkLink({ fork }: InspiredForkLinkProps) {
  const t = useTranslations("deck.public");
  return (
    <Link
      href={`/deck/${fork.id}`}
      className="rounded-sm font-medium text-[var(--accent-text)] underline underline-offset-2 hover:decoration-2"
    >
      {fork.author
        ? t("forkSource", { name: fork.name, author: fork.author })
        : fork.name}
    </Link>
  );
}

/**
 * Lists the public forks of a deck under their true count, then says how many
 * more there are than the forks named.
 */
export function InspiredForksLine({ inspiredForks }: InspiredForksLineProps) {
  const t = useTranslations("deck.public");
  const headingId = useId();
  if (!inspiredForks || inspiredForks.total === 0) return null;

  const { forks, total } = inspiredForks;
  const unlisted = total - forks.length;
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span id={headingId}>{t("inspirationFor", { count: total })}</span>
      <ul
        aria-labelledby={headingId}
        className="flex flex-wrap items-baseline gap-x-2 gap-y-1"
      >
        {forks.map((fork) => (
          <li key={fork.id}>
            <InspiredForkLink fork={fork} />
          </li>
        ))}
        {unlisted > 0 && <li>{t("inspirationMore", { count: unlisted })}</li>}
      </ul>
    </div>
  );
}
