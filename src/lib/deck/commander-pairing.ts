/**
 * Server checks of a deck's two command slots against Scryfall card data.
 *
 * @module deck/commander-pairing
 */
import { getCardCollection } from "@/lib/scryfall/client";
import { canPairCommanders, pairingCardOf } from "./pairing";

/**
 * Checks whether two distinct Scryfall printings represent one Oracle card.
 *
 * @param commanderId - The selected commander printing identifier.
 * @param partnerId - The selected partner printing identifier.
 * @returns Whether both printings share the same Oracle card identity.
 */
export async function sharesOracleIdentity(
  commanderId: string,
  partnerId: string
): Promise<boolean> {
  const collection = await getCardCollection([{ id: commanderId }, { id: partnerId }]);
  const oracleIdsByPrintingId = new Map(
    collection.data.map((card) => [card.id, card.oracle_id])
  );
  const commanderOracleId = oracleIdsByPrintingId.get(commanderId);
  const partnerOracleId = oracleIdsByPrintingId.get(partnerId);

  return Boolean(commanderOracleId && partnerOracleId && commanderOracleId === partnerOracleId);
}

/**
 * Checks whether a card entering one command slot duplicates the card saved in
 * the other slot, either as the same printing or as a reprint of its Oracle card.
 *
 * @param cardId - The printing identifier entering a command slot.
 * @param otherSlotId - The printing identifier saved in the opposite slot, if any.
 * @returns Whether the pairing would hold one Oracle card twice.
 */
export async function duplicatesOtherCommandSlot(
  cardId: string,
  otherSlotId: string | null
): Promise<boolean> {
  if (!otherSlotId) return false;
  if (cardId === otherSlotId) return true;
  return sharesOracleIdentity(cardId, otherSlotId);
}

/** Why a commander and a partner cannot be saved together. */
export type CommandPairProblem = "sameCard" | "unpairable";

/**
 * Checks a commander and partner pair against card data. A printing Scryfall
 * does not return is not judged.
 *
 * @param commanderId - The commander printing identifier.
 * @param partnerId - The partner printing identifier.
 * @returns Why the pair cannot be saved, or null when it can.
 */
export async function commandPairProblem(
  commanderId: string,
  partnerId: string
): Promise<CommandPairProblem | null> {
  const collection = await getCardCollection([
    { id: commanderId },
    { id: partnerId },
  ]);
  const cardsById = new Map(collection.data.map((card) => [card.id, card]));
  const commander = cardsById.get(commanderId);
  const partner = cardsById.get(partnerId);
  if (!commander || !partner) return null;
  // CR 903.5b: one card cannot fill both slots, whatever the printing.
  if (commander.oracle_id && commander.oracle_id === partner.oracle_id) {
    return "sameCard";
  }
  // CR 702.124: a partner ability of the pair must allow it.
  return canPairCommanders(pairingCardOf(commander), pairingCardOf(partner))
    ? null
    : "unpairable";
}
