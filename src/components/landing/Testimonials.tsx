/** Testimonials — 3 player review cards */

const REVIEWS = [
  {
    text: "I built a Bracket 4 Tinybones deck in 45 minutes. The AI caught three dead cards I would have never noticed until game night.",
    author: "Kael M.",
    role: "cEDH Player \u00B7 Paris",
  },
  {
    text: "Finally a tool that speaks Commander language. It knows what Bracket 3 means. It knows what \u2018goodstuff\u2019 means. It gets it.",
    author: "Romain V.",
    role: "LGS Regular \u00B7 Lyon",
  },
  {
    text: "The curve optimizer alone is worth the subscription. My decks have never been this consistent. I\u2019m not going back to Moxfield alone.",
    author: "Julien T.",
    role: "Competitive Player \u00B7 Bordeaux",
  },
] as const;

export function Testimonials() {
  return (
    <section className="landing-testimonials">
      <h2 className="reveal">What Players Are Saying</h2>
      <div className="testi-grid reveal">
        {REVIEWS.map((r) => (
          <div key={r.author} className="testi-card">
            <div className="testi-stars">{"\u2605\u2605\u2605\u2605\u2605"}</div>
            <p className="testi-text">&ldquo;{r.text}&rdquo;</p>
            <div className="testi-author">{r.author}</div>
            <div className="testi-role">{r.role}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
