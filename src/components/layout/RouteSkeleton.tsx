interface RouteSkeletonProps {
  readonly label: string;
}

/**
 * Stable editor-shaped placeholder used while a deck route is loading.
 *
 * @param props - Accessible loading label
 * @returns The editor skeleton
 */
export function EditorRouteSkeleton({ label }: RouteSkeletonProps) {
  return (
    <main className="min-h-screen bg-[var(--background)] p-4 text-[var(--text-primary)] sm:p-6">
      <output aria-busy="true" className="sr-only">{label}</output>
      <div
        aria-hidden="true"
        className="mx-auto grid max-w-[1800px] gap-4 motion-safe:animate-pulse lg:grid-cols-[minmax(15rem,1fr)_minmax(26rem,2fr)_minmax(15rem,1fr)]"
      >
        <div className="h-96 rounded-[var(--lumen-radius-xl)] border border-[var(--border)] bg-[var(--surface)]" />
        <div className="space-y-4 rounded-[var(--lumen-radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="h-8 w-1/3 rounded bg-[var(--border)]/60" />
          {[0, 1, 2, 3, 4].map((slot) => (
            <div key={slot} className="h-14 rounded bg-[var(--border)]/60" />
          ))}
        </div>
        <div className="h-72 rounded-[var(--lumen-radius-xl)] border border-[var(--border)] bg-[var(--surface)]" />
      </div>
    </main>
  );
}

/**
 * One deck-library card placeholder with the same height as a loaded card.
 *
 * @returns A fixed-height skeleton card
 */
export function LibraryCardSkeleton() {
  return (
    <div data-testid="library-card-skeleton" className="h-48 animate-pulse rounded-[var(--lumen-radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--lumen-shadow-sm)]">
      <div className="mb-3 h-4 w-2/3 rounded bg-[var(--border)]" />
      <div className="mt-2 h-3 w-1/2 rounded bg-[var(--border)]" />
      <div className="mt-2 h-3 w-1/3 rounded bg-[var(--border)]" />
    </div>
  );
}

/**
 * Library route placeholder. Card slots match {@link LibraryCardSkeleton}.
 *
 * @param props - Accessible loading label
 * @returns The library skeleton
 */
export function LibraryRouteSkeleton({ label }: RouteSkeletonProps) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <div aria-hidden="true" className="h-16 border-b border-[var(--border)] bg-[var(--surface)]" />
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <output aria-busy="true" className="sr-only">{label}</output>
        <div aria-hidden="true" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((slot) => (
            <LibraryCardSkeleton key={slot} />
          ))}
        </div>
      </main>
    </div>
  );
}
