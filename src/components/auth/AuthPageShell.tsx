"use client";

import { Link } from "@/i18n/navigation";
import { Layers } from "lucide-react";

interface AuthPageShellProps {
  readonly subtitle: string;
  readonly error?: string;
  readonly children: React.ReactNode;
}

/**
 * Shared shell for auth pages (sign-in / sign-up).
 * Renders the centered layout, logo, optional error banner and slot for form content.
 * The error banner is an alert (`role="alert"`), announced as soon as it appears.
 */
export function AuthPageShell({ subtitle, error, children }: AuthPageShellProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Layers className="w-8 h-8 text-[var(--accent-text)]" />
            <span className="font-bold text-xl text-[var(--text-primary)]">
              MagicAIBuilder
            </span>
          </Link>
          <p className="text-sm text-[var(--text-secondary)]">{subtitle}</p>
        </div>

        {/* Error banner. An alert, so a screen reader says a failed sign-in
            or sign-up without the player moving focus (WCAG 4.1.3). The form
            clears the error before each submit, so a repeated failure mounts
            the banner again and is announced again. */}
        {error && (
          <div
            role="alert"
            className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-2 rounded-lg"
          >
            {error}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
