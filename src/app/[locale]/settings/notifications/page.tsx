import { Header } from "@/components/layout/Header";
import { NotificationPreferencesPanel } from "@/components/settings/NotificationPreferencesPanel";
import { fixedPageMetadata } from "@/lib/seo/page-metadata";

export const generateMetadata = fixedPageMetadata("settings.notifications", {
  robots: { index: false, follow: false },
});

/** Private controls for a signed-in player's community notification events. */
export default function NotificationPreferencesPage() {
  return (
    <div className="flex h-screen flex-col bg-[var(--bg)] text-[var(--text-primary)]">
      <Header />
      <NotificationPreferencesPanel />
    </div>
  );
}
