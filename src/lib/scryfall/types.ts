// Scryfall API response types
export interface ScryfallImageUris {
  small?: string; normal?: string; large?: string; png?: string; art_crop?: string; border_crop?: string;
}
export interface ScryfallCardFace {
  name: string; mana_cost?: string; type_line?: string; oracle_text?: string;
  power?: string; toughness?: string;
  image_uris?: ScryfallImageUris; colors?: string[]; color_indicator?: string[];
}
export const DFC_LAYOUTS: ReadonlySet<string> = new Set(["modal_dfc","transform","reversible_card","double_faced_token"]);
export interface ScryfallCard {
  id: string; name: string; layout?: string; mana_cost?: string; cmc: number;
  type_line: string; oracle_text?: string; colors?: string[]; color_identity: string[];
  power?: string; toughness?: string;
  image_uris?: ScryfallImageUris; card_faces?: ScryfallCardFace[];
  prices?: { usd?: string|null; usd_foil?: string|null; eur?: string|null };
  legalities?: { commander?: string; brawl?: string; [key: string]: string|undefined };
  set?: string; set_name?: string; rarity?: string; artist?: string; flavor_text?: string; keywords?: string[];
}
export interface ScryfallSearchResponse { object: "list"; total_cards: number; has_more: boolean; next_page?: string; data: ScryfallCard[]; }
export interface ScryfallError { object: "error"; code: string; status: number; details: string; }
export interface ScryfallAutocompleteResponse { object: "catalog"; total_values: number; data: string[]; }
export interface ScryfallCollectionIdentifier { id?: string; name?: string; set?: string; collector_number?: string; }
export interface ScryfallCollectionResponse { object: "list"; not_found: ScryfallCollectionIdentifier[]; data: ScryfallCard[]; }
