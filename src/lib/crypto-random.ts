/**
 * Strong randomness via Web Crypto (`crypto.getRandomValues`).
 * Use for client-generated IDs and shuffles so values are not predictable (Sonar S2245 / pseudorandom hotspots).
 */

function getWebCrypto(): Crypto {
  const c = globalThis.crypto;
  if (c?.getRandomValues === undefined) {
    throw new Error("Web Crypto API is required: globalThis.crypto.getRandomValues");
  }
  return c;
}

/** Size of the Uint32 space used for rejection sampling. */
const UINT32_RANGE = 2 ** 32;

/**
 * Uniform integer in `[0, upperExclusive)` without modulo bias.
 *
 * @param upperExclusive Must be a positive integer (e.g. Fisher–Yates `i + 1`).
 * @returns Integer `j` with `0 <= j < upperExclusive`.
 */
export function randomIntBelow(upperExclusive: number): number {
  if (!Number.isInteger(upperExclusive) || upperExclusive <= 0) {
    throw new RangeError("randomIntBelow: upperExclusive must be a positive integer");
  }

  const crypto = getWebCrypto();
  const limit = Math.floor(UINT32_RANGE / upperExclusive) * upperExclusive;
  const buf = new Uint32Array(1);

  let n: number;
  do {
    crypto.getRandomValues(buf);
    const word = buf[0];
    if (word === undefined) {
      throw new Error("randomIntBelow: getRandomValues failed");
    }
    n = word;
  } while (n >= limit);

  return n % upperExclusive;
}

const ID_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";

/**
 * Largest multiple of the charset size that fits in a byte.
 *
 * 256 is not a multiple of 36, so mapping a raw byte with `% 36` deals the
 * first four characters 8 of the 256 values and the rest 7 — the same modulo
 * bias `randomIntBelow` rejection-samples away. Bytes at or above this bound
 * are discarded rather than folded.
 */
const ID_BYTE_LIMIT = Math.floor(256 / ID_CHARS.length) * ID_CHARS.length;

/**
 * Random lowercase alphanumeric string, for non-guessable URL-style segments (`tmpl-…`, `deck-…`).
 *
 * @param length Number of characters (1..256).
 */
export function randomAlphanumericId(length: number): string {
  if (!Number.isInteger(length) || length <= 0 || length > 256) {
    throw new RangeError("randomAlphanumericId: length must be an integer from 1 to 256");
  }

  const crypto = getWebCrypto();
  const base = ID_CHARS.length;

  let out = "";
  while (out.length < length) {
    // Refill for what is still missing. Roughly 1 byte in 64 is rejected, so
    // asking for exactly the shortfall converges immediately in practice.
    const bytes = new Uint8Array(length - out.length);
    crypto.getRandomValues(bytes);

    for (const b of bytes) {
      if (b >= ID_BYTE_LIMIT) continue;
      out += ID_CHARS.charAt(b % base);
    }
  }
  return out;
}
