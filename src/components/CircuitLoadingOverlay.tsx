import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CodeCraftLogo } from "./CodeCraftLogo";
import { CircuitPathGraphic } from "./CircuitPathGraphic";
import {
  Sparkles,
  StopCircle,
  Cpu,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  CheckCircle2,
  Terminal,
} from "lucide-react";
import { TargetBoard } from "../types";

interface CircuitLoadingOverlayProps {
  isOpen: boolean;
  onStop?: () => void;
  targetBoard: TargetBoard;
  streamedLength?: number;
  complexity?: string;
}

const TELEMETRY_STAGES = [
  {
    title: "1. Hardware Peripherals & Pinout Allocation",
    detail: "Mapping GPIO matrices, SPI/I2C buses & ADC channel constraints...",
    icon: Cpu,
    tag: "GPIO MAP",
  },
  {
    title: "2. Electrical Safety & Strapping Pin Protection",
    detail: "Verifying 3.3V vs 5V voltage dividers and bootloader safety pins...",
    icon: ShieldCheck,
    tag: "SAFETY",
  },
  {
    title: "3. Indian Retail BOM & Sourcing (INR ₹)",
    detail: "Computing component pricing for Robu.in, ElectronicsComp & Amazon India...",
    icon: Zap,
    tag: "BOM ₹",
  },
  {
    title: "4. Non-Blocking Firmware & FreeRTOS Architecture",
    detail: "Synthesizing non-blocking millis() loops, timer routines & driver headers...",
    icon: Activity,
    tag: "FIRMWARE",
  },
  {
    title: "5. External Examiner Viva Voce & Lab Protocol",
    detail: "Generating university examination Q&As and bench test procedures...",
    icon: Layers,
    tag: "VIVA LAB",
  },
];

