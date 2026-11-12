// How often one client may read decks through `GET /api/deck/[id]`.

/** Window the deck read limit is counted over. */
export const PUBLIC_DECK_READ_WINDOW_MS = 60_000;

/**
 * Deck reads one client address may make per window.
 *
 * The public deck page reads in-process (`findDeckForViewer`), so the route's
 * callers are the community deck comparison, which reads two decks per
 * comparison, and scripts. Sixty allows thirty comparisons a minute, far above
 * a person's pace, and holds a script to one deck a second per address.
 */
export const PUBLIC_DECK_READS_PER_CLIENT = 60;
