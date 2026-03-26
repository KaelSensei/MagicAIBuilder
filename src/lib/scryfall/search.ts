// Scryfall search query builder
import type { ColorMode, InteractionType, SearchFilters } from "@/lib/deck/types";

// ─── Interaction helpers ──────────────────────────────────────────────────────

/**
 * Maps an interaction archetype to its Scryfall oracle-text query fragment.
 *
 * | type          | Scryfall fragment                                    |
 * |---------------|------------------------------------------------------|
 * | removal       | (o:"destroy target" OR o:"exile target")             |
 * | counterspell  | (t:instant o:"counter target")                       |
 * | wipe          | (o:"destroy all" OR o:"exile all")                   |
 * | tutor         | o:"search your library"                              |
 * | draw          | o:"draw a card"                                      |
 * | ramp          | (t:land OR o:"add {")                                |
 */
export function buildInteractionQuery(type: InteractionType): string {
  switch (type) {
    case "removal":
      return '(o:"destroy target" OR o:"exile target")';
    case "counterspell":
      return '(t:instant o:"counter target")';
    case "wipe":
      return '(o:"destroy all" OR o:"exile all")';
    case "tutor":
      return 'o:"search your library"';
    case "draw":
      return 'o:"draw a card"';
    case "ramp":
      return '(t:land OR o:"add {")';
  }
}

// ─── Color helpers ────────────────────────────────────────────────────────────

/**
 * Build the Scryfall color fragment for WUBRG color filters.
 *
 * | mode    | Scryfall syntax | meaning                              |
 * |---------|-----------------|--------------------------------------|
 * | "or"    | id<=WUBRG       | within color identity (permissive)   |
 * | "and"   | c>=WUBRG        | contains ALL selected colors         |
 * | "exact" | c=WUBRG         | exactly these colors, nothing more   |
 *
 * Returns an empty string when colors array is empty.
 */
export function buildColorQuery(colors: string[], mode: ColorMode): string {
  if (colors.length === 0) return "";
  const joined = colors.join("");
  switch (mode) {
    case "or":
      return `id<=${joined}`;
    case "and":
      return `c>=${joined}`;
    case "exact":
      return `c=${joined}`;
  }
}

// ─── CMC helpers ──────────────────────────────────────────────────────────────

/** Build CMC query parts based on mode. Returns [] when no values are set. */
function buildCmcParts(filters: Partial<SearchFilters>): string[] {
  const mode = filters.cmcMode ?? "range";
  switch (mode) {
    case "exact":
      return filters.cmcExact !== null && filters.cmcExact !== undefined
        ? [`cmc=${filters.cmcExact}`]
        : [];
    case "min":
      return filters.cmcMin !== null && filters.cmcMin !== undefined
        ? [`cmc>=${filters.cmcMin}`]
        : [];
    case "max":
      return filters.cmcMax !== null && filters.cmcMax !== undefined
        ? [`cmc<=${filters.cmcMax}`]
        : [];
    default: {
      const parts: string[] = [];
      if (filters.cmcMin !== null && filters.cmcMin !== undefined)
        parts.push(`cmc>=${filters.cmcMin}`);
      if (filters.cmcMax !== null && filters.cmcMax !== undefined)
        parts.push(`cmc<=${filters.cmcMax}`);
      return parts;
    }
  }
}

// ─── Price helpers ────────────────────────────────────────────────────────────

/** Build USD price query parts. Returns [] when neither bound is set. */
function buildPriceParts(filters: Partial<SearchFilters>): string[] {
  const parts: string[] = [];
  if (filters.priceMin !== null && filters.priceMin !== undefined)
    parts.push(`usd>=${filters.priceMin}`);
  if (filters.priceMax !== null && filters.priceMax !== undefined)
    parts.push(`usd<=${filters.priceMax}`);
  return parts;
}

// ─── Power / Toughness helpers ────────────────────────────────────────────────

