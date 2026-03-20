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

  if (filters.cmcMin != null) {
    parts.push(`cmc>=${filters.cmcMin}`);
  }

  if (filters.cmcMax != null) {
    parts.push(`cmc<=${filters.cmcMax}`);
  }

  if (filters.priceMax != null) {
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
