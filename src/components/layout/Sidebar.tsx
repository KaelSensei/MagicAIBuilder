"use client";
// Left sidebar — deck categories / quick nav
import { useTranslations } from "next-intl";
import { cn } from "@/components/ui/utils";

interface SidebarProps {
  readonly className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const t = useTranslations("common");

  return (
    <aside className={cn("w-[220px] shrink-0 border-r border-[var(--border)] bg-[var(--surface)] p-4", className)}>
      <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide mb-3">
        {t("sidebar.navigation")}
      </p>
      {/* Placeholder for future sidebar content */}
    </aside>
  );
}
