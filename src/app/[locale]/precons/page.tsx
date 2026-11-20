/**
 * The public precon catalogue (I-17 slice 1).
 *
 * Signed-out visitors can read it. The page renders the stored versions and
 * does not load a player's deck. The published list is empty until I-67
 * slice 13 imports the first dated set.
 */
import { Header } from "@/components/layout/Header";
import { PreconCatalogueView } from "@/components/precon/PreconCatalogueView";
import { PUBLISHED_PRECONS } from "@/lib/precon/catalogue";
import { fixedPageMetadata } from "@/lib/seo/page-metadata";

export const generateMetadata = fixedPageMetadata("precons");

/** The catalogue page. No session, no deck. */
export default function PreconsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)] text-[var(--text-primary)]">
      <Header />
      <PreconCatalogueView catalogue={PUBLISHED_PRECONS} />
    </div>
  );
}
