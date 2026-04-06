"use client";
/**
 * StaticLandingPage — 2D fallback matching the dark fantasy aesthetic.
 * For prefers-reduced-motion, mobile, or old hardware.
 */
import Link from "next/link";

export function StaticLandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#050505] relative overflow-hidden">
      {/* Background ember glows */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-900/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/3 translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-red-900/6 rounded-full blur-3xl" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-orange-800/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6">
        <h1 className="text-4xl md:text-6xl font-bold text-amber-100/80 mb-3 tracking-[0.08em] font-serif">
          MagicAIBuilder
        </h1>
        <p className="text-sm md:text-base text-amber-200/30 mb-12 max-w-md mx-auto tracking-wide font-serif italic">
          Forge your Commander decks with arcane intelligence
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/auth/signin"
            className="px-8 py-3 rounded border border-red-800/60 bg-red-950/30 hover:bg-red-900/40 text-red-300/90 font-serif tracking-wider transition-colors text-center uppercase text-sm"
          >
            Architect
          </Link>
          <Link
            href="/auth/signup"
            className="px-8 py-3 rounded border border-amber-800/40 bg-amber-950/20 hover:bg-amber-900/30 text-amber-300/70 font-serif tracking-wider transition-colors text-center uppercase text-sm"
          >
            Recruit
          </Link>
        </div>
      </div>

      {/* Bottom attribution */}
      <p className="absolute bottom-6 text-xs text-amber-900/25 tracking-[0.3em] uppercase font-serif">
        MagicAIBuilder
      </p>
    </div>
  );
}
