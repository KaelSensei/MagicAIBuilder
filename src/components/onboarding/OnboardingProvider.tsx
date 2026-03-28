"use client";
/**
 * OnboardingProvider — wraps the app, shows the wizard on first-run.
 * Exposes `useOnboardingContext` so any component can read/reset onboarding state.
 */
import { createContext, useContext, useMemo } from "react";
import { useOnboarding } from "@/hooks/useOnboarding";
import { OnboardingWizard } from "./OnboardingWizard";

interface OnboardingContextValue {
  readonly resetOnboarding: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue>({
  resetOnboarding: async () => {},
});

export function useOnboardingContext(): OnboardingContextValue {
  return useContext(OnboardingContext);
}

interface OnboardingProviderProps {
  readonly children: React.ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const { showWizard, completeOnboarding, resetOnboarding } = useOnboarding();
  const contextValue = useMemo(() => ({ resetOnboarding }), [resetOnboarding]);

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
      {showWizard && (
        <OnboardingWizard
          onComplete={completeOnboarding}
          onSkip={completeOnboarding}
        />
      )}
    </OnboardingContext.Provider>
  );
}
