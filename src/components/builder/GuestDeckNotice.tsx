"use client";

import { useEffect, useState } from "react";
import { UserPlus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const CHANNEL_NAME = "magic-ai-builder:guest-deck";

/** Explains browser-only storage and promotes account creation when another tab joins. */
export function GuestDeckNotice() {
  const t = useTranslations("builder.guest");
  const [anotherTabOpen, setAnotherTabOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!("BroadcastChannel" in window)) return;
    const channel = new BroadcastChannel(CHANNEL_NAME);
    const tabId = crypto.randomUUID();

    channel.onmessage = (event: MessageEvent<unknown>) => {
      if (
        typeof event.data !== "object" ||
        event.data === null ||
        !("type" in event.data)
      )
        return;
      if (event.data.type === "guest-tab:hello") {
        channel.postMessage({ type: "guest-tab:active", target: event.data });
      } else if (event.data.type === "guest-tab:active") {
        setAnotherTabOpen(true);
      }
    };
    channel.postMessage({ type: "guest-tab:hello", tabId });
    return () => channel.close();
  }, []);

  if (dismissed) return null;

  return (
    <aside className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-xs text-[var(--text-secondary)] md:px-4">
      <UserPlus
        className="h-4 w-4 shrink-0 text-[var(--accent)]"
        aria-hidden="true"
      />
      <p className="min-w-0 flex-1">
        <strong className="text-[var(--text-primary)]">
          {anotherTabOpen ? t("anotherTabTitle") : t("title")}
        </strong>{" "}
        {anotherTabOpen ? t("anotherTabDescription") : t("description")}
      </p>
      <Link
        href="/auth/signup?callbackUrl=/builder/guest"
        className="shrink-0 rounded-md bg-[var(--accent)] px-3 py-1.5 font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
      >
        {t("createAccount")}
      </Link>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
        aria-label={t("dismiss")}
      >
        <X className="h-4 w-4" />
      </button>
    </aside>
  );
}
