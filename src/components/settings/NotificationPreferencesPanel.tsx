"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

type NotificationPreferenceKey = "replies" | "mentions" | "follows" | "watchedDecks";

interface NotificationPreferences {
  readonly replies: boolean;
  readonly mentions: boolean;
  readonly follows: boolean;
  readonly watchedDecks: boolean;
}

const PREFERENCE_KEYS: readonly NotificationPreferenceKey[] = [
  "replies",
  "mentions",
  "follows",
  "watchedDecks",
];

function isNotificationPreferences(value: unknown): value is NotificationPreferences {
  if (typeof value !== "object" || value === null) return false;
  return PREFERENCE_KEYS.every((key) => typeof Reflect.get(value, key) === "boolean");
}

/** Lets a player control which future community events may notify them. */
export function NotificationPreferencesPanel() {
  const t = useTranslations("settings.notifications");
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState<NotificationPreferenceKey | null>(null);

  const loadPreferences = useCallback(async () => {
    setError(false);
    try {
      const response = await fetch("/api/user/notification-preferences");
      const payload: unknown = await response.json();
      if (!response.ok || !isNotificationPreferences(payload)) throw new Error("Invalid preferences response");
      setPreferences(payload);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    void loadPreferences();
  }, [loadPreferences]);

  const updatePreference = useCallback(
    async (key: NotificationPreferenceKey) => {
      if (!preferences || saving) return;
      const nextValue = !preferences[key];
      setSaving(key);
      setError(false);
      try {
        const response = await fetch("/api/user/notification-preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [key]: nextValue }),
        });
        if (!response.ok) throw new Error("Could not save notification preference");
        setPreferences((current) => (current ? { ...current, [key]: nextValue } : current));
      } catch {
        setError(true);
      } finally {
        setSaving(null);
      }
    },
    [preferences, saving]
  );

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto p-6">
      <section className="space-y-5 rounded-lg border border-[var(--border)] p-5">
        <header className="space-y-1">
          <h1 className="flex items-center gap-2 text-xl font-semibold text-[var(--text-primary)]">
            <Bell className="h-5 w-5 text-[var(--accent-text)]" aria-hidden="true" />
            {t("title")}
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">{t("intro")}</p>
        </header>

        {preferences === null && !error ? (
          <p className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            {t("loading")}
          </p>
        ) : (
          <div className="space-y-3">
            {PREFERENCE_KEYS.map((key) => (
              <label key={key} className="flex items-start gap-3 rounded-md border border-[var(--border)] p-3">
                <input
                  type="checkbox"
                  checked={preferences?.[key] ?? false}
                  disabled={preferences === null || saving !== null}
                  onChange={() => void updatePreference(key)}
                  aria-label={t(`${key}.label`)}
                  className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
                />
                <span>
                  <span className="block text-sm font-medium text-[var(--text-primary)]">{t(`${key}.label`)}</span>
                  <span className="block text-xs text-[var(--text-secondary)]">{t(`${key}.description`)}</span>
                </span>
              </label>
            ))}
          </div>
        )}

        {error && (
          <div role="alert" className="flex items-center justify-between gap-3 text-sm text-red-400">
            <span>{t("error")}</span>
            <button type="button" onClick={() => void loadPreferences()} className="font-semibold hover:underline">
              {t("retry")}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
