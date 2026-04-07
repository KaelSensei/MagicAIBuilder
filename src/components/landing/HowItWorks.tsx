/** How it works — 3 steps with connecting gradient line */

const STEPS = [
  { num: "I", title: "Choose Your Commander", text: "Pick any legendary creature. The AI instantly profiles the archetype, color identity, and top synergy packages for that commander." },
  { num: "II", title: "Build with AI Guidance", text: "Add cards naturally. Every addition is scored in real time. The AI flags weak links, suggests replacements, and keeps your curve in check." },
  { num: "III", title: "Export & Dominate", text: "One-click export to MTGO, Arena, or your LGS buylist. Your deck is bracket-rated and optimized before you even sleeve it up." },
] as const;

export function HowItWorks() {
  return (
    <section className="landing-how" id="how">
      <div className="how-inner">
        <div className="section-label">The Process</div>
        <h2 className="reveal">
          Three Steps to
          <br />
          Your Best Deck
        </h2>
        <p className="how-subtitle reveal">
          No tutorials. No friction. Just open it and build.
        </p>
        <div className="steps reveal">
          {STEPS.map((s) => (
            <div key={s.num} className="step">
              <div className="step-number">{s.num}</div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
