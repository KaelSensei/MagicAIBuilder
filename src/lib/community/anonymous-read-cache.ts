/**
 * How long a public, viewer-independent read may be served from Next's data
 * cache before the database is asked again.
 *
 * The public profile page (`/u/[username]`) and the commander decks page
 * (`/commanders/[slug]/decks`) render the same data for every signed-out
 * visitor, so one database read a minute serves them all. A signed-in viewer's
 * answer carries viewer-relative fields (`isFollowing`, `viewerVote`); it is
 * never cached, so it never reaches another viewer. The window is the one the
 * pages used while they read through the app's own API with
 * `next: { revalidate }`.
 *
 * @module community/anonymous-read-cache
 */

/** Seconds a signed-out visitor's read may be served from Next's data cache. */
export const ANONYMOUS_READ_REVALIDATE_SECONDS = 60;
