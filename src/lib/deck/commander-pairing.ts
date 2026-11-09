import { getCardCollection } from "@/lib/scryfall/client";

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
