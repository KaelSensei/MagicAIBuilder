/**
 * Mana cost parsing utilities.
 *
 * Parses Scryfall mana cost strings like "{2}{W/U}{B}" into typed tokens,
 * handling:
 *  - Simple pips: {W}, {U}, {B}, {R}, {G}, {C}
 *  - Generic: {1}, {2}, …, {X}
 *  - Hybrid bicolor: {W/U}, {B/R}, …
 *  - Hybrid generic/color: {2/W}, {2/U}, …
 *  - Phyrexian: {W/P}, {U/P}, … (rendered, not used for identity)
 *  - Snow: {S}
 */

export type ManaColor = "W" | "U" | "B" | "R" | "G" | "C" | "S";

export type ManaToken =
  | { kind: "generic"; value: string }   // {X}, {0}, {1}, …, {20}
  | { kind: "color"; color: ManaColor }  // {W}, {U}, …
  | { kind: "hybrid"; left: string; right: string }  // {W/U}, {2/W}, {W/P}
  | { kind: "unknown"; raw: string };    // fallback

const COLORS = new Set<string>(["W", "U", "B", "R", "G", "C", "S"]);

/** Parse a single mana symbol (without braces) into a typed token */
export function parseSingleSymbol(sym: string): ManaToken {
  // Hybrid: contains "/"
  if (sym.includes("/")) {
    const [left, right] = sym.split("/");
    return { kind: "hybrid", left, right };
  }

  // Simple color
  if (COLORS.has(sym.toUpperCase())) {
    return { kind: "color", color: sym.toUpperCase() as ManaColor };
  }

  // Generic numeric or X/Y/Z variable
  if (/^[0-9]+$/.test(sym) || /^[XYZ]$/i.test(sym)) {
    return { kind: "generic", value: sym.toUpperCase() };
  }

  return { kind: "unknown", raw: sym };
}

/** Parse a full mana cost string like "{2}{W/U}{B}" into an array of tokens */
export function parseManaCost(manaCost: string): ManaToken[] {
  if (!manaCost) return [];
  const matches = manaCost.match(/\{[^}]+\}/g) ?? [];
  return matches.map((m) => parseSingleSymbol(m.slice(1, -1)));
}

/**
 * Extract color pips from a mana cost string for color-distribution stats.
 *
 * Returns a Record<string, number> with fractional values for hybrids:
 *   {W/U} → { W: 0.5, U: 0.5 }
 *   {2/W} → { W: 1 }   (generic side doesn't count as a color)
 *   {W/P} → { W: 1 }   (phyrexian — counts as color)
 *   {W}   → { W: 1 }
 */
export function extractColorPips(manaCost: string): Record<string, number> {
  const tokens = parseManaCost(manaCost);
  const result: Record<string, number> = {};

  for (const token of tokens) {
    if (token.kind === "color") {
      if (token.color !== "C" && token.color !== "S") {
        result[token.color] = (result[token.color] ?? 0) + 1;
      }
    } else if (token.kind === "hybrid") {
      const { left, right } = token;
      const leftIsColor = COLORS.has(left.toUpperCase()) && left !== "C";
      const rightIsColor = COLORS.has(right.toUpperCase()) && right !== "P" && right !== "C";

      if (leftIsColor && rightIsColor) {
        // Bicolor hybrid: {W/U} → 0.5 each
        result[left.toUpperCase()] = (result[left.toUpperCase()] ?? 0) + 0.5;
        result[right.toUpperCase()] = (result[right.toUpperCase()] ?? 0) + 0.5;
      } else if (leftIsColor) {
        // {P/W} or unusual — color side counts as 1
        result[left.toUpperCase()] = (result[left.toUpperCase()] ?? 0) + 1;
      } else if (rightIsColor) {
        // {2/W} or {P/W} — color side counts as 1
        result[right.toUpperCase()] = (result[right.toUpperCase()] ?? 0) + 1;
      }
      // {2/3} or fully generic hybrid — no color pips
    }
    // generic, unknown: no color pips
  }

  return result;
}
