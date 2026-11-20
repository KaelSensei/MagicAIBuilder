/**
 * The theme the player is editing in the builder's Theme panel, before it is
 * a `DeckTheme` the coverage can read.
 *
 * Deck analysis (ui), I-102 slice 3. The theme lives in the panel's state for
 * the session: storing it with the deck is slice 2, which needs a migration
 * (`docs/product/specs/i102-a-theme-you-can-measure.md`, Data model). A handle
 * the player has not filled yet is kept in the draft and left out of the
 * theme, so a half-typed handle never counts as matching nothing.
 * Not responsible for: matching (`lib/deck/theme-match.ts`) or counting
 * (`lib/deck/theme-coverage.ts`).
 *
 * @module components/deck/theme-draft
 */
import type { DeckTheme, ThemeHandle } from "@/lib/deck/theme-match";

/** A handle kind version 1 reads from a stored card field. */
export type StoredHandleKind = ThemeHandle["kind"];

/** The handle kinds the player can choose, in the order the spec lists them (I-102 2.1). */
export const STORED_HANDLE_KINDS: readonly StoredHandleKind[] = [
  "creatureType",
  "nameWord",
  "firstLetter",
  "textWord",
  "cardType",
];

/**
 * The handle kinds that need card details the deck does not store yet. They
 * are shown greyed, never as a zero count (I-102 6.2), until I-67's printings
 * land (slice 6).
 */
export const PENDING_HANDLE_KINDS = [
  "artist",
  "planeOrSet",
  "watermark",
  "flavorWord",
] as const;

/** A theme holds one to three handles (I-102 2.1). */
export const MAX_HANDLES = 3;

/** The longest handle value the data model allows (I-102, `ThemeHandle.value`). */
export const MAX_HANDLE_LENGTH = 40;

/** One handle as the player edits it; `id` keys its row. */
export interface HandleDraft {
  readonly id: number;
  readonly kind: StoredHandleKind;
  readonly value: string;
  /** Read only by a first-letter handle */
  readonly ignoreLeadingThe: boolean;
}

/** What the player can change on one handle. */
export type HandleChanges = Partial<
  Pick<HandleDraft, "kind" | "value" | "ignoreLeadingThe">
>;

/** The whole theme as the player edits it. */
export interface ThemeDraft {
  readonly handles: readonly HandleDraft[];
  readonly match: DeckTheme["match"];
  /** Basic lands are left out until the player counts them (I-102 2.3) */
  readonly countBasics: boolean;
  /** The id the next added handle takes */
  readonly nextId: number;
}

/** A change the player makes to the draft. */
export type ThemeDraftAction =
  | { readonly type: "addHandle" }
  | { readonly type: "removeHandle"; readonly id: number }
  | {
      readonly type: "editHandle";
      readonly id: number;
      readonly changes: HandleChanges;
    }
  | { readonly type: "setMatch"; readonly match: DeckTheme["match"] }
  | { readonly type: "setCountBasics"; readonly countBasics: boolean };

/**
 * A blank handle: a creature type, the first kind listed.
 *
 * @param id - the row's key
 */
function blankHandle(id: number): HandleDraft {
  return { id, kind: "creatureType", value: "", ignoreLeadingThe: false };
}

/** The draft the panel opens with: one blank handle, "any", basics left out. */
export const INITIAL_THEME_DRAFT: ThemeDraft = {
  handles: [blankHandle(0)],
  match: "any",
  countBasics: false,
  nextId: 1,
};

/**
 * Applies one change of the player to the draft. Adding a fourth handle does
 * nothing: a theme holds at most three (I-102 2.1).
 *
 * @param draft - the draft before the change
 * @param action - the change
 * @returns the draft after the change
 */
export function themeDraftReducer(
  draft: ThemeDraft,
  action: ThemeDraftAction
): ThemeDraft {
  switch (action.type) {
    case "addHandle":
      return draft.handles.length >= MAX_HANDLES
        ? draft
        : {
            ...draft,
            handles: [...draft.handles, blankHandle(draft.nextId)],
            nextId: draft.nextId + 1,
          };
    case "removeHandle":
      return {
        ...draft,
        handles: draft.handles.filter((handle) => handle.id !== action.id),
      };
    case "editHandle":
      return {
        ...draft,
        handles: draft.handles.map((handle) =>
          handle.id === action.id ? { ...handle, ...action.changes } : handle
        ),
      };
    case "setMatch":
      return { ...draft, match: action.match };
    case "setCountBasics":
      return { ...draft, countBasics: action.countBasics };
  }
  const _exhaustive: never = action;
  return _exhaustive;
}

/**
 * The handle a filled row stands for, or `null` while its value is blank.
 *
 * @param draft - one row of the editor
 */
function handleFrom(draft: HandleDraft): ThemeHandle | null {
  const value = draft.value.trim();
  if (value === "") {
    return null;
  }
  switch (draft.kind) {
    case "firstLetter":
      return {
        kind: draft.kind,
        value,
        ignoreLeadingThe: draft.ignoreLeadingThe,
      };
    case "creatureType":
    case "nameWord":
    case "textWord":
    case "cardType":
      return { kind: draft.kind, value };
  }
  const _exhaustive: never = draft.kind;
  return _exhaustive;
}

/**
 * The handles of the theme, in the editor's order, as the one-to-three tuple
 * `DeckTheme` requires, or `null` when none is filled.
 *
 * @param handles - the filled handles, at most three
 */
function handleTuple(
  handles: readonly ThemeHandle[]
): DeckTheme["handles"] | null {
  const [first, second, third] = handles;
  if (!first) {
    return null;
  }
  if (!second) {
    return [first];
  }
  return third ? [first, second, third] : [first, second];
}

/**
 * The theme the coverage reads, from the filled handles only.
 *
 * @param draft - the theme as the player edits it
 * @returns the theme, or `null` while no handle is filled
 */
export function themeFromDraft(draft: ThemeDraft): DeckTheme | null {
  const handles = handleTuple(
    draft.handles.flatMap((row) => {
      const handle = handleFrom(row);
      return handle ? [handle] : [];
    })
  );
  return handles
    ? { handles, match: draft.match, countBasics: draft.countBasics }
    : null;
}
