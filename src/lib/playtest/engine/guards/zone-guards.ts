/**
 * When moving a card between zones changes nothing today: the zone it is already in, a
 * non-commander bound for the command zone, or a card that is not in the zone named.
 *
 * Context: playtest, the engine's guard table; the guards of the transition in `zones.ts`,
 * composed with the other concerns' tables by `command-guards.ts`.
 * Rules: a card is not moved to the zone it is in (CR 400.7); only a commander enters the
 * command zone (CR 903.9).
 * Not responsible for: applying the move (`zones.ts`).
 *
 * @module playtest/engine/guards/zone-guards
 */

import {
  guard,
  whileChoosingBottom,
  zoneCards,
  type PlaytestGuardTable,
} from "@/lib/playtest/engine/guards/shared";
import { isSameZoneMove } from "@/lib/playtest/engine/zones";

/** The guards of `moveToZone`. */
export const ZONE_GUARDS: PlaytestGuardTable<"moveToZone"> = {
  moveToZone: [
    whileChoosingBottom,
    // CR 400.7: a zone change goes from one zone to another; the card's own zone is no move.
    guard("moveToZone", "same-zone", (_state, move) => isSameZoneMove(move)),
    // CR 903.9: only a commander may enter the command zone.
    guard(
      "moveToZone",
      "not-a-commander",
      (state, { cardId, to }) =>
        to === "command" && !state.commanderIds.includes(cardId)
    ),
    guard(
      "moveToZone",
      "not-in-zone",
      (state, { cardId, from }) =>
        !zoneCards(state, from).some((card) => card.id === cardId)
    ),
  ],
};
