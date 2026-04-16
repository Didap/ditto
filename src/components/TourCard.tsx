"use client";

import type { CardComponentProps } from "onborda";
import { useOnborda } from "onborda";
import { markTourSeen } from "@/lib/onboarding";

export function TourCard({
  step,
  currentStep,
  totalSteps,
  nextStep,
  prevStep,
  arrow,
}: CardComponentProps) {
  const { closeOnborda, currentTour } = useOnborda();

  const handleClose = () => {
    if (currentTour) markTourSeen(currentTour);
    closeOnborda();
  };

  const handleNext = () => {
    if (currentStep === totalSteps - 1) {
      // Last step — mark done
      if (currentTour) markTourSeen(currentTour);
      closeOnborda();
    } else {
      nextStep();
    }
  };

  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;

  return (
    <div
      className="relative w-80 rounded-xl shadow-2xl"
      style={{
        backgroundColor: "var(--ditto-surface)",
        border: "1px solid var(--ditto-border)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 pt-4 pb-2"
      >
        <div className="flex items-center gap-2">
          {step.icon && <span className="text-lg">{step.icon}</span>}
          <h3 className="text-sm font-semibold" style={{ color: "var(--ditto-text)" }}>
            {step.title}
          </h3>
        </div>
        <button
          onClick={handleClose}
          className="w-6 h-6 flex items-center justify-center rounded-full text-xs hover:opacity-70 transition-opacity"
          style={{ color: "var(--ditto-text-muted)" }}
          aria-label="Close tour"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="px-5 pb-4">
        <p
          className="text-xs leading-relaxed mb-4"
          style={{ color: "var(--ditto-text-muted)" }}
        >
          {step.content}
        </p>

        {/* Footer: step counter + nav */}
        <div className="flex items-center justify-between">
          <span
            className="text-[10px] font-medium"
            style={{ color: "var(--ditto-text-muted)" }}
          >
            {currentStep + 1} / {totalSteps}
          </span>

          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                onClick={prevStep}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{
                  color: "var(--ditto-text-secondary)",
                  border: "1px solid var(--ditto-border)",
                }}
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                backgroundColor: "var(--ditto-primary)",
                color: "var(--ditto-bg)",
              }}
            >
              {isLast ? "Got it!" : "Next"}
            </button>
          </div>
        </div>
      </div>

      {/* Arrow (positioned by Onborda) */}
      {arrow}
    </div>
  );
}
