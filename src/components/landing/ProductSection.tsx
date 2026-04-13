"use client";

import { useTranslations } from "next-intl";
import { useTypewriter } from "@/hooks/useTypewriter";

const HEADING_TAGS = {
  br: () => <br />,
  span: (chunks: React.ReactNode) => <span>{chunks}</span>,
};

const AI_CARD_TAGS = {
  strong: (chunks: React.ReactNode) => <strong style={{ color: "#00e5ff" }}>{chunks}</strong>,
};

/** Product section -- feature list + AI chat mockup */
export function ProductSection() {
  const t = useTranslations("landing");
  const aiText = useTypewriter();

  const features = [
    t("product.feature1"),
    t("product.feature2"),
    t("product.feature3"),
    t("product.feature4"),
    t("product.feature5"),
    t("product.feature6"),
  ];

  return (
    <section className="landing-product" id="product">
      <div className="product-inner">
        <div className="product-text reveal">
          <div className="section-label">{t("product.sectionLabel")}</div>
          <h2>
            {t.rich("product.heading", HEADING_TAGS)}
          </h2>
          <p>{t("product.description")}</p>
          <ul className="feature-list">
            {features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>

        <div className="deck-ui reveal">
          <div className="deck-ui-header">
            <div className="dot dot-r" />
            <div className="dot dot-y" />
            <div className="dot dot-g" />
            <span className="deck-ui-title">{t("product.mockupTitle")}</span>
          </div>
          <div className="deck-ui-body">
            {/* Typewriter prompt */}
            <div className="ai-prompt-bar">
              {aiText}
              <span className="ai-cursor" />
            </div>

            {/* Player question */}
            <div className="chat-bubble chat-user">
              {t("product.userPrompt")}
            </div>

            {/* AI response */}
            <div className="chat-bubble chat-ai">
              <span className="ai-badge">AI</span>
              <div className="chat-ai-content">
                <p>{t("product.aiResponse")}</p>
                <ol className="chat-ai-list">
                  {([1, 2, 3, 4, 5] as const).map((n) => (
                    <li key={n}>
                      {t.rich(`product.aiCard${n}`, AI_CARD_TAGS)}
                    </li>
                  ))}
                </ol>
                <p style={{ marginTop: "0.5rem", fontSize: "0.7rem", color: "#6b6890" }}>
                  {t("product.aiFootnote")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
