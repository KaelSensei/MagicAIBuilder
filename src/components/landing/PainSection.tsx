/** Pain section — 4 problem cards that resonate with MTG players */

const PAINS = [
  { icon: "\u231B", title: "Hours Down the Drain", text: "You open 20 Scryfall tabs, scroll Moxfield for an hour, and still aren\u2019t sure if the deck works." },
  { icon: "\uD83C\uDFB2", title: "Blind Synergy Testing", text: "You only find out your combo doesn\u2019t work at the table. In front of three opponents." },
  { icon: "\uD83D\uDCB8", title: "Expensive Mistakes", text: "You buy the cards, build the deck, and a week later realize you built the wrong gameplan." },
  { icon: "\uD83D\uDCC9", title: "Broken Mana Curves", text: "No tool tells you your curve is top-heavy until you\u2019re stuck on 3 lands on turn 6." },
] as const;

export function PainSection() {
  return (
    <section className="landing-pain">
      <div className="pain-inner">
        <div className="section-label">The Problem</div>
        <h2>
          Deckbuilding is <em>broken.</em>
          <br />
          And you know it.
        </h2>
        <ul className="pain-list reveal">
          {PAINS.map((p) => (
            <li key={p.title} className="pain-item">
              <div className="pain-icon">{p.icon}</div>
              <h3>{p.title}</h3>
              <p>{p.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
