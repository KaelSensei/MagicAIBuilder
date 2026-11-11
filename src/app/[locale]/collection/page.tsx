import { CollectionPageClient } from "@/components/collection/CollectionPageClient";
import { Header } from "@/components/layout/Header";
import { fixedPageMetadata } from "@/lib/seo/page-metadata";

export const generateMetadata = fixedPageMetadata("collection");

export default function CollectionPage() {
  return (
    <div className="flex h-screen flex-col bg-[var(--background)] text-[var(--text-primary)]">
      <Header />
      <CollectionPageClient />
    </div>
  );
}
