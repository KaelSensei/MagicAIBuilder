"use client";
// Contextual onboarding tooltip — highlights an element with a floating label
import { cn } from "@/components/ui/utils";

interface OnboardingTooltipProps {
  readonly children: React.ReactNode;
  readonly label: string;
  readonly visible: boolean;
  readonly side?: "top" | "bottom" | "left" | "right";
  readonly className?: string;
}

const SIDE_CLASSES: Record<string, string> = {
  top: "bottom-full mb-2 left-1/2 -translate-x-1/2",
  bottom: "top-full mt-2 left-1/2 -translate-x-1/2",
  left: "right-full mr-2 top-1/2 -translate-y-1/2",
  right: "left-full ml-2 top-1/2 -translate-y-1/2",
};

export function OnboardingTooltip({
  children,
  label,
  visible,
  side = "bottom",
  className,
}: OnboardingTooltipProps) {
  if (!visible) return <>{children}</>;

  return (
    <div className={cn("relative inline-flex", className)}>
      {/* Highlight ring */}
      <div className="absolute inset-0 rounded-lg ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--background)] pointer-events-none z-10 animate-pulse" />

      {children}

      {/* Tooltip bubble */}
      <div
        className={cn(
          "absolute z-50 px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white text-xs font-medium whitespace-nowrap shadow-lg pointer-events-none",
          SIDE_CLASSES[side] ?? SIDE_CLASSES.bottom
        )}
        role="tooltip"
      >
        {label}
        {/* Arrow */}
        <div
          className={cn(
            "absolute w-2 h-2 bg-[var(--accent)] rotate-45",
            side === "bottom" && "top-[-4px] left-1/2 -translate-x-1/2",
            side === "top" && "bottom-[-4px] left-1/2 -translate-x-1/2",
            side === "right" && "left-[-4px] top-1/2 -translate-y-1/2",
            side === "left" && "right-[-4px] top-1/2 -translate-y-1/2"
          )}
        />
      </div>
    </div>
  );
}
