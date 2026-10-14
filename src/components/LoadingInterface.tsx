import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { CodeCraftLogo } from "./CodeCraftLogo";
import { CircuitPathGraphic } from "./CircuitPathGraphic";
import { Sparkles, StopCircle } from "lucide-react";

interface LoadingInterfaceProps {
  isGenerating: boolean;
  onStop?: () => void;
  targetBoard?: string;
}

const GENERATION_STEPS = [
  { label: "Analyzing hardware components & pinout requirements", icon: "📐" },
  { label: "Validating logic levels & strapping pin protection", icon: "🛡️" },
  { label: "Calculating Indian retail market BOM (₹)", icon: "₹" },
  { label: "Synthesizing non-blocking verified firmware", icon: "⚡" },
  { label: "Preparing external examiner viva voce Q&A", icon: "🎓" },
];

export const LoadingInterface: React.FC<LoadingInterfaceProps> = ({
  isGenerating,
  onStop,
  targetBoard = "ESP32 (WROOM-32)",
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isGenerating) {
      setCurrentStep(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < GENERATION_STEPS.length - 1 ? prev + 1 : prev));
    }, 1800);

    return () => clearInterval(interval);
  }, [isGenerating]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col items-center justify-center p-6 sm:p-8 bg-[#111719] border border-[#202728] rounded-3xl shadow-2xl space-y-6 w-full max-w-xl mx-auto my-4 relative overflow-hidden backdrop-blur-sm"
    >
      {/* Decorative Gradient Background Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#182022] to-transparent opacity-50 z-0" />
      {/* SVG Circuit Path Drawing Animation */}
      <div className="w-full relative z-10">
        <CircuitPathGraphic isPulsing={true} />
      </div>

      {/* Main Logo & Emblem Display Container */}
      <div className="relative z-10 flex flex-col items-center w-full bg-[#111719] border border-[#202728] p-6 rounded-3xl">
        <CodeCraftLogo
          size="lg"
          showTagline={true}
          showBadges={true}
          isAnimated={isGenerating}
        />
      </div>

      {/* Progress & Live Steps */}
      <div className="w-full space-y-3 relative z-10 pt-2 border-t border-[#202728]">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-[#25D366] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#25D366] animate-spin" />
            <span>Synthesizing for {targetBoard}...</span>
          </span>
          <span className="font-mono text-xs font-medium text-[#25D366]">
            Step {currentStep + 1} of {GENERATION_STEPS.length}
          </span>
        </div>

        {/* Progress Bar with animated green fill */}
        <div className="w-full h-2 bg-[#202628] rounded-full overflow-hidden border border-[#202728] p-0.5 relative">
          <motion.div
            className="h-full bg-[#25D366] rounded-full"
            initial={{ width: "20%" }}
            animate={{ width: `${((currentStep + 1) / GENERATION_STEPS.length) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </div>

        {/* Active Stage Indicator */}
        <div className="bg-[#182022] border border-[#202728] p-4 rounded-2xl flex items-center justify-between text-xs tracking-tight">
          <div className="flex items-center gap-3 text-[#F1F3F4]">
            <span className="text-base">{GENERATION_STEPS[currentStep].icon}</span>
            <span className="font-medium text-[#E1E3E4]">{GENERATION_STEPS[currentStep].label}</span>
          </div>
          <div className="flex gap-1.5 items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse delay-75" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse delay-150" />
          </div>
        </div>
      </div>

      {/* Stop / Cancel Button */}
      {onStop && (
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          type="button"
          onClick={onStop}
          className="relative z-10 text-xs font-medium bg-[#381617] hover:bg-[#4a1c1d] text-[#f87171] border border-[#f87171]/40 px-4 py-2 rounded-full transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <StopCircle className="w-4 h-4 text-[#f87171]" />
          <span>Stop Synthesis</span>
        </motion.button>
      )}
    </motion.div>
  );
};
