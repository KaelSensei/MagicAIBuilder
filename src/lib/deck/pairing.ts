// Commander pairing detection utilities
import type { CommanderPairingType } from "./types";
import type { ScryfallCard } from "@/lib/scryfall/types";

/** Detect which pairing type a commander card supports */
export function detectPairingType(card: ScryfallCard): CommanderPairingType {
  const keywords = new Set((card.keywords ?? []).map((k) => k.toLowerCase()));
  const oracle = (card.oracle_text ?? "").toLowerCase();
  const has = (term: string) => keywords.has(term) || oracle.includes(term);

  if (has("friends forever")) return "friends_forever";
  if (has("partner with")) return "partner_with";
  // "Partner—Character select" (TMNT) — only pairs with other Character Select cards
  if (oracle.includes("partner—character select")) return "character_select";
  if (has("partner")) return "partner";
  if (oracle.includes("choose a background")) return "background";
  if (has("doctor's companion")) return "doctor";

  return "none";
}

/** Check if two commanders can be legally paired */
export function canPairWith(
  commanderPairing: CommanderPairingType,
  partnerPairing: CommanderPairingType
): boolean {
  if (commanderPairing === "partner" && partnerPairing === "partner") return true;
  if (commanderPairing === "partner_with" && partnerPairing === "partner_with") return true;
  if (commanderPairing === "friends_forever" && partnerPairing === "friends_forever")
    return true;
  // Character select only pairs with other character select
  if (commanderPairing === "character_select" && partnerPairing === "character_select")
    return true;
  // Background is not a commander itself — type line contains "Background"
  if (commanderPairing === "background" && partnerPairing === "none") return true;
  if (commanderPairing === "doctor" && partnerPairing === "none") return true;
  return false;
}

/** Human-readable label for the partner slot based on pairing type */
export function partnerSlotLabel(pairingType: CommanderPairingType): string {
  switch (pairingType) {
    case "partner":
      return "Partner";
    case "partner_with":
      return "Partner With";
    case "friends_forever":
      return "Friends Forever";
    case "background":
      return "Background";
    case "doctor":
      return "Doctor's Companion";
    case "character_select":
      return "Character Select Partner";
    default:
      return "Partner";
  }
}

/** Whether this commander supports a 2nd commander slot */
export function supportsPartner(pairingType: CommanderPairingType): boolean {
  return pairingType !== "none";
}
