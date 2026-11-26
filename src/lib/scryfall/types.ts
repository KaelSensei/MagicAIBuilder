// Scryfall API response types
/**
 * Image versions of a card or face. Scryfall added the WebP set on 2026-10-14
 * (thumb 146×204, grid 488×680, display 672×936, crop 480×680, art varies) and
 * renamed `normal` to `jpeg`. On 2027-01-01 it drops the small, large,
 * border_crop and art_crop JPEGs and stops PNG hotlinking; card JSON cached
 * before the change carries only those JPEG-era keys.
 */
export interface ScryfallImageUris {
  thumb?: string;
  grid?: string;
  display?: string;
  crop?: string;
  art?: string;
  jpeg?: string;
  small?: string;
  normal?: string;
  large?: string;
  png?: string;
  art_crop?: string;
  border_crop?: string;
}
export interface ScryfallCardFace {
  name: string; mana_cost?: string; type_line?: string; oracle_text?: string;
  power?: string; toughness?: string;
  image_uris?: ScryfallImageUris; colors?: string[]; color_indicator?: string[];
  /** Text as printed on a non-English face; the fields above stay oracle (English) */
  printed_name?: string; printed_type_line?: string; printed_text?: string;
}
export const DFC_LAYOUTS: ReadonlySet<string> = new Set(["modal_dfc","transform","reversible_card","double_faced_token"]);
export interface ScryfallCard {
  id: string; oracle_id?: string; name: string; layout?: string; mana_cost?: string; cmc: number;
  type_line: string; oracle_text?: string; colors?: string[]; color_identity: string[];
  power?: string; toughness?: string;
  image_uris?: ScryfallImageUris; card_faces?: ScryfallCardFace[];
  prices?: { usd?: string|null; usd_foil?: string|null; eur?: string|null };
  legalities?: { commander?: string; brawl?: string; [key: string]: string|undefined };
  set?: string; set_name?: string; rarity?: string; artist?: string; flavor_text?: string; keywords?: string[];
  /** Scryfall language code of this printing, e.g. "en", "fr", "zhs" */
  lang?: string;
  /** Text as printed on a non-English card; the fields above stay oracle (English) */
  printed_name?: string; printed_type_line?: string; printed_text?: string;
  /**
   * Release date of this printing's set, "YYYY-MM-DD". Scryfall always sends it; card JSON
   * cached before 2026-11-15 lacks it (https://scryfall.com/docs/api/cards, read 2026-11-15).
   */
  released_at?: string;
  /** True when this card was printed before, in another set (same source) */
  reprint?: boolean;
  /** Present on a card a partner or Wizards revealed before release (same source) */
  preview?: ScryfallPreview;
  /**
   * True when the card is on the official Game Changers list, false otherwise. Scryfall sends it
   * on every card object, collection answers included (recorded 2026-11-19 in
   * `fixtures/game-changers-v1.ts`); optional because card JSON built by hand or cached elsewhere
   * may lack it.
   */
  game_changer?: boolean;
}
/** Who revealed a preview card, and when ("YYYY-MM-DD"), as Scryfall records it */
export interface ScryfallPreview { previewed_at?: string; source?: string; source_uri?: string; }
export interface ScryfallSearchResponse { object: "list"; total_cards: number; has_more: boolean; next_page?: string; data: ScryfallCard[]; }
/** Empty search response — Scryfall answers 404 when a valid query matches nothing */
export const EMPTY_SEARCH_RESPONSE: ScryfallSearchResponse = { object: "list", total_cards: 0, has_more: false, data: [] };
export interface ScryfallError { object: "error"; code: string; status: number; details: string; }
export interface ScryfallAutocompleteResponse { object: "catalog"; total_values: number; data: string[]; }
export interface ScryfallCollectionIdentifier { id?: string; name?: string; set?: string; collector_number?: string; }
export interface ScryfallCollectionResponse { object: "list"; not_found: ScryfallCollectionIdentifier[]; data: ScryfallCard[]; }
/** A set from Scryfall's `/sets` list, with the fields the app reads (https://scryfall.com/docs/api/sets) */
export interface ScryfallSet { code: string; name: string; set_type: string; released_at?: string; card_count: number; }
export interface ScryfallSetList { object: "list"; data: ScryfallSet[]; }
