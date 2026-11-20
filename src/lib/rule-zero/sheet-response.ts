/**
 * The JSON body of `GET /api/decks/[id]/rule-zero` (I-15 slice 1).
 *
 * The browser reads this instead of trusting a cast. A body that is not a
 * declared sheet is invalid, including one that only carries a deck list.
 *
 * @module rule-zero/sheet-response
 */
import { isRecord } from "@/lib/guards";
import {
  parseSheetDraft,
  type RuleZeroSheetDraft,
} from "@/lib/rule-zero/sheet";

/** What a successful read of the sheet route means. */
export type SheetResponse =
  | { readonly kind: "empty" }
  | {
      readonly kind: "sheet";
      readonly id: string;
      readonly draft: RuleZeroSheetDraft;
    }
  | { readonly kind: "invalid" };

/**
 * Read the route's JSON.
 *
 * @param value - `response.json()`, untrusted
 * @returns an empty sheet, the declared sheet, or invalid
 */
export function parseSheetResponse(value: unknown): SheetResponse {
  if (!isRecord(value) || !Object.hasOwn(value, "sheet"))
    return { kind: "invalid" };
  if (value.sheet === null) return { kind: "empty" };
  if (!isRecord(value.sheet) || !isSheetId(value.sheet.id))
    return { kind: "invalid" };

  const parsed = parseSheetDraft(value.sheet);
  if (!parsed.ok) return { kind: "invalid" };
  return { kind: "sheet", id: value.sheet.id, draft: parsed.draft };
}

/** @returns whether `value` can be a sheet id. */
function isSheetId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}