/** Build power/toughness query parts. Returns [] when no bounds are set. */
function buildPowerToughnessParts(filters: Partial<SearchFilters>): string[] {
  const parts: string[] = [];
  if (filters.powerMin !== null && filters.powerMin !== undefined)
    parts.push(`pow>=${filters.powerMin}`);
  if (filters.powerMax !== null && filters.powerMax !== undefined)
    parts.push(`pow<=${filters.powerMax}`);
  if (filters.toughnessMin !== null && filters.toughnessMin !== undefined)
    parts.push(`tou>=${filters.toughnessMin}`);
  if (filters.toughnessMax !== null && filters.toughnessMax !== undefined)
    parts.push(`tou<=${filters.toughnessMax}`);
  return parts;
}

// ─── Main query builder ───────────────────────────────────────────────────────

/**
 * Build a full Scryfall query string from free-text + filter object.
 *
 * Filter field → Scryfall syntax mapping:
 *  - colors + colorMode   → id<=…  / c>=…  / c=…  (see buildColorQuery)
 *  - colorlessFilter      → c:c
 *  - landFilter           → t:land  (composable with color filter)
 *  - types                → (type:X OR type:Y)
 *  - cmcMode + values     → cmc>=N / cmc<=N / cmc=N  (see buildCmcParts)
 *  - priceMin/priceMax    → usd>=N / usd<=N
 *  - subtype              → t:<subtype>
 *  - keyword              → keyword:<keyword>
 *  - powerMin/powerMax    → pow>=N / pow<=N
 *  - toughnessMin/Max     → tou>=N / tou<=N
 *  - interactionType      → oracle-text fragments (see buildInteractionQuery)
 *
 * Always appends "legal:commander" to scope results to EDH-legal cards.
 */
export function buildSearchQuery(
  text: string,
  filters: Partial<SearchFilters> = {}
): string {
  const parts: string[] = [];

  if (text.trim()) {
    parts.push(
      text.includes(":")
        ? text.trim()
        : `name:/${text.trim()}/`
    );
  }

  // colorlessFilter (c:c) is mutually exclusive with WUBRG and takes priority
  if (filters.colorlessFilter) {
    parts.push("c:c");
  } else if (filters.colors && filters.colors.length > 0) {
    parts.push(buildColorQuery(filters.colors, filters.colorMode ?? "or"));
  }
  if (filters.landFilter) parts.push("t:land");

  if (filters.types && filters.types.length > 0) {
    parts.push(`(${filters.types.map((t) => `type:${t}`).join(" OR ")})`);
  }

  parts.push(...buildCmcParts(filters));
  parts.push(...buildPriceParts(filters));

  if (filters.subtype?.trim()) parts.push(`t:${filters.subtype.trim()}`);
  if (filters.keyword?.trim()) parts.push(`keyword:${filters.keyword.trim()}`);

  parts.push(...buildPowerToughnessParts(filters));

  if (filters.interactionType) parts.push(buildInteractionQuery(filters.interactionType));

  parts.push("legal:commander");

  return parts.join(" ");
}

/** Commander search query — legendary creatures and planeswalkers that can be commanders */
export function buildCommanderSearchQuery(
  text: string,
  filters: Partial<SearchFilters> = {}
): string {
  const parts: string[] = ["is:commander"];
  const name = text.trim();
  if (name) parts.push(`name:/${name}/`);
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
  const colorPart =
    filters.colors && filters.colors.length > 0
      ? ` id<=${filters.colors.join("")}`
      : "";

  switch (pairingType) {
    case "partner":
      return `is:commander o:"Partner" -o:"Partner with" -o:"Character select"${namePart}${colorPart}`;
    case "character_select":
      return `is:commander o:"Character select"${namePart}`;
    case "friends_forever":
      return `is:commander o:"Friends forever"${namePart}${colorPart}`;
    case "partner_with":
      return `is:commander o:"Partner with"${namePart}${colorPart}`;
    default:
      return `is:commander${namePart}${colorPart}`;
  }
}

/** Build a query for browsing cards from a specific set */
export function buildSetSearchQuery(
  setCode: string,
  colorFilter: string[] = []
): string {
  const parts: string[] = [`set:${setCode}`, "legal:commander"];
  if (colorFilter.length > 0) parts.push(`id<=${colorFilter.join("")}`);
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
  if (colors.length > 0) {
    parts.push(exact ? `c=${colors.join("")}` : `id<=${colors.join("")}`);
  }
  return parts.join(" ");
}
