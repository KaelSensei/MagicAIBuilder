import { describe, expect, it } from "vitest";
import {
  canViewDeck,
  DECK_ACCESS_BY_ID,
  DECK_ACCESS_BY_SHARE_TOKEN,
  type DeckAccess,
  type DeckViewDecision,
  type DeckVisibilityFacts,
} from "./deck-visibility-policy";

/**
 * The whole deck visibility rule as one table: every viewer, every
 * visibility, sharing on and off, arriving by id or by share link.
 *
 * It pins the rule as the routes apply it today (`GET /api/deck/[id]`, the
 * community routes through `findVisibleDeck`, `GET /api/share/[token]`), so a
 * refactor of any caller has a safety net that names the exact combination it
 * broke.
 */

const OWNER = "owner-1";
const STRANGER = "stranger-1";

type Viewer = "owner" | "stranger" | "anonymous";

const VIEWER_ID: Readonly<Record<Viewer, string | null>> = {
  owner: OWNER,
  stranger: STRANGER,
  anonymous: null,
};

function deck(
  isPublic: boolean,
  shareEnabled: boolean,
  ownerId: string | null = OWNER
): DeckVisibilityFacts {
  return { ownerId, isPublic, shareEnabled };
}

const OWNER_VIEW: DeckViewDecision = { allowed: true, view: "owner" };
const READER_VIEW: DeckViewDecision = { allowed: true, view: "reader" };
const PRIVATE: DeckViewDecision = { allowed: false, reason: "private" };
const SHARING_DISABLED: DeckViewDecision = {
  allowed: false,
  reason: "sharing-disabled",
};

interface Row {
  readonly viewer: Viewer;
  readonly isPublic: boolean;
  readonly shareEnabled: boolean;
  readonly access: DeckAccess;
  readonly decision: DeckViewDecision;
}

/** Arriving by id: the owner sees everything, others see public decks only; sharing plays no part. */
const BY_ID: readonly Row[] = [
  {
    viewer: "owner",
    isPublic: true,
    shareEnabled: true,
    access: DECK_ACCESS_BY_ID,
    decision: OWNER_VIEW,
  },
  {
    viewer: "owner",
    isPublic: true,
    shareEnabled: false,
    access: DECK_ACCESS_BY_ID,
    decision: OWNER_VIEW,
  },
  {
    viewer: "owner",
    isPublic: false,
    shareEnabled: true,
    access: DECK_ACCESS_BY_ID,
    decision: OWNER_VIEW,
  },
  {
    viewer: "owner",
    isPublic: false,
    shareEnabled: false,
    access: DECK_ACCESS_BY_ID,
    decision: OWNER_VIEW,
  },
  {
    viewer: "stranger",
    isPublic: true,
    shareEnabled: true,
    access: DECK_ACCESS_BY_ID,
    decision: READER_VIEW,
  },
  {
    viewer: "stranger",
    isPublic: true,
    shareEnabled: false,
    access: DECK_ACCESS_BY_ID,
    decision: READER_VIEW,
  },
  {
    viewer: "stranger",
    isPublic: false,
    shareEnabled: true,
    access: DECK_ACCESS_BY_ID,
    decision: PRIVATE,
  },
  {
    viewer: "stranger",
    isPublic: false,
    shareEnabled: false,
    access: DECK_ACCESS_BY_ID,
    decision: PRIVATE,
  },
  {
    viewer: "anonymous",
    isPublic: true,
    shareEnabled: true,
    access: DECK_ACCESS_BY_ID,
    decision: READER_VIEW,
  },
  {
    viewer: "anonymous",
    isPublic: true,
    shareEnabled: false,
    access: DECK_ACCESS_BY_ID,
    decision: READER_VIEW,
  },
  {
    viewer: "anonymous",
    isPublic: false,
    shareEnabled: true,
    access: DECK_ACCESS_BY_ID,
    decision: PRIVATE,
  },
  {
    viewer: "anonymous",
    isPublic: false,
    shareEnabled: false,
    access: DECK_ACCESS_BY_ID,
    decision: PRIVATE,
  },
];

