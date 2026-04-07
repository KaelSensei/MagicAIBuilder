/** Stats section — 3 key metrics */

const STATS = [
  { number: "3x", label: "Faster deck building" },
  { number: "50K+", label: "Cards in database" },
  { number: "98%", label: "Synergy accuracy" },
] as const;

export function StatsSection() {
  return (
    <section className="landing-stats">
      <div className="stats-grid reveal">
        {STATS.map((s) => (
          <div key={s.label} className="stat-item">
            <div className="stat-number">{s.number}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
