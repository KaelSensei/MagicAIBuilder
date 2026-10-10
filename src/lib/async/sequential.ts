/** Run dependent operations in input order, stopping when an operation rejects. */
export function forEachSequential<T>(
  items: readonly T[],
  operation: (item: T) => Promise<unknown>
): Promise<void> {
  return items.reduce<Promise<void>>(
    (previous, item) => previous.then(async () => { await operation(item); }),
    Promise.resolve()
  );
}