/** Arriving by share link: the link is the capability; who holds it does not matter. */
const BY_SHARE_TOKEN: readonly Row[] = [
  {
    viewer: "owner",
    isPublic: true,
    shareEnabled: true,
    access: DECK_ACCESS_BY_SHARE_TOKEN,
    decision: READER_VIEW,
  },
  {
    viewer: "owner",
    isPublic: true,
    shareEnabled: false,
    access: DECK_ACCESS_BY_SHARE_TOKEN,
    decision: SHARING_DISABLED,
  },
  {
    viewer: "owner",
    isPublic: false,
    shareEnabled: true,
    access: DECK_ACCESS_BY_SHARE_TOKEN,
    decision: READER_VIEW,
  },
  {
    viewer: "owner",
    isPublic: false,
    shareEnabled: false,
    access: DECK_ACCESS_BY_SHARE_TOKEN,
    decision: SHARING_DISABLED,
  },
  {
    viewer: "stranger",
    isPublic: true,
    shareEnabled: true,
    access: DECK_ACCESS_BY_SHARE_TOKEN,
    decision: READER_VIEW,
  },
  {
    viewer: "stranger",
    isPublic: true,
    shareEnabled: false,
    access: DECK_ACCESS_BY_SHARE_TOKEN,
    decision: SHARING_DISABLED,
  },
  {
    viewer: "stranger",
    isPublic: false,
    shareEnabled: true,
    access: DECK_ACCESS_BY_SHARE_TOKEN,
    decision: READER_VIEW,
  },
  {
    viewer: "stranger",
    isPublic: false,
    shareEnabled: false,
    access: DECK_ACCESS_BY_SHARE_TOKEN,
    decision: SHARING_DISABLED,
  },
  {
    viewer: "anonymous",
    isPublic: true,
    shareEnabled: true,
    access: DECK_ACCESS_BY_SHARE_TOKEN,
    decision: READER_VIEW,
  },
  {
    viewer: "anonymous",
    isPublic: true,
    shareEnabled: false,
    access: DECK_ACCESS_BY_SHARE_TOKEN,
    decision: SHARING_DISABLED,
  },
  {
    viewer: "anonymous",
    isPublic: false,
    shareEnabled: true,
    access: DECK_ACCESS_BY_SHARE_TOKEN,
    decision: READER_VIEW,
  },
  {
    viewer: "anonymous",
    isPublic: false,
    shareEnabled: false,
    access: DECK_ACCESS_BY_SHARE_TOKEN,
    decision: SHARING_DISABLED,
  },
];

function describeRow(row: Row): string {
  const visibility = row.isPublic ? "public" : "private";
  const sharing = row.shareEnabled ? "sharing on" : "sharing off";
  const outcome = row.decision.allowed
    ? `sees it as ${row.decision.view}`
    : `is refused: ${row.decision.reason}`;
  return `${row.viewer} opening a ${visibility} deck (${sharing}) by ${row.access.kind} ${outcome}`;
}

describe("canViewDeck", () => {
  it.each([...BY_ID, ...BY_SHARE_TOKEN].map((row) => [describeRow(row), row]))(
    "%s",
    (_name, row) => {
      expect(
        canViewDeck(
          deck(row.isPublic, row.shareEnabled),
          VIEWER_ID[row.viewer],
          row.access
        )
      ).toEqual(row.decision);
    }
  );

  it("covers every combination of viewer, visibility, sharing and access once", () => {
    const combinations = new Set(
      [...BY_ID, ...BY_SHARE_TOKEN].map(
        (row) =>
          `${row.viewer}/${row.isPublic}/${row.shareEnabled}/${row.access.kind}`
      )
    );

    expect(combinations.size).toBe(3 * 2 * 2 * 2);
  });

  // Both sides are nullable in the schema. Reading `null === null` as
  // ownership would show a deck with no owner to every signed-out viewer.
  it("never treats an anonymous viewer as the owner of an ownerless deck", () => {
    expect(
      canViewDeck(deck(false, false, null), null, DECK_ACCESS_BY_ID)
    ).toEqual(PRIVATE);
  });

  it("shows an ownerless public deck to a signed-in viewer as a reader, not as its owner", () => {
    expect(
      canViewDeck(deck(true, false, null), STRANGER, DECK_ACCESS_BY_ID)
    ).toEqual(READER_VIEW);
  });

  it("hides an ownerless private deck from a signed-in viewer", () => {
    expect(
      canViewDeck(deck(false, false, null), STRANGER, DECK_ACCESS_BY_ID)
    ).toEqual(PRIVATE);
  });
});
