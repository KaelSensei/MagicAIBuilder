/**
 * The binomial coefficient behind every exact hand-odds figure in deck analysis.
 *
 * Deck analysis counts equally likely hands rather than simulating games; the
 * number of hands of a given size is a binomial coefficient. Turn-one
 * playability and draw odds both build on this one function.
 *
 * @module deck/binomial
 */

/**
 * Number of ways to choose `k` items from `n`.
 *
 * Multiplied and divided in alternation so the running value stays small; the
 * factorials themselves would overflow a double long before a 100-card deck.
 *
 * @param n - size of the set
 * @param k - size of the selection
 * @returns the count, or 0 when the selection cannot be made
 */
export function binomial(n: number, k: number): number {
  if (k < 0 || n < 0 || k > n) return 0;

  const smaller = Math.min(k, n - k);
  let result = 1;
  for (let i = 0; i < smaller; i += 1) {
    result = (result * (n - i)) / (i + 1);
  }
  return result;
}
