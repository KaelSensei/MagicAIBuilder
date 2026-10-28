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
