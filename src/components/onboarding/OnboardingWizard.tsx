"use client";
/**
 * OnboardingWizard — 4-step first-run guide for new users.
 *
 * Steps:
 * 1. Welcome — what is MagicAIBuilder
 * 2. Create a deck — the "New Deck" button
 * 3. Add cards — the search panel
 * 4. Use the stats panel — bracket score & game changers
 */
import { useState } from "react";
import { useTranslations } from "next-intl";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, X, Layers, Search, BarChart3, Sparkles } from "lucide-react";
import { cn } from "@/components/ui/utils";

interface OnboardingWizardProps {
  readonly onComplete: () => void;
  readonly onSkip: () => void;
}

/** Step key used to look up icon and translation strings. */
type StepKey = "welcome" | "createDeck" | "searchCards" | "trackStats";

interface StepDef {
  readonly key: StepKey;
  readonly icon: React.ReactNode;
  readonly hasHint: boolean;
}

const STEP_DEFS: readonly StepDef[] = [
  { key: "welcome", icon: <Layers className="w-8 h-8 text-[var(--accent)]" />, hasHint: false },
  { key: "createDeck", icon: <Sparkles className="w-8 h-8 text-purple-400" />, hasHint: true },
  { key: "searchCards", icon: <Search className="w-8 h-8 text-blue-400" />, hasHint: true },
  { key: "trackStats", icon: <BarChart3 className="w-8 h-8 text-amber-400" />, hasHint: true },
];

export function OnboardingWizard({ onComplete, onSkip }: OnboardingWizardProps) {
  const t = useTranslations("onboarding");
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back

  const isFirst = step === 0;
  const isLast = step === STEP_DEFS.length - 1;
  const current = STEP_DEFS[step];

  const goNext = () => {
    if (isLast) { onComplete(); return; }
    setDirection(1);
    setStep((s) => s + 1);
  };

  const goPrev = () => {
    if (isFirst) return;
    setDirection(-1);
    setStep((s) => s - 1);
  };

  return (
    <Dialog.Root open onOpenChange={(v) => { if (!v) onSkip(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[480px] max-w-[92vw] bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden"
          aria-describedby="onboarding-description"
        >
          {/* Skip button */}
          <button
            onClick={onSkip}
            className="absolute top-4 right-4 p-1.5 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors z-10"
            aria-label={t("skipTutorial")}
          >
            <X className="w-4 h-4" />
          </button>

          {/* Step content */}
          <div className="p-8 min-h-[280px] flex flex-col">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step}
                initial={{ opacity: 0, x: direction * 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -40 }}
                transition={{ duration: 0.22 }}
                className="flex flex-col items-center text-center gap-4 flex-1"
              >
                <div className="w-16 h-16 rounded-2xl bg-[var(--background)] border border-[var(--border)] flex items-center justify-center shrink-0">
                  {current.icon}
                </div>

                <div className="space-y-2">
                  <Dialog.Title className="text-lg font-bold text-[var(--text-primary)]">
                    {t(`steps.${current.key}.title`)}
                  </Dialog.Title>
                  <p id="onboarding-description" className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {t(`steps.${current.key}.description`)}
                  </p>
                </div>

                {current.hasHint && (
                  <p className="text-xs text-[var(--text-secondary)] bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2 w-full text-left">
                    {t(`steps.${current.key}.hint`)}
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-8 pb-6 flex items-center justify-between gap-4">
            {/* Step dots */}
            <div className="flex items-center gap-1.5">
              {STEP_DEFS.map((s, i) => (
                <div
                  key={s.key}
                  className={cn(
                    "rounded-full transition-all duration-200",
                    i === step
                      ? "w-5 h-1.5 bg-[var(--accent)]"
                      : "w-1.5 h-1.5 bg-[var(--border)]"
                  )}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-2">
              {!isFirst && (
                <button
                  onClick={goPrev}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  {t("back")}
                </button>
              )}
              <button
                onClick={goNext}
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg transition-colors font-medium"
              >
                {isLast ? t("getStarted") : t("next")}
                {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
