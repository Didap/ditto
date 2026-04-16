"use client";

import { OnbordaProvider, Onborda } from "onborda";
import { ALL_TOURS } from "@/lib/onboarding";
import { TourCard } from "@/components/TourCard";

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  return (
    <OnbordaProvider>
      <Onborda
        steps={ALL_TOURS}
        shadowRgb="0,0,0"
        shadowOpacity="0.7"
        cardComponent={TourCard}
        cardTransition={{ duration: 0.3, type: "tween" }}
      >
        {children}
      </Onborda>
    </OnbordaProvider>
  );
}
