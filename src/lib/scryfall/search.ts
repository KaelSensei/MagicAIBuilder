// Scryfall search query builder
import type { ColorMode, InteractionType, SearchFilters } from "@/lib/deck/types";
import { getFormatConfig } from "@/lib/deck/formats";
import type { DeckFormat } from "@/lib/deck/formats";
import {
  partnerRequirements,
  type PartnerRequirement,
} from "@/lib/deck/pairing";
import type { PairingCard } from "@/lib/deck/partner-abilities";

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

/** Returns true if value is neither null nor undefined */
function isDefined(value: number | null | undefined): value is number {
  return value !== null && value !== undefined;
}

/** Build CMC query parts based on mode. Returns [] when no values are set. */
function buildCmcParts(filters: Partial<SearchFilters>): string[] {
  const mode = filters.cmcMode ?? "range";
  switch (mode) {
    case "exact":
      return isDefined(filters.cmcExact) ? [`cmc=${filters.cmcExact}`] : [];
    case "min":
      return isDefined(filters.cmcMin) ? [`cmc>=${filters.cmcMin}`] : [];
    case "max":
      return isDefined(filters.cmcMax) ? [`cmc<=${filters.cmcMax}`] : [];
    default: {
      const parts: string[] = [];
      if (isDefined(filters.cmcMin)) parts.push(`cmc>=${filters.cmcMin}`);
      if (isDefined(filters.cmcMax)) parts.push(`cmc<=${filters.cmcMax}`);
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
 * Appends `legal:{format}` to scope results to format-legal cards.
 */
export function buildSearchQuery(
  text: string,
  filters: Partial<SearchFilters> = {},
  format: DeckFormat = "commander"
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
    const typeFragments = filters.types.map((t) => `type:${t}`).join(" OR ");
    parts.push(`(${typeFragments})`);
  }

  parts.push(...buildCmcParts(filters), ...buildPriceParts(filters));

  if (filters.subtype?.trim()) parts.push(`t:${filters.subtype.trim()}`);
  if (filters.keyword?.trim()) parts.push(`keyword:${filters.keyword.trim()}`);

  parts.push(...buildPowerToughnessParts(filters));

  if (filters.interactionType) parts.push(buildInteractionQuery(filters.interactionType));

  parts.push(`legal:${getFormatConfig(format).scryfallLegality}`);

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

/**
 * The Scryfall query for the cards that meet one partner requirement of the
 * commander (CR 702.124).
 *
 * @param requirement - one way the commander can pair
 * @param format - the deck's format, for the Background legality filter
 * @returns a query fragment without name or colour filters
 */
function partnerRequirementQuery(
  requirement: PartnerRequirement,
  format: DeckFormat
): string {
  switch (requirement.kind) {
    case "partner":
      return 'is:commander o:"Partner" -o:"Partner with" -o:"Partner—"';
    case "partnerQuality":
      return `is:commander o:"Partner—${requirement.quality}"`;
    case "namedPartner":
      return `!"${requirement.name}"`;
    case "background":
      // Backgrounds are not commanders; they are legendary enchantments with subtype Background.
      return `t:background legal:${getFormatConfig(format).scryfallLegality}`;
    case "backgroundChooser":
      return 'is:commander o:"Choose a Background"';
    case "timeLordDoctor":
      return 'is:commander t:"Time Lord" t:Doctor';
    case "doctorsCompanion":
      return `is:commander o:"Doctor's companion"`;
    default: {
      const exhaustive: never = requirement;
      return exhaustive;
    }
  }
}

/** Joins alternative queries so that Scryfall matches any of them. */
function anyOf(queries: readonly string[]): string {
  if (queries.length === 0) return "is:commander";
  if (queries.length === 1) return queries[0];
  return `(${queries.map((query) => `(${query})`).join(" or ")})`;
}

/**
 * Builds the search for the second command-zone slot from the commander's
 * partner abilities, so the results are the cards it can pair with.
 *
 * @param commander - the deck's commander, or null before one is chosen
 * @param text - the name the player typed
 * @param filters - the search filters; only the colours apply here
 * @param format - the deck's format
 * @returns the Scryfall query
 */
export function buildPartnerSearchQuery(
  commander: PairingCard | null,
  text: string,
  filters: Partial<SearchFilters> = {},
  format: DeckFormat = "commander"
): string {
  const name = text.trim();
  const namePart = name ? ` name:/${name}/` : "";
  const colorPart =
    filters.colors && filters.colors.length > 0
      ? ` id<=${filters.colors.join("")}`
      : "";
  const requirements = commander ? partnerRequirements(commander) : [];
  const queries = requirements.map((requirement) =>
    partnerRequirementQuery(requirement, format)
  );
  return `${anyOf(queries)}${namePart}${colorPart}`;
}

/** Companion search — cards with the Companion keyword, format-legal */
export function buildCompanionSearchQuery(
  text: string,
  filters: Partial<SearchFilters> = {},
  format: DeckFormat = "commander"
): string {
  const parts: string[] = ["keyword:companion", `legal:${getFormatConfig(format).scryfallLegality}`];
  const name = text.trim();
  if (name) parts.push(`name:/${name}/`);
  if (filters.colors && filters.colors.length > 0) {
    parts.push(`id<=${filters.colors.join("")}`);
  }
  return parts.join(" ");
}

/** Build a query for browsing cards from a specific set */
export function buildSetSearchQuery(
  setCode: string,
  colorFilter: string[] = [],
  format: DeckFormat = "commander"
): string {
  const parts: string[] = [`set:${setCode}`, `legal:${getFormatConfig(format).scryfallLegality}`];
  if (colorFilter.length > 0) parts.push(`id<=${colorFilter.join("")}`);
  return parts.join(" ");
}

/** Build a query for filtering by color */
export function buildColorSearchQuery(
  colors: string[],
  text: string = "",
  exact = false,
  format: DeckFormat = "commander"
): string {
  const parts: string[] = [`legal:${getFormatConfig(format).scryfallLegality}`];
  if (text.trim()) parts.push(`name:/${text.trim()}/`);
  if (colors.length > 0) {
    parts.push(exact ? `c=${colors.join("")}` : `id<=${colors.join("")}`);
  }
  return parts.join(" ");
}
