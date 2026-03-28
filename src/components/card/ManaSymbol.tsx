"use client";
/**
 * ManaSymbol — renders a single mana token as a colored pill.
 *
 * Handles: simple pips {W}/{U}/…, generic {2}/{X},
 *          bicolor hybrid {W/U}, generic/color hybrid {2/W}, phyrexian {W/P}.
 *
 * No external dependency — uses CSS custom properties from globals.css.
 */
import { cn } from "@/components/ui/utils";
import type { ManaToken } from "@/lib/mana/parse";

// ─── Color config ─────────────────────────────────────────────────────────────

const COLOR_CLASSES: Record<string, string> = {
  W: "bg-yellow-100 text-yellow-900 border-yellow-300",
  U: "bg-blue-600 text-white border-blue-400",
  B: "bg-gray-900 text-gray-100 border-gray-600",
  R: "bg-red-600 text-white border-red-400",
  G: "bg-green-700 text-white border-green-500",
  C: "bg-gray-400 text-gray-900 border-gray-300",
  S: "bg-sky-200 text-sky-900 border-sky-300",
};

const COLOR_LABELS: Record<string, string> = {
  W: "W", U: "U", B: "B", R: "R", G: "G", C: "C", S: "S", P: "Φ",
};

const BASE = "inline-flex items-center justify-center rounded-full text-[9px] font-bold leading-none border w-4 h-4 shrink-0 select-none";

interface ManaSymbolProps {
  readonly token: ManaToken;
  readonly className?: string;
}

function GenericPip({ value, className }: { readonly value: string; readonly className?: string }) {
  return (
    <span className={cn(BASE, "bg-gray-600 text-white border-gray-500", className)}>
      {value}
    </span>
  );
}

function ColorPip({ color, className }: { readonly color: string; readonly className?: string }) {
  const cls = COLOR_CLASSES[color.toUpperCase()] ?? "bg-gray-500 text-white border-gray-400";
  return (
    <span
      className={cn(BASE, cls, className)}
      aria-label={`{${color}}`}
    >
      {COLOR_LABELS[color.toUpperCase()] ?? color}
    </span>
  );
}

function HybridPip({ left, right, className }: { readonly left: string; readonly right: string; readonly className?: string }) {
  // Split pill: left half + right half
  const leftCls = COLOR_CLASSES[left.toUpperCase()] ?? "bg-gray-600 text-white border-gray-500";
  const rightCls = COLOR_CLASSES[right.toUpperCase()] ?? "bg-gray-500 text-white border-gray-400";
  const label = `{${left}/${right}}`;

  // For generic/color hybrid {2/W}: show as color pip with small "2" prefix
  const leftIsNumeric = /^[0-9XYZ]$/i.test(left);
  if (leftIsNumeric) {
    return (
      <span
        className={cn(BASE, rightCls, "gap-px px-0.5 w-auto min-w-[1rem]", className)}
        aria-label={label}
      >
        <span className="opacity-70 text-[7px]">{left}/</span>
        {COLOR_LABELS[right.toUpperCase()] ?? right}
      </span>
    );
  }

  // Phyrexian {W/P}: color pip with Φ
  if (right === "P") {
    return (
      <span className={cn(BASE, leftCls, "gap-px px-0.5 w-auto min-w-[1rem]", className)} aria-label={label}>
        {COLOR_LABELS[left.toUpperCase()] ?? left}
        <span className="opacity-70 text-[7px]">Φ</span>
      </span>
    );
  }

  // Bicolor hybrid: split diagonally using a gradient-inspired two-tone pill
  return (
    <span
      className={cn(BASE, "overflow-hidden p-0 w-4 h-4", className)}
      aria-label={label}
      title={label}
    >
      <span className={cn("flex w-full h-full")}>
        <span className={cn("flex-1 flex items-center justify-center text-[8px] font-bold", leftCls.replace("border-", "").split(" ").filter(c => !c.startsWith("border")).join(" "))}>
          {COLOR_LABELS[left.toUpperCase()] ?? left}
        </span>
        <span className={cn("flex-1 flex items-center justify-center text-[8px] font-bold", rightCls.replace("border-", "").split(" ").filter(c => !c.startsWith("border")).join(" "))}>
          {COLOR_LABELS[right.toUpperCase()] ?? right}
        </span>
      </span>
    </span>
  );
}

export function ManaSymbol({ token, className }: ManaSymbolProps) {
  switch (token.kind) {
    case "generic":
      return <GenericPip value={token.value} className={className} />;
    case "color":
      return <ColorPip color={token.color} className={className} />;
    case "hybrid":
      return <HybridPip left={token.left} right={token.right} className={className} />;
    default:
      // Fallback: raw text
      return (
        <span className={cn("text-[9px] font-mono text-[var(--text-secondary)]", className)}>
          {"{"}
          {token.raw}
          {"}"}
        </span>
      );
  }
}

/**
 * ManaCostDisplay — renders a full mana cost string as a row of ManaSymbol pills.
 * Replaces the old ManaPips text-only fallback.
 */
import { parseManaCost } from "@/lib/mana/parse";

interface ManaCostDisplayProps {
  readonly manaCost: string;
  readonly className?: string;
}

export function ManaCostDisplay({ manaCost, className }: ManaCostDisplayProps) {
  const tokens = parseManaCost(manaCost);
  if (tokens.length === 0) return null;

  return (
    <span className={cn("inline-flex items-center gap-0.5 flex-wrap", className)} aria-label={manaCost}>
      {tokens.map((token, i) => (
        // Index key is safe here: tokens derive from a static manaCost string and are never reordered
        // eslint-disable-next-line react/no-array-index-key
        <ManaSymbol key={`${token.kind}-${i}`} token={token} />
      ))}
    </span>
  );
}
