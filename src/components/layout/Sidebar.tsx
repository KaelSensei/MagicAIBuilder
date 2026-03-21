"use client";
// Left sidebar — deck categories / quick nav
import { cn } from "@/components/ui/utils";

interface SidebarProps {
  readonly className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  return (
    <aside className={cn("w-[220px] shrink-0 border-r border-[var(--border)] bg-[var(--surface)] p-4", className)}>
      <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide mb-3">
        Navigation
      </p>
      {/* Placeholder for future sidebar content */}
    </aside>
  );
}
