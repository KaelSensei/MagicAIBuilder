"use client";
// App header with nav
import Link from "next/link";
import { Layers, Plus, Upload } from "lucide-react";

export function Header() {
  return (
    <header className="h-14 border-b border-[var(--border)] bg-[var(--surface)] flex items-center px-6 gap-6 shrink-0">
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-2 text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
      >
        <Layers className="w-5 h-5 text-[var(--accent)]" />
        <span className="font-semibold text-base">MagicAIBuilder</span>
      </Link>

      {/* Nav */}
      <nav className="flex items-center gap-4 ml-4">
        <Link
          href="/"
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          My Decks
        </Link>
      </nav>

      {/* Actions */}
      <div className="ml-auto flex items-center gap-2">
        <button className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-1.5 rounded border border-[var(--border)] hover:border-[var(--accent)] transition-colors">
          <Upload className="w-3.5 h-3.5" />
          Import
        </button>
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-3 py-1.5 rounded transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New Deck
        </Link>
      </div>
    </header>
  );
}
