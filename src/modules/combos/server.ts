/**
 * Combos context: the server entry point (ADR 0002).
 *
 * The server side of a combo lookup, as `POST /api/combos` uses it: one
 * Commander Spellbook `find-my-combos` call per deck, and the per-instance
 * cache in front of it. Both adapters are marked `server-only` (the cache
 * hashes with `node:crypto`), and so is this file: a client import of it fails
 * the build.
 *
 * There is no use case yet; the route still sequences cache, budget and call.
 * When that sequence moves into `application/`, this file becomes its
 * composition root and exports the wired use case instead.
 *
 * @module combos/server
 */
import "server-only";

export {
  readCachedCombos,
  storeCachedCombos,
} from "@/modules/combos/infrastructure/combo-cache";
export {
  requestDeckCombos,
  type DeckCombosResult,
} from "@/modules/combos/infrastructure/find-my-combos";
