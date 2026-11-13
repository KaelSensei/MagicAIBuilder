/**
 * Meta insights context: the pure entry point (ADR 0002).
 *
 * The shapes the meta route serves for a commander (EDHREC's popular cards,
 * MTGTop8's recent tournament decks) and the differencing of two EDHREC
 * snapshots into a "what moved" report. Everything here is readonly data or a
 * pure function from `domain/`, safe on the server, in the browser and in the
 * Edge middleware. The fetchers and the snapshot store are in `server.ts`; the
 * panel, the trends view and the provenance badges are imported by path under
 * `ui/`. The commander slug is not published here: it belongs to the community
 * context and stays at `@/lib/meta/commander-slug` until COM-02 moves it.
 *
 * @module meta-insights
 */
export { computeMetaShifts } from "@/modules/meta-insights/domain/history";
export type {
  CommanderMetaData,
  EdhrecData,
  MetaSource,
  TournamentData,
} from "@/modules/meta-insights/domain/types";
