import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Check, Sparkles, ShieldCheck, Zap, Heart } from "lucide-react";

interface SubscriptionPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier?: string;
  onSelectPlan?: (plan: "student" | "pro") => void;
  isGuest?: boolean;
  onOpenLogin?: () => void;
}

export const SubscriptionPlansModal: React.FC<SubscriptionPlansModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative w-full max-w-2xl bg-[#0b0f19] border border-emerald-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl overflow-hidden my-8 text-center"
        >
          {/* Ambient Background Glow */}
          <div className="absolute top-0 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-[#161e31] hover:bg-[#202b44] text-slate-400 hover:text-white flex items-center justify-center transition border border-[#232f4a] cursor-pointer z-10"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>100% Free & Unlimited Access</span>
          </div>

          {/* Heading */}
          <h2 className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight mb-3">
            Circuito AI Free Account Quota
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed max-w-lg mx-auto mb-8">
            Every single account gets <strong className="text-emerald-400 font-bold">9 FREE AI projects generated per month</strong>. All engineering tools, firmware generators, diagnostics, and calculators are 100% free with no prompt length limits.
          </p>

          {/* Features Grid */}
          <div className="bg-[#0e1422] border border-[#1f2a3f] rounded-2xl p-6 mb-8 text-left space-y-3">
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Zap className="w-4 h-4" />
              <span>Included Free for All 9 Monthly Projects:</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Unlimited Prompt Length (No Cap)</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Production C++ / Arduino / ESP32 Code</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Interactive Pin-to-Pin Visualizer</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Viva Voce Q&A Generator</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>AI Circuit Diagnostics Tool</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Lab Advisor & Hardware Calculators</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-8 py-3.5 bg-[#00c853] hover:bg-[#00b248] text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition cursor-pointer inline-flex items-center justify-center gap-2"
          >
            <Heart className="w-4 h-4 fill-white" />
            <span>Start Building Circuits Now</span>
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
