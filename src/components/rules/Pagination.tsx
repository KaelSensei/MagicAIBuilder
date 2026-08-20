"use client";
// Generic pagination controls: Prev / Next + "Page X / Y" indicator
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/components/ui/utils";

interface PaginationProps {
  readonly currentPage: number;
  readonly totalPages: number;
  readonly onPageChange: (page: number) => void;
  readonly className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  const t = useTranslations("common");
  const isFirst = currentPage === 1;
  const isLast = currentPage === totalPages;

  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label={t("pagination.label")}
      className={cn("flex items-center justify-center gap-4", className)}
    >
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={isFirst}
        aria-label={t("pagination.previous")}
        className={cn(
          "flex items-center gap-1 px-3 py-1.5 rounded border text-sm transition-colors",
          isFirst
            ? "border-[var(--border)] text-[var(--text-secondary)] opacity-40 cursor-not-allowed"
            : "border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
        )}
      >
        <ChevronLeft className="w-4 h-4" />
        Previous
      </button>

      <span
        aria-current="page"
        className="text-sm text-[var(--text-secondary)] tabular-nums"
      >
        Page{" "}
        <span className="font-semibold text-[var(--text-primary)]">
          {currentPage}
        </span>{" "}
        /{" "}
        <span className="font-semibold text-[var(--text-primary)]">
          {totalPages}
        </span>
      </span>

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={isLast}
        aria-label={t("pagination.next")}
        className={cn(
          "flex items-center gap-1 px-3 py-1.5 rounded border text-sm transition-colors",
          isLast
            ? "border-[var(--border)] text-[var(--text-secondary)] opacity-40 cursor-not-allowed"
            : "border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
        )}
      >
        Next
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}
