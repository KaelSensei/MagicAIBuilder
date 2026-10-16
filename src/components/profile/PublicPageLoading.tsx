interface PublicPageLoadingProps {
  readonly label: string;
  readonly variant: "deck" | "profile";
}

/** Shared visual fallback for the two public, viewer-aware pages. */
export function PublicPageLoading({ label, variant }: PublicPageLoadingProps) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <div aria-hidden="true" className="h-16 border-b border-[var(--border)]">
        <div className="mx-auto flex h-full max-w-5xl items-center gap-6 px-4">
          <div className="h-5 w-36 rounded bg-[var(--surface)]" />
          <div className="hidden h-4 w-44 rounded bg-[var(--surface)] sm:block" />
        </div>
      </div>
      <main className="mx-auto w-full max-w-4xl px-4 py-8">
        <output aria-busy="true" className="sr-only">{label}</output>
        <div aria-hidden="true" className="motion-safe:animate-pulse">
          <div className={variant === "deck" ? "mb-8 flex flex-col gap-4 sm:flex-row" : "mb-8 flex items-center gap-4"}>
            <div className={variant === "deck"
              ? "h-28 w-full rounded-xl bg-[var(--surface)] sm:h-24 sm:w-40"
              : "h-16 w-16 shrink-0 rounded-full bg-[var(--surface)]"} />
            <div className="flex-1 space-y-3">
              <div className={variant === "deck"
                ? "h-7 w-64 max-w-full rounded bg-[var(--surface)]"
                : "h-6 w-48 max-w-full rounded bg-[var(--surface)]"} />
              <div className="h-4 w-44 rounded bg-[var(--surface)]" />
              {variant === "deck" && <div className="h-4 w-32 rounded bg-[var(--surface)]" />}
            </div>
          </div>
          <div className="mb-4 h-5 w-36 rounded bg-[var(--surface)]" />
          {variant === "deck" ? (
            <div className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
              {[0, 1, 2, 3].map((slot) => (
                <div key={slot} className="flex items-center gap-4">
                  <div className="h-4 w-6 rounded bg-[var(--border)]" />
                  <div className="h-4 w-1/2 rounded bg-[var(--border)]" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((slot) => (
                <div key={slot} className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                  <div className="h-24 bg-[var(--border)]/50" />
                  <div className="space-y-3 p-3">
                    <div className="h-4 w-3/4 rounded bg-[var(--border)]" />
                    <div className="h-3 w-1/2 rounded bg-[var(--border)]" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
