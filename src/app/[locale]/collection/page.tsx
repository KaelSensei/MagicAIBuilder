import { CollectionPageClient } from "@/components/collection/CollectionPageClient";
import { Header } from "@/components/layout/Header";

export const metadata = {
  title: "My Collection — MagicAIBuilder",
  description: "Manage your physical MTG card collection",
};

export default function CollectionPage() {
  return (
    <div className="flex h-screen flex-col bg-[var(--background)] text-[var(--text-primary)]">
      <Header />
      <CollectionPageClient />
    </div>
  );
}
