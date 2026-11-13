/**
 * The two providers as the `MetaProvider` port: EDHREC addressed by the
 * commander slug, MTGTop8 by the commander name folded from that slug.
 *
 * The composition of the two adapters, one per provider (ADR 0004):
 * `edhrec.ts` and `mtgtop8-source.ts`. Each provider's wire format and
 * failure modes stay in its adapter; this module only knows how each one is
 * addressed from the slug the use case passes.
 *
 * @module meta-insights/infrastructure/meta-provider
 */
import type { MetaProvider } from "@/modules/meta-insights/application/ports";
import { fetchEdhrecData } from "@/modules/meta-insights/infrastructure/edhrec";
import { fetchTournamentData } from "@/modules/meta-insights/infrastructure/mtgtop8-source";

/**
 * The name MTGTop8 is searched for, from the route's slug. The slug is
 * lower-case ASCII with hyphens for every separator, so the fold is lossy:
 * "eomer-marshal-of-rohan" becomes "eomer marshal of rohan", and the
 * fetcher's archetype matching absorbs the missing accents and punctuation
 * (`route.tournament.test.ts`).
 */
function commanderNameFromSlug(commanderSlug: string): string {
  return commanderSlug.replaceAll("-", " ");
}

/** The provider `server.ts` wires into `getCommanderMeta`: the fetchers, addressed as each site expects. */
export const metaProvider: MetaProvider = {
  fetchEdhrec: (commanderSlug) => fetchEdhrecData(commanderSlug),
  fetchTournament: (commanderSlug) =>
    fetchTournamentData(commanderNameFromSlug(commanderSlug)),
};
