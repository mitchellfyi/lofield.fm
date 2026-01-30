"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { TUTORIAL_STEPS, type TutorialStep, markTutorialCompleted } from "@/lib/tutorial/steps";

interface TutorialOverlayProps {
  /** Whether the tutorial is currently active */
  isActive: boolean;
  /** Callback when the tutorial is completed or skipped */
  onComplete: () => void;
  /** Initial step index (default 0) */
  initialStep?: number;
}

interface TooltipPosition {
  top: number;
  left: number;
  arrow: "top" | "bottom" | "left" | "right" | "none";
}

/**
 * Calculate tooltip position based on target element and desired position
 */
function calculatePosition(
  target: DOMRect | null,
  position: TutorialStep["position"],
  tooltipWidth: number,
  tooltipHeight: number
): TooltipPosition {
  const padding = 16;
  const arrowSize = 8;

  // Center position (no target)
  if (!target || position === "center") {
    return {
      top: window.innerHeight / 2 - tooltipHeight / 2,
      left: window.innerWidth / 2 - tooltipWidth / 2,
      arrow: "none",
    };
  }

  let top = 0;
  let left = 0;
  let arrow: TooltipPosition["arrow"] = "none";

  switch (position) {
    case "top":
      top = target.top - tooltipHeight - padding - arrowSize;
      left = target.left + target.width / 2 - tooltipWidth / 2;
      arrow = "bottom";
      break;
    case "bottom":
      top = target.bottom + padding + arrowSize;
      left = target.left + target.width / 2 - tooltipWidth / 2;
      arrow = "top";
      break;
    case "left":
      top = target.top + target.height / 2 - tooltipHeight / 2;
      left = target.left - tooltipWidth - padding - arrowSize;
      arrow = "right";
      break;
    case "right":
      top = target.top + target.height / 2 - tooltipHeight / 2;
      left = target.right + padding + arrowSize;
      arrow = "left";
      break;
  }

  // Clamp to viewport
  top = Math.max(padding, Math.min(window.innerHeight - tooltipHeight - padding, top));
  left = Math.max(padding, Math.min(window.innerWidth - tooltipWidth - padding, left));

  return { top, left, arrow };
}

/**
 * Tutorial overlay component that guides users through the app
 */
export function TutorialOverlay({ isActive, onComplete, initialStep = 0 }: TutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({
    top: 0,
    left: 0,
    arrow: "none",
  });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = TUTORIAL_STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;

  // Update positions when step changes or window resizes
  useEffect(() => {
    if (!isActive) return;

    // Find and measure target element
    const measureTarget = () => {
      if (!step?.targetSelector) {
        setTargetRect(null);
        return;
      }

      const target = document.querySelector(step.targetSelector);
      if (target) {
        setTargetRect(target.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    };

    // Initial measurement after a small delay to let DOM settle
    const initialTimer = setTimeout(measureTarget, 50);

    // Update on resize/scroll
    window.addEventListener("resize", measureTarget);
    window.addEventListener("scroll", measureTarget, true);

    return () => {
      clearTimeout(initialTimer);
      window.removeEventListener("resize", measureTarget);
      window.removeEventListener("scroll", measureTarget, true);
    };
  }, [isActive, currentStep, step]);

  // Calculate tooltip position after it renders
  useEffect(() => {
    if (!isActive || !tooltipRef.current) return;

    // Use setTimeout to break out of the render cycle
    const timer = setTimeout(() => {
      if (!tooltipRef.current) return;
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const newPosition = calculatePosition(
        targetRect,
        step?.position || "center",
        tooltipRect.width,
        tooltipRect.height
      );
      setTooltipPosition(newPosition);
    }, 0);

    return () => clearTimeout(timer);
  }, [isActive, targetRect, step]);

  const handleNext = useCallback(() => {
    if (isLastStep) {
      markTutorialCompleted();
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  }, [isLastStep, onComplete]);

  const handlePrev = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [isFirstStep]);

  const handleSkip = useCallback(() => {
    markTutorialCompleted();
    onComplete();
  }, [onComplete]);

  if (!isActive || !step) return null;

  return (
    <div className="fixed inset-0 z-[200]">
      {/* Backdrop with cutout for target element */}
      <div className="absolute inset-0">
        {targetRect ? (
          <svg className="absolute inset-0 w-full h-full">
            <defs>
              <mask id="tutorial-mask">
                <rect width="100%" height="100%" fill="white" />
                <rect
                  x={targetRect.left - 8}
                  y={targetRect.top - 8}
                  width={targetRect.width + 16}
                  height={targetRect.height + 16}
                  rx="8"
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="rgba(0, 0, 0, 0.75)"
              mask="url(#tutorial-mask)"
            />
          </svg>
        ) : (
          <div className="absolute inset-0 bg-black/75" />
        )}
      </div>

      {/* Highlight ring around target */}
      {targetRect && (
        <div
          className="absolute pointer-events-none border-2 border-cyan-400 rounded-lg animate-pulse"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="absolute z-10 w-80 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-cyan-500/50 rounded-xl shadow-2xl shadow-cyan-500/20 animate-in zoom-in-95 duration-200"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        {/* Arrow */}
        {tooltipPosition.arrow !== "none" && (
          <div
            className={`absolute w-4 h-4 bg-slate-900 border-cyan-500/50 transform rotate-45 ${
              tooltipPosition.arrow === "top"
                ? "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 border-l border-t"
                : tooltipPosition.arrow === "bottom"
                  ? "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 border-r border-b"
                  : tooltipPosition.arrow === "left"
                    ? "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 border-l border-b"
                    : "right-0 top-1/2 translate-x-1/2 -translate-y-1/2 border-r border-t"
            }`}
          />
        )}

        {/* Content */}
        <div className="p-5">
          {/* Step indicator */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1">
              {TUTORIAL_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === currentStep
                      ? "bg-cyan-400"
                      : i < currentStep
                        ? "bg-cyan-600"
                        : "bg-slate-600"
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] text-slate-500">
              {currentStep + 1} of {TUTORIAL_STEPS.length}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>

          {/* Description */}
          <p className="text-sm text-slate-300 leading-relaxed mb-4">{step.description}</p>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Skip tutorial
            </button>
            <div className="flex items-center gap-2">
              {!isFirstStep && (
                <button
                  onClick={handlePrev}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white bg-slate-700/50 hover:bg-slate-700 transition-colors"
                >
                  Back
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-4 py-1.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 transition-all shadow-lg shadow-cyan-500/20"
              >
                {isLastStep ? "Get Started" : "Next"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
