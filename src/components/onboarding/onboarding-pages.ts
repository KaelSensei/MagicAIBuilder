/**
 * Which pages the onboarding dialog may open on by itself.
 *
 * Identity (`components/onboarding`). A visitor reading a public page (the
 * landing page, a shared or public deck, a profile, the commander and rules
 * pages, sign-in and sign-up) has not asked for a tutorial, and a modal there
 * stands between them and the page (I-39 functional requirement 1.1,
 * docs/product/specs/i39-first-run-activation-and-measurement.md). The public
 * pages are the list the middleware already reads, so a page made public later
 * is covered too. The guest builder is the exception: it is the page the
 * dialog's steps describe, until I-39 slice 5 replaces the dialog there with an
 * inline panel.
 *
 * @module onboarding/onboarding-pages
 */
import { isPublicPagePath, stripLocalePrefix } from "@/lib/auth/public-paths";

/** The guest builder: public, and the page the dialog's steps describe. */
const GUEST_BUILDER_PATH = "/builder/guest";

/**
 * Whether the onboarding dialog may open on this page without being asked.
 * A replay the player asks for is not limited by this rule.
 *
 * @param pathname The page's pathname, with or without a served-locale prefix
 *   (`/deck/1` and `/fr/deck/1` get the same answer).
 * @returns False on a public page other than the guest builder; true on every
 *   page that needs an account, and on the guest builder.
 */
export function onboardingMayOpenUnasked(pathname: string): boolean {
  const page = stripLocalePrefix(pathname);
  return page === GUEST_BUILDER_PATH || !isPublicPagePath(page);
}
