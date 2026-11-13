"use client";
/**
 * OnboardingProvider — wraps the app, shows the wizard on first-run.
 * Exposes `useOnboardingContext` so any component can read/reset onboarding state.
 *
 * The first-run wizard opens by itself only where `onboardingMayOpenUnasked`
 * allows it for the current page (never on a public page, I-39 requirement
 * 1.1); a replay opens it on any page. `usePathname` comes from
 * `next/navigation`, so the pathname may carry a locale prefix, which the page
 * rule strips.
 */
import { createContext, useContext, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useOnboarding } from "@/hooks/useOnboarding";
import { onboardingMayOpenUnasked } from "./onboarding-pages";
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
  const pathname = usePathname();
  const { showWizard, completeOnboarding, resetOnboarding } = useOnboarding({
    mayOpenUnasked: onboardingMayOpenUnasked(pathname),
  });
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
