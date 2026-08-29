"use client";

import { useState } from "react";
import type { MoxfieldUserDeckPage, MoxfieldUserDeckSummary } from "@/lib/import/moxfield-user";

const STORAGE_KEY = "magic-ai-builder:moxfield-profiles";

interface MoxfieldProfileImportProps {
  readonly onDeckSelected: (url: string) => void;
}

function readSavedProfiles(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function isDeckPage(value: unknown): value is MoxfieldUserDeckPage {
  if (typeof value !== "object" || value === null) return false;
  const page = Object.entries(value);
  const decks = page.find(([key]) => key === "decks")?.[1];
  const total = page.find(([key]) => key === "total")?.[1];
  const hasMore = page.find(([key]) => key === "hasMore")?.[1];
  return Array.isArray(decks) && typeof total === "number" && typeof hasMore === "boolean";
}

/** Saved Moxfield usernames and a public-deck picker for the URL importer. */
export function MoxfieldProfileImport({ onDeckSelected }: MoxfieldProfileImportProps) {
  const [username, setUsername] = useState("");
  const [profiles, setProfiles] = useState<string[]>(readSavedProfiles);
  const [decks, setDecks] = useState<readonly MoxfieldUserDeckSummary[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const saveProfile = () => {
    const normalized = username.trim().replace(/^@/, "");
    if (!normalized || profiles.includes(normalized)) return;
    const next = [...profiles, normalized];
    setProfiles(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setUsername(normalized);
  };

  const removeProfile = (profile: string) => {
    const next = profiles.filter((savedProfile) => savedProfile !== profile);
    setProfiles(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    if (username === profile) {
      setUsername("");
      setDecks([]);
    }
  };
  const loadDecks = async (profile = username) => {
    const normalized = profile.trim().replace(/^@/, "");
    if (!normalized) return;
    setUsername(normalized);
    setStatus("loading");
    setError(null);
    try {
      const response = await fetch("/api/import/moxfield-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: normalized }),
      });
      const data: unknown = await response.json();
      if (!response.ok || !isDeckPage(data)) throw new Error("Could not load Moxfield decks.");
      setDecks(data.decks);
      setStatus("idle");
    } catch (cause) {
      setStatus("error");
      setError(cause instanceof Error ? cause.message : "Could not load Moxfield decks.");
    }
  };

  return (
    <section className="flex flex-col gap-3 rounded border border-[var(--border)] p-3">
      <div>
        <h3 className="text-sm font-medium text-[var(--text-primary)]">Moxfield profiles</h3>
        <p className="text-xs text-[var(--text-secondary)]">Save a username to quickly import one of its public decks.</p>
      </div>
      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor="moxfield-username">Moxfield username</label>
        <input
          id="moxfield-username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="Moxfield username"
          className="min-w-0 flex-1 rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--text-primary)]"
        />
        <button type="button" onClick={saveProfile} disabled={!username.trim()} className="rounded border border-[var(--border)] px-3 py-2 text-xs text-[var(--text-secondary)] disabled:opacity-50">Save profile</button>
        <button type="button" onClick={() => loadDecks()} disabled={!username.trim() || status === "loading"} className="rounded bg-[var(--accent)] px-3 py-2 text-xs text-white disabled:opacity-50">{status === "loading" ? "Loading…" : "Load decks"}</button>
      </div>
      {profiles.length > 0 && (
        <div className="flex flex-wrap gap-2" aria-label="Saved Moxfield profiles">
          {profiles.map((profile) => (
            <span key={profile} className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-2 py-1 text-xs text-[var(--text-secondary)]">
              <button type="button" onClick={() => loadDecks(profile)} className="hover:text-[var(--text-primary)]">@{profile}</button>
              <button type="button" aria-label={`Remove @${profile}`} onClick={() => removeProfile(profile)} className="text-[var(--text-secondary)] hover:text-red-400">×</button>
            </span>
          ))}
        </div>
      )}
      {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
      {decks.length > 0 && (
        <ul className="flex max-h-40 flex-col gap-1 overflow-y-auto">
          {decks.map((deck) => (
            <li key={deck.id} className="flex items-center justify-between gap-2 rounded bg-[var(--background)] px-2 py-1.5">
              <span className="min-w-0 truncate text-sm text-[var(--text-primary)]">{deck.name}</span>
              <button type="button" onClick={() => onDeckSelected(`https://moxfield.com/decks/${encodeURIComponent(deck.id)}`)} className="shrink-0 text-xs text-[var(--accent)] hover:underline">Import {deck.name}</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
