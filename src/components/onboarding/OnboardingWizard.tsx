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
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, X, Layers, Search, BarChart3, Sparkles } from "lucide-react";
import { cn } from "@/components/ui/utils";

interface OnboardingWizardProps {
  readonly onComplete: () => void;
  readonly onSkip: () => void;
}

interface Step {
  readonly icon: React.ReactNode;
  readonly title: string;
  readonly description: string;
  readonly hint?: string;
}

const STEPS: Step[] = [
  {
    icon: <Layers className="w-8 h-8 text-[var(--accent)]" />,
    title: "Welcome to MagicAIBuilder ✨",
    description:
      "Build Commander decks with live bracket scoring, AI suggestions, and Scryfall integration. Let's walk you through the basics in 4 quick steps.",
    hint: undefined,
  },
  {
    icon: <Sparkles className="w-8 h-8 text-purple-400" />,
    title: "Create your first deck",
    description:
      'Click "New Deck" in the top-right corner of any page. Give it a name, choose your format, and set a target bracket.',
    hint: "💡 Tip: You can also use the AI Wizard to build a full deck from scratch in seconds.",
  },
  {
    icon: <Search className="w-8 h-8 text-blue-400" />,
    title: "Search & add cards",
    description:
      "Use the left search panel to find any MTG card. Click a result to add it to your deck. The first card you add as Commander will set your color identity.",
    hint: "💡 Tip: Filter by color, type, or CMC to narrow results quickly.",
  },
  {
    icon: <BarChart3 className="w-8 h-8 text-amber-400" />,
    title: "Track stats & bracket",
    description:
      "The right panel shows your live bracket score, game changers, mana curve, and AI suggestions. Keep an eye on the bracket indicator to stay in your pod's range.",
    hint: "💡 Tip: Hover over the bracket badge to see which cards are pushing your score up.",
  },
];

export function OnboardingWizard({ onComplete, onSkip }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back

  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

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
            aria-label="Skip tutorial"
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
                    {current.title}
                  </Dialog.Title>
                  <p id="onboarding-description" className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {current.description}
                  </p>
                </div>

                {current.hint && (
                  <p className="text-xs text-[var(--text-secondary)] bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2 w-full text-left">
                    {current.hint}
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-8 pb-6 flex items-center justify-between gap-4">
            {/* Step dots */}
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
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
                  Back
                </button>
              )}
              <button
                onClick={goNext}
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg transition-colors font-medium"
              >
                {isLast ? "Get started" : "Next"}
                {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
