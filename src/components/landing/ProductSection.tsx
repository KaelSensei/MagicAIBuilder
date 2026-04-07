"use client";

import { useTypewriter } from "@/hooks/useTypewriter";

const FEATURES = [
  "AI commander analysis \u2014 instant synergy scoring on every card you add",
  "Mana curve optimizer with bracket-aware power budgeting",
  'Real-time "What should I cut?" \u2014 context-aware removal suggestions',
  "Full format support: Commander, Standard, Pioneer, Modern, Legacy",
  "Import from Moxfield, Archidekt, MTGO, Arena \u2014 in one click",
  "Price tracker + budget alternatives with similar power level",
] as const;

/** Product section — feature list + AI chat mockup */
export function ProductSection() {
  const aiText = useTypewriter();

  return (
    <section className="landing-product" id="product">
      <div className="product-inner">
        <div className="product-text reveal">
          <div className="section-label">The Solution</div>
          <h2>
            Moxfield-level power.
            <br />
            <span>Gemini-level intelligence.</span>
          </h2>
          <p>
            MagicAIBuilder is the deck building tool you always wished existed &mdash;
            a full-featured deck manager where an AI co-pilot analyzes every card
            choice, flags synergy gaps, and suggests upgrades in real time.
          </p>
          <ul className="feature-list">
            {FEATURES.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>

        <div className="deck-ui reveal">
          <div className="deck-ui-header">
            <div className="dot dot-r" />
            <div className="dot dot-y" />
            <div className="dot dot-g" />
            <span className="deck-ui-title">MagicAIBuilder &mdash; Tinybones EDH</span>
          </div>
          <div className="deck-ui-body">
            {/* Typewriter prompt */}
            <div className="ai-prompt-bar">
              {aiText}
              <span className="ai-cursor" />
            </div>

            {/* Player question */}
            <div className="chat-bubble chat-user">
              I need 5 discard engines under $10 for Tinybones. What&apos;s good?
            </div>

            {/* AI response */}
            <div className="chat-bubble chat-ai">
              <span className="ai-badge">AI</span>
              <div className="chat-ai-content">
                <p>Here are 5 high-synergy discard engines for Tinybones, all under $10:</p>
                <ol className="chat-ai-list">
                  <li><strong style={{ color: "#00e5ff" }}>Burglar Rat</strong> &mdash; ETB discard, recurrable with your 4 reanimation spells (synergy: 94%)</li>
                  <li><strong style={{ color: "#00e5ff" }}>Liliana&apos;s Specter</strong> &mdash; flying + each opponent discards, great with your evasion package (92%)</li>
                  <li><strong style={{ color: "#00e5ff" }}>Oppression</strong> &mdash; symmetrical but you benefit more with 8 recursion pieces (97%)</li>
                  <li><strong style={{ color: "#00e5ff" }}>Bottomless Pit</strong> &mdash; repeatable, triggers Tinybones every upkeep (95%)</li>
                  <li><strong style={{ color: "#00e5ff" }}>Cunning Lethemancer</strong> &mdash; low cmc, consistent trigger, fuels your graveyard plan (91%)</li>
                </ol>
                <p style={{ marginTop: "0.5rem", fontSize: "0.7rem", color: "#6b6890" }}>
                  Adding all 5 would lower your avg CMC from 3.2 to 2.9 and increase discard density to optimal range.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
