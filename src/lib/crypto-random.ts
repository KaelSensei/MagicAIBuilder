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
  const max = 0x1_0000_0000;
  const limit = Math.floor(max / upperExclusive) * upperExclusive;
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
 * Random lowercase alphanumeric string, for non-guessable URL-style segments (`tmpl-…`, `deck-…`).
 *
 * @param length Number of characters (1..256).
 */
export function randomAlphanumericId(length: number): string {
  if (!Number.isInteger(length) || length <= 0 || length > 256) {
    throw new RangeError("randomAlphanumericId: length must be an integer from 1 to 256");
  }

  const crypto = getWebCrypto();
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  let out = "";
  const base = ID_CHARS.length;
  for (let i = 0; i < length; i++) {
    const b = bytes[i];
    if (b === undefined) {
      throw new Error("randomAlphanumericId: unexpected buffer end");
    }
    out += ID_CHARS.charAt(b % base);
  }
  return out;
}