export const CircuitLoadingOverlay: React.FC<CircuitLoadingOverlayProps> = ({
  isOpen,
  onStop,
  targetBoard,
  streamedLength = 0,
}) => {
  const [activeStage, setActiveStage] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setActiveStage(0);
      return;
    }

    const interval = setInterval(() => {
      setActiveStage((prev) => (prev < TELEMETRY_STAGES.length - 1 ? prev + 1 : prev));
    }, 2200);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#05070d]/85 backdrop-blur-xl overflow-y-auto"
      >
        {/* Subtle Ambient Radial Glowing Lights */}
        <div className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none -z-10" />
        <div className="fixed bottom-1/4 right-1/4 w-[500px] h-[500px] bg-orange-600/15 rounded-full blur-[140px] pointer-events-none -z-10" />
        <div className="fixed top-1/2 right-1/3 w-[400px] h-[400px] bg-amber-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />

        {/* Main Modal / Card Container */}
        <motion.div
          initial={{ scale: 0.95, y: 15 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 15 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className="w-full max-w-2xl bg-[#0e121f]/95 border border-[#232d45] rounded-3xl shadow-[0_20px_70px_rgba(0,0,0,0.8)] overflow-hidden text-slate-300 relative flex flex-col my-auto"
        >
          {/* Top Status Header */}
          <div className="bg-[#13182a] px-6 py-3.5 border-b border-[#20273a] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
              <div>
                <span className="text-xs font-display font-bold text-white tracking-wide flex items-center gap-2">
                  <span>Hardware Synthesis in Progress</span>
                  <span className="text-[10px] font-tech font-bold text-orange-300 bg-orange-950/70 border border-orange-500/40 px-2.5 py-0.5 rounded-full">
                    {targetBoard}
                  </span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-amber-400 font-bold hidden sm:inline">
                {streamedLength > 0 ? `${streamedLength} chars generated` : "Synthesizing..."}
              </span>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 sm:p-7 space-y-5 flex flex-col items-center">
            {/* SVG Circuit Path Drawing Animation with Glowing Pulse */}
            <div className="w-full relative px-1">
              <CircuitPathGraphic isPulsing={true} />
            </div>

            {/* Central Logo Container */}
            <div className="w-full bg-[#111626]/90 border border-[#232b40] p-5 rounded-2xl shadow-xl flex flex-col items-center justify-center relative overflow-hidden">
              {/* Internal Accent Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-2 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-80" />

              {/* Logo Emblem, Title, Tagline & Badges */}
              <CodeCraftLogo
                size="lg"
                showTagline={true}
                showBadges={true}
                isAnimated={true}
              />
            </div>

            {/* Live Progress Stage Tracker */}
            <div className="w-full space-y-2.5 pt-1">
              <div className="flex items-center justify-between text-xs font-tech">
                <span className="font-bold text-indigo-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />
                  <span>Synthesizing Engineering Specifications</span>
                </span>
                <span className="font-mono text-xs font-bold text-emerald-400">
                  Phase {activeStage + 1} of {TELEMETRY_STAGES.length}
                </span>
              </div>

              {/* Animated Progress Bar */}
              <div className="w-full h-2.5 bg-[#0a0d16] rounded-full overflow-hidden border border-[#232b40] p-0.5 relative">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 rounded-full relative"
                  initial={{ width: "15%" }}
                  animate={{ width: `${((activeStage + 1) / TELEMETRY_STAGES.length) * 100}%` }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/60 blur-xs rounded-full animate-pulse" />
                </motion.div>
              </div>

              {/* Active Stage Card */}
              <div className="bg-[#121727] border border-[#252f47] p-3.5 rounded-2xl flex items-start justify-between gap-3 shadow-inner">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    {React.createElement(TELEMETRY_STAGES[activeStage].icon, { className: "w-4 h-4" })}
                  </div>
                  <div>
                    <div className="font-display font-bold text-slate-100 text-xs flex items-center gap-2">
                      <span>{TELEMETRY_STAGES[activeStage].title}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 font-sans leading-relaxed">
                      {TELEMETRY_STAGES[activeStage].detail}
                    </div>
                  </div>
                </div>

                <span className="text-[9px] font-mono font-bold uppercase bg-[#0b0e18] text-emerald-400 px-2.5 py-1 rounded-lg border border-[#232b40] shrink-0">
                  {TELEMETRY_STAGES[activeStage].tag}
                </span>
              </div>
            </div>

            {/* Quick Live Spec Checklist */}
            <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-tech">
              <div className="p-2 bg-[#121625] border border-[#20273a] rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-slate-300 truncate">3.3V Logic Safe</span>
              </div>
              <div className="p-2 bg-[#121625] border border-[#20273a] rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-slate-300 truncate">Robu.in BOM (₹)</span>
              </div>
              <div className="p-2 bg-[#121625] border border-[#20273a] rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-slate-300 truncate">Non-Blocking Code</span>
              </div>
              <div className="p-2 bg-[#121625] border border-[#20273a] rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-slate-300 truncate">Examiner Viva Voce</span>
              </div>
            </div>
          </div>

          {/* Modal Footer with Actions & High-Quality Bottom-Center Typography Block */}
          <div className="bg-[#111524] px-6 py-4 border-t border-[#1f263b] relative flex flex-col items-center justify-center gap-3">
            {/* Ambient Top Subtle Divider Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

            {/* High-Quality Typography Block: Bottom-Center 'by Shreyas MITK' */}
            <div className="flex flex-col items-center justify-center text-center space-y-1">
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-[#14192b]/95 border border-[#27324d] rounded-full shadow-[0_2px_12px_rgba(0,0,0,0.4)] transition-all">
                <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.6)]" />
                
                <div className="flex items-center gap-1.5 text-xs font-sans tracking-wide">
                  <span className="text-slate-400 font-normal">by</span>
                  <span className="text-white font-bold font-display tracking-tight text-[13px]">
                    Shreyas
                  </span>
                  <span className="text-slate-500 font-bold">•</span>
                  <span className="font-mono font-bold text-orange-400 bg-orange-950/80 border border-orange-500/30 px-1.5 py-0.2 rounded text-[11px] tracking-wider uppercase">
                    MITK
                  </span>
                </div>
              </div>

              <p className="text-[10px] font-tech text-slate-400 tracking-wider uppercase font-medium">
                Moodlakatte Institute of Technology, Kundapura
              </p>
            </div>

            {/* Bottom Utilities (Status left, Stop button right) */}
            <div className="w-full flex items-center justify-between text-xs pt-1 border-t border-[#1a2033]/60">
              <div className="text-[11px] font-tech text-slate-400 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="truncate">Automated Hardware Verification Engine</span>
              </div>

              {onStop && (
                <button
                  type="button"
                  onClick={onStop}
                  className="text-xs font-tech font-bold bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-500/30 hover:border-rose-500/50 px-3 py-1 rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <StopCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Stop</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
