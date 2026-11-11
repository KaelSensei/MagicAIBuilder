import { ApiKeysPageClient } from "@/components/settings/ApiKeysPageClient";
import { Header } from "@/components/layout/Header";
import { fixedPageMetadata } from "@/lib/seo/page-metadata";

export const generateMetadata = fixedPageMetadata("settings.apiKeys", {
  // Credentials management has nothing a search engine should index, and a
  // listing of the page would only advertise where keys live.
  robots: { index: false, follow: false },
});

export default function ApiKeysPage() {
  return (
    <div className="flex h-screen flex-col bg-[var(--bg)] text-[var(--text-primary)]">
      <Header />
      <ApiKeysPageClient />
    </div>
  );
}
