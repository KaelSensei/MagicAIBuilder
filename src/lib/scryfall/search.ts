// Scryfall search query builder
import type { SearchFilters } from "@/lib/deck/types";

/** Build a Scryfall query string from filters */
export function buildSearchQuery(
  text: string,
  filters: Partial<SearchFilters> = {}
): string {
  const parts: string[] = [];

  if (text.trim()) {
    // If the user typed raw Scryfall syntax (contains :), pass through
    if (text.includes(":")) {
      parts.push(text.trim());
    } else {
      parts.push(`name:/${text.trim()}/`);
    }
  }

  if (filters.colors && filters.colors.length > 0) {
    parts.push(`id<=${filters.colors.join("")}`);
  }

  if (filters.types && filters.types.length > 0) {
    const typeQuery = filters.types
      .map((t) => `type:${t}`)
      .join(" OR ");
    parts.push(`(${typeQuery})`);
  }

  if (filters.cmcMin !== null && filters.cmcMin !== undefined) {
    parts.push(`cmc>=${filters.cmcMin}`);
  }

  if (filters.cmcMax !== null && filters.cmcMax !== undefined) {
    parts.push(`cmc<=${filters.cmcMax}`);
  }

  if (filters.priceMax !== null && filters.priceMax !== undefined) {
    parts.push(`usd<=${filters.priceMax}`);
  }

  // Always search legal-in-commander cards
  parts.push("legal:commander");

  return parts.join(" ");
}

/** Commander search query — includes legendary creatures and planeswalkers that can be commanders */
export function buildCommanderSearchQuery(
  text: string,
  filters: Partial<SearchFilters> = {}
): string {
  const parts: string[] = ["is:commander"];
  const name = text.trim();
  if (name) {
    parts.push(`name:/${name}/`);
  }
  if (filters.colors && filters.colors.length > 0) {
    parts.push(`id<=${filters.colors.join("")}`);
  }
  return parts.join(" ");
}

/** Build a search query for partner slot based on pairing type */
export function buildPartnerSearchQuery(
  pairingType: string,
  text: string,
  filters: Partial<SearchFilters> = {}
): string {
  const name = text.trim();
  const namePart = name ? ` name:/${name}/` : "";
  const colorPart = filters.colors && filters.colors.length > 0
    ? ` id<=${filters.colors.join("")}`
    : "";

  switch (pairingType) {
    case "partner":
      // Generic Partner — any commander with Partner keyword
      return `is:commander o:"Partner" -o:"Partner with" -o:"Character select"${namePart}${colorPart}`;
    case "character_select":
      // TMNT Character Select — only pairs with other Character Select
      return `is:commander o:"Character select"${namePart}`;
    case "friends_forever":
      return `is:commander o:"Friends forever"${namePart}${colorPart}`;
    case "partner_with":
      // Partner With — just use the specific card name search
      return `is:commander o:"Partner with"${namePart}${colorPart}`;
    default:
      return `is:commander${namePart}${colorPart}`;
  }
}

/** Build a query for browsing cards from a specific set */
export function buildSetSearchQuery(setCode: string, colorFilter: string[] = []): string {
  const parts: string[] = [`set:${setCode}`, "legal:commander"];
  if (colorFilter.length > 0) {
    parts.push(`id<=${colorFilter.join("")}`);
  }
  return parts.join(" ");
}

/** Build a query for filtering by color */
export function buildColorSearchQuery(
  colors: string[],
  text: string = "",
  exact = false
): string {
  const parts: string[] = ["legal:commander"];
  if (text.trim()) parts.push(`name:/${text.trim()}/`);

  if (colors.length === 0) {
    // Colorless
  } else if (exact) {
    parts.push(`c=${colors.join("")}`);
  } else {
    parts.push(`id<=${colors.join("")}`);
  }

  return parts.join(" ");
}
