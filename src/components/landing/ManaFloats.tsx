/** Floating mana emoji particles drifting upward */

const MANA = [
  { symbol: "\u26AA", left: "5%",  duration: "18s", delay: "0s",  size: "2rem"   },
  { symbol: "\uD83D\uDD35", left: "15%", duration: "22s", delay: "3s",  size: "1.5rem" },
  { symbol: "\u26AB", left: "30%", duration: "16s", delay: "7s",  size: "1.2rem" },
  { symbol: "\uD83D\uDD34", left: "50%", duration: "20s", delay: "1s",  size: "1.5rem" },
  { symbol: "\uD83D\uDFE2", left: "65%", duration: "25s", delay: "5s",  size: "2.5rem" },
  { symbol: "\u2726", left: "80%", duration: "19s", delay: "9s",  size: "1.5rem" },
] as const;

export function ManaFloats() {
  return (
    <>
      {MANA.map((m) => (
        <div
          key={m.symbol}
          className="mana-float"
          aria-hidden="true"
          style={{
            left: m.left,
            animationDuration: m.duration,
            animationDelay: m.delay,
            fontSize: m.size,
          }}
        >
          {m.symbol}
        </div>
      ))}
    </>
  );
}
