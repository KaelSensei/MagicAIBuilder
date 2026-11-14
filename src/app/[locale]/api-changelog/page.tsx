/**
 * The public changelog of `/api/v1` (I-95).
 *
 * Signed-out visitors can read it. The page renders the stored changelog
 * and does not load a deck. Metadata comes from the `apiChangelog` catalogue.
 */
import { ApiChangelogView } from "@/components/api/ApiChangelogView";
import { Header } from "@/components/layout/Header";
import { API_CHANGELOG } from "@/lib/api/api-changelog";
import { fixedPageMetadata } from "@/lib/seo/page-metadata";

export const generateMetadata = fixedPageMetadata("apiChangelog");

/** The changelog page. No session, no deck. */
export default function ApiChangelogPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)] text-[var(--text-primary)]">
      <Header />
      <ApiChangelogView entries={API_CHANGELOG} />
    </div>
  );
}
