/**
 * Client half of the `PATCH /api/collection/[id]` contract.
 *
 * The route answers an edit to one collection row in one of three shapes:
 *
 * - `{ deleted: true }` when the quantity reached 0 and the row was removed;
 * - `{ merged: false, card }` when the row itself was updated, possibly
 *   onto another printing;
 * - `{ merged: true, mergedFromId, card }` when a printing swap landed on a
 *   printing the user already owned: the edited row was deleted and `card` is
 *   the surviving row, which has a different id.
 *
 * Every store action that edits a row reads the answer through this module.
 * Reading the envelope as a bare card once made every quantity edit roll back
 * on screen although the server had saved it.
 *
 * @module collection/card-patch
 */

import { isRecord, parseCollectionCard } from "./parse";
import type { CardCondition, CollectionCard } from "./types";

/** Fields a client may change on one collection row. */
export type CollectionCardChanges = Readonly<
  Partial<{
    quantity: number;
    condition: CardCondition | null;
    scryfallId: string;
    name: string;
    imageUri: string;
    price: number | null;
  }>
>;

/** What the server did with one edit to a collection row. */
export type CollectionPatchResult =
  | { readonly kind: "deleted" }
  | { readonly kind: "updated"; readonly card: CollectionCard }
  | {
      readonly kind: "merged";
      readonly mergedFromId: string;
      readonly card: CollectionCard;
    };

/** The non-foil and foil maps of the collection store, keyed by Scryfall id. */
export interface CollectionMaps {
  readonly collectionCards: Readonly<Record<string, CollectionCard>>;
  readonly collectionCardsFoil: Readonly<Record<string, CollectionCard>>;
}

/**
 * Parses a `PATCH /api/collection/[id]` response body.
 *
 * @param raw - The decoded JSON body.
 * @returns The outcome, or null when the body matches none of the three shapes.
 */
export function parseCollectionPatchResponse(
  raw: unknown
): CollectionPatchResult | null {
  if (!isRecord(raw)) return null;
  if (raw["deleted"] === true) return { kind: "deleted" };

  const card = parseCollectionCard(raw["card"]);
  if (!card) return null;
  if (raw["merged"] === false) return { kind: "updated", card };

  const mergedFromId = raw["mergedFromId"];
  if (raw["merged"] === true && typeof mergedFromId === "string") {
    return { kind: "merged", mergedFromId, card };
  }
  return null;
}

/**
 * Sends an edit for one collection row.
 *
 * @param id - Collection row identifier.
 * @param changes - Fields to change; a quantity of 0 deletes the row.
 * @returns What the server did with the row.
 * @throws When the request fails or the body matches no known shape.
 */
export async function patchCollectionCard(
  id: string,
  changes: CollectionCardChanges
): Promise<CollectionPatchResult> {
  const response = await fetch(`/api/collection/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(changes),
  });
  if (!response.ok)
    throw new Error(`Collection row update failed (${response.status})`);
  const result = parseCollectionPatchResponse(await response.json());
  if (!result) throw new Error("Invalid collection row update response");
  return result;
}

/**
 * @param maps - Collection maps.
 * @param id - Collection row identifier.
 * @returns Whether either map still holds the row.
 */
function holdsRow(maps: CollectionMaps, id: string): boolean {
  return (
    Object.values(maps.collectionCards).some((card) => card.id === id) ||
    Object.values(maps.collectionCardsFoil).some((card) => card.id === id)
  );
}

/**
 * @param maps - Collection maps.
 * @param id - Collection row identifier to drop.
 * @param replacement - Row to file under its own printing and finish, if any.
 * @returns New maps without the row `id`, plus the replacement.
 */
function replaceRow(
  maps: CollectionMaps,
  id: string,
  replacement: CollectionCard | null
): CollectionMaps {
  const collectionCards = Object.fromEntries(
    Object.entries(maps.collectionCards).filter(([, card]) => card.id !== id)
  );
  const collectionCardsFoil = Object.fromEntries(
    Object.entries(maps.collectionCardsFoil).filter(
      ([, card]) => card.id !== id
    )
  );
  if (replacement) {
    const owner = replacement.foil ? collectionCardsFoil : collectionCards;
    owner[replacement.scryfallId] = replacement;
  }
  return { collectionCards, collectionCardsFoil };
}

/**
 * Applies the server's answer to an edit of row `editedId`.
 *
 * The edited row is always dropped and the returned row filed under its own
 * printing and finish, so a row whose printing or id changed lands in the
 * right place. An answer for a row no longer on screen changes nothing: the
 * user removed it while the request was in flight, and it must not come back.
 *
 * @param maps - Current collection maps.
 * @param editedId - Row the request edited.
 * @param result - What the server did with it.
 * @returns The next maps, or `maps` itself when nothing changes.
 */
export function applyCollectionPatchResult(
  maps: CollectionMaps,
  editedId: string,
  result: CollectionPatchResult
): CollectionMaps {
  if (!holdsRow(maps, editedId)) return maps;
  switch (result.kind) {
    case "deleted":
      return replaceRow(maps, editedId, null);
    case "updated":
      return replaceRow(maps, editedId, result.card);
    case "merged":
      return replaceRow(maps, result.mergedFromId, result.card);
    default: {
      const unhandled: never = result;
      return unhandled;
    }
  }
}
