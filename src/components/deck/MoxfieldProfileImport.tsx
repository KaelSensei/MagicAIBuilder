"use client";

import { useCallback, useState } from "react";
import type {
  MoxfieldUserDeckPage,
  MoxfieldUserDeckSummary,
} from "@/lib/import/moxfield-user";
import {
  MoxfieldDeckResults,
  SavedMoxfieldProfiles,
} from "./MoxfieldProfileResults";

const STORAGE_KEY = "magic-ai-builder:moxfield-profiles";
/** Number of Moxfield deck summaries requested per page. */
const MOXFIELD_PAGE_SIZE = 20;

interface MoxfieldProfileImportProps {
  readonly onDeckSelected: (url: string) => void;
}

function readSavedProfiles(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? "[]"
    );
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
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
  return (
    Array.isArray(decks) &&
    typeof total === "number" &&
    typeof hasMore === "boolean"
  );
}

/** Saved Moxfield usernames and a public-deck picker for the URL importer. */
export function MoxfieldProfileImport({
  onDeckSelected,
}: MoxfieldProfileImportProps) {
  const [username, setUsername] = useState("");
  const [profiles, setProfiles] = useState<string[]>(readSavedProfiles);
  const [decks, setDecks] = useState<readonly MoxfieldUserDeckSummary[]>([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
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

  const loadDecks = useCallback(
    async (profile: string, requestedPage: number) => {
      const normalized = profile.trim().replace(/^@/, "");
      if (!normalized) return;
      setUsername(normalized);
      setStatus("loading");
      setError(null);
      try {
        const response = await fetch("/api/import/moxfield-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: normalized,
            pageNumber: requestedPage,
          }),
        });
        const data: unknown = await response.json();
        if (!response.ok || !isDeckPage(data))
          throw new Error("Could not load Moxfield decks.");
        setDecks(data.decks);
        setPageNumber(requestedPage);
        setTotal(data.total);
        setHasMore(data.hasMore);
        setStatus("idle");
      } catch (cause) {
        setStatus("error");
        setError(
          cause instanceof Error
            ? cause.message
            : "Could not load Moxfield decks."
        );
      }
    },
    []
  );

  const loadFirstPage = useCallback(
    (profile: string) => {
      void loadDecks(profile, 1);
    },
    [loadDecks]
  );

  const removeProfile = useCallback((profileToRemove: string) => {
    setProfiles((currentProfiles) => {
      const nextProfiles = currentProfiles.filter(
        (profile) => profile !== profileToRemove
      );
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProfiles));
      return nextProfiles;
    });
  }, []);

  const firstResult = (pageNumber - 1) * MOXFIELD_PAGE_SIZE + 1;
  const lastResult = firstResult + decks.length - 1;
  const loadPreviousPage = useCallback(() => {
    void loadDecks(username, pageNumber - 1);
  }, [loadDecks, pageNumber, username]);
  const loadNextPage = useCallback(() => {
    void loadDecks(username, pageNumber + 1);
  }, [loadDecks, pageNumber, username]);

  return (
    <section className="flex flex-col gap-3 rounded border border-[var(--border)] p-3">
      <div>
        <h3 className="text-sm font-medium text-[var(--text-primary)]">
          Moxfield profiles
        </h3>
        <p className="text-xs text-[var(--text-secondary)]">
          Save a username to quickly import one of its public decks.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor="moxfield-username">
          Moxfield username
        </label>
        <input
          id="moxfield-username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="Moxfield username"
          className="min-w-0 flex-1 rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--text-primary)]"
        />
        <button
          type="button"
          onClick={saveProfile}
          disabled={!username.trim()}
          className="rounded border border-[var(--border)] px-3 py-2 text-xs text-[var(--text-secondary)] disabled:opacity-50"
        >
          Save profile
        </button>
        <button
          type="button"
          onClick={() => loadFirstPage(username)}
          disabled={!username.trim() || status === "loading"}
          className="rounded bg-[var(--accent)] px-3 py-2 text-xs text-white disabled:opacity-50"
        >
          {status === "loading" ? "Loading…" : "Load decks"}
        </button>
      </div>
      <SavedMoxfieldProfiles
        profiles={profiles}
        onLoad={loadFirstPage}
        onRemove={removeProfile}
      />
      {error && (
        <p role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}
      <MoxfieldDeckResults
        decks={decks}
        firstResult={firstResult}
        lastResult={lastResult}
        total={total}
        canLoadPrevious={pageNumber > 1 && status !== "loading"}
        canLoadNext={hasMore && status !== "loading"}
        onPrevious={loadPreviousPage}
        onNext={loadNextPage}
        onDeckSelected={onDeckSelected}
      />
    </section>
  );
}
