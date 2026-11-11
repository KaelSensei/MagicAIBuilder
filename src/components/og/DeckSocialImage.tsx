import type { CSSProperties, ReactNode } from "react";
import type { DeckImage, ManaColor } from "@/lib/deck/social-image";

/**
 * Markup for the 1200×630 deck image, rendered to PNG by `next/og`.
 *
 * `next/og` lays this out with Satori, not a browser: styles are inline, every
 * element with more than one child needs `display: flex`, and only the bundled
 * regular Noto Sans face is available, so hierarchy comes from size and colour
 * rather than weight.
 */

const INK = {
  background: "#0a0a0f",
  text: "#e8e8ec",
  muted: "#9a9ab0",
  brand: "#818cf8",
} as const;

type PipColor = ManaColor | "C";

/** Fill and letter colour per pip; the letter keeps the colours legible without hue. */
const PIPS: Readonly<
  Record<PipColor, { readonly fill: string; readonly letter: string }>
> = {
  W: { fill: "#f8f6d8", letter: "#1a1a1a" },
  U: { fill: "#0e68ab", letter: "#ffffff" },
  B: { fill: "#2a2a30", letter: "#ffffff" },
  R: { fill: "#d3202a", letter: "#ffffff" },
  G: { fill: "#00733e", letter: "#ffffff" },
  C: { fill: "#9ca3af", letter: "#1a1a1a" },
};

const SINGLE_LINE: CSSProperties = {
  display: "block",
  overflow: "hidden",
  whiteSpace: "nowrap",
  textOverflow: "ellipsis",
};

/** Localised text the deck image prints around the stored data. */
export interface DeckSocialImageLabels {
  /** "by {author}", or null when the deck has no author. */
  readonly byAuthor: string | null;
  /** "{count} cards". */
  readonly cardCount: string;
}

/**
 * The image of one public deck.
 *
 * @param props.deck - stored data of a public deck, from `loadPublicDeckImage`
 * @param props.labels - localised text around that data
 */
export function DeckSocialImage({
  deck,
  labels,
}: {
  readonly deck: DeckImage;
  readonly labels: DeckSocialImageLabels;
}) {
  const pips: readonly PipColor[] =
    deck.colorIdentity.length > 0 ? deck.colorIdentity : ["C"];
  const footer = [labels.byAuthor, labels.cardCount]
    .filter((part): part is string => part !== null)
    .join("  ·  ");

  return (
    <Frame>
      <div style={{ ...SINGLE_LINE, fontSize: 28, color: INK.brand }}>
        MagicAIBuilder
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", gap: 12 }}>
          {pips.map((color) => (
            <Pip key={color} color={color} />
          ))}
        </div>
        <div
          style={{
            display: "block",
            lineClamp: 2,
            fontSize: 64,
            lineHeight: 1.15,
            color: INK.text,
          }}
        >
          {deck.name}
        </div>
        {deck.commanders.length > 0 && (
          <div style={{ ...SINGLE_LINE, fontSize: 32, color: INK.muted }}>
            {deck.commanders.join(" + ")}
          </div>
        )}
        <div style={{ ...SINGLE_LINE, fontSize: 28, color: INK.muted }}>
          {footer}
        </div>
      </div>
    </Frame>
  );
}

/**
 * The image served for a private, missing or malformed deck: the site's name
 * and nothing about any deck.
 *
 * @param props.tagline - localised description of the site
 */
export function SiteSocialImage({ tagline }: { readonly tagline: string }) {
  return (
    <Frame>
      <div style={{ display: "flex" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ fontSize: 80, color: INK.text }}>MagicAIBuilder</div>
        <div style={{ fontSize: 36, color: INK.muted }}>{tagline}</div>
      </div>
    </Frame>
  );
}

/** Background, accent bar and padding shared by both images. */
function Frame({ children }: { readonly children: ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "56px 64px 64px",
        backgroundColor: INK.background,
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 8,
          background: "linear-gradient(90deg, #6366f1, #818cf8)",
        }}
      />
      {children}
    </div>
  );
}

/** One colour of the deck's identity, lettered. */
function Pip({ color }: { readonly color: PipColor }) {
  const { fill, letter } = PIPS[color];
  return (
    <div
      style={{
        width: 48,
        height: 48,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 24,
        backgroundColor: fill,
        border: "2px solid rgba(255,255,255,0.25)",
        color: letter,
        fontSize: 26,
      }}
    >
      {color}
    </div>
  );
}
