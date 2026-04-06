"use client";
/**
 * StaticLandingPage — 2D fallback for prefers-reduced-motion, mobile, or old hardware.
 * Same dark theme and design language as the 3D scene, without Three.js.
 */
import Link from "next/link";

export function StaticLandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/3 translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-600/10 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6">
        <h1 className="text-4xl md:text-6xl font-bold text-white/90 mb-4 tracking-tight">
          MagicAIBuilder
        </h1>
        <p className="text-lg text-white/50 mb-12 max-w-md mx-auto">
          Build Commander decks with AI-powered suggestions, live bracket scoring, and combo detection.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/auth/signin"
            className="px-8 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors text-center"
          >
            Sign In
          </Link>
          <Link
            href="/auth/signup"
            className="px-8 py-3 rounded-lg border border-green-500/50 text-green-400 hover:bg-green-500/10 font-medium transition-colors text-center"
          >
            Sign Up
          </Link>
        </div>
      </div>

      {/* Bottom attribution */}
      <p className="absolute bottom-6 text-xs text-white/20">MagicAIBuilder</p>
    </div>
  );
}
