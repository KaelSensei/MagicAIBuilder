import { LoaderCircle } from "lucide-react";
import { cn } from "@/components/ui/utils";

interface DeckSaveIndicatorProps {
  readonly saving: boolean;
  readonly label: string;
}

/** Displays non-blocking deck persistence activity without shifting the title bar. */
export function DeckSaveIndicator({ saving, label }: DeckSaveIndicatorProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={saving ? label : undefined}
      className={cn(
        "flex min-w-4 items-center gap-1 text-[10px] text-[var(--text-secondary)] transition-opacity",
        saving ? "opacity-100" : "pointer-events-none opacity-0"
      )}
    >
      <LoaderCircle aria-hidden="true" className="h-3 w-3 animate-spin" />
      <span className="hidden sm:inline">{label}</span>
    </div>
  );
}
