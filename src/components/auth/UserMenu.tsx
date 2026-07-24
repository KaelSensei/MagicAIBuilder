"use client";

import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { BookOpen, LogIn, LogOut, User } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useOnboardingContext } from "@/components/onboarding/OnboardingProvider";

export function UserMenu() {
  const t = useTranslations("auth");
  const { data: session, status } = useSession();
  const { resetOnboarding } = useOnboardingContext();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => setOpen(false), []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        handleClose();
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, handleClose]);

  if (status === "loading") {
    return (
      <div className="w-8 h-8 rounded-full bg-[var(--surface-hover)] animate-pulse" />
    );
  }

  if (!session?.user) {
    return (
      <Link
        href="/auth/signin"
        className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-1.5 rounded border border-[var(--border)] hover:border-[var(--accent)] transition-colors"
      >
        <LogIn className="w-3.5 h-3.5" />
        {t("userMenu.signIn")}
      </Link>
    );
  }

  const initials = session.user.name
    ? session.user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : (session.user.email?.charAt(0).toUpperCase() ?? "?");

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full hover:ring-2 hover:ring-[var(--accent)] transition-all"
        aria-label={t("userMenu.menuLabel")}
      >
        {session.user.image ? (
          <Image
            src={session.user.image}
            alt={session.user.name ?? "Avatar"}
            width={32}
            height={32}
            className="rounded-full object-cover"
            referrerPolicy="no-referrer"
            unoptimized
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-xs font-semibold">
            {initials}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-56 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg py-1">
          <div className="px-4 py-2 border-b border-[var(--border)]">
            <p className="text-sm font-medium text-[var(--text-primary)] truncate">
              {session.user.name}
            </p>
            <p className="text-xs text-[var(--text-secondary)] truncate">
              {session.user.email}
            </p>
          </div>

          <Link
            href="/profile"
            onClick={handleClose}
            className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            <User className="w-4 h-4" />
            {t("userMenu.profile")}
          </Link>

          <button
            type="button"
            onClick={async () => {
              handleClose();
              await resetOnboarding();
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            {t("userMenu.replayTutorial")}
          </button>

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-[var(--surface-hover)] transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {t("userMenu.signOut")}
          </button>
        </div>
      )}
    </div>
  );
}
