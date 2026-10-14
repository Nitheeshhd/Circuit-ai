import React, { useState } from "react";
import { z } from "zod";
import { motion, AnimatePresence } from "motion/react";
import {
  Zap,
  Cpu,
  Search,
  Brain,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  StopCircle,
  Sparkles,
  Layers,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { TargetBoard, FirmwareLanguage, ProjectComplexity, SubscriptionTier } from "../types";
import { BOARDS_CATALOG } from "../data/boards";
import { getMonthlyQuotaInfo, hasRemainingMonthlyQuota } from "../utils/entitlements";

const ProjectSchema = z.object({
  prompt: z.string().min(5, "Requirement must be at least 5 characters long"),
  targetBoard: z.string(),
  language: z.string(),
  complexity: z.string(),
  thinkingMode: z.boolean(),
  searchGrounding: z.boolean(),
  lowLatencyMode: z.boolean(),
});

interface LeftPanelProps {
  prompt: string;
  onChangePrompt: (val: string) => void;
  targetBoard: TargetBoard;
  onChangeTargetBoard: (board: TargetBoard) => void;
  language: FirmwareLanguage;
  onChangeLanguage: (lang: FirmwareLanguage) => void;
  complexity: ProjectComplexity;
  onChangeComplexity: (comp: ProjectComplexity) => void;
  thinkingMode: boolean;
  onToggleThinkingMode: (val: boolean) => void;
  searchGrounding: boolean;
  onToggleSearchGrounding: (val: boolean) => void;
  lowLatencyMode: boolean;
  onToggleLowLatencyMode: (val: boolean) => void;
  isGenerating: boolean;
  onGenerate: () => void;
  onStop: () => void;
  subscriptionTier?: SubscriptionTier;
  onOpenUpgradeModal?: () => void;
  userId?: string;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
  prompt,
  onChangePrompt,
  targetBoard,
  onChangeTargetBoard,
  language,
  onChangeLanguage,
  complexity,
  onChangeComplexity,
  thinkingMode,
  onToggleThinkingMode,
  searchGrounding,
  onToggleSearchGrounding,
  lowLatencyMode,
  onToggleLowLatencyMode,
  isGenerating,
  onGenerate,
  onStop,
  subscriptionTier = "free",
  onOpenUpgradeModal,
  userId,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const quotaInfo = getMonthlyQuotaInfo(userId);
  const selectedBoardInfo = BOARDS_CATALOG[targetBoard] || BOARDS_CATALOG["Auto-Select"];

  const handleGenerate = () => {
    if (!hasRemainingMonthlyQuota(userId)) {
      setValidationError(
        `Monthly project limit reached (${quotaInfo.used}/${quotaInfo.max} free projects generated this month). All tools are 100% free for 9 projects per month per account. Your quota will reset on ${quotaInfo.resetDate}.`
      );
      return;
    }

    const result = ProjectSchema.safeParse({
      prompt,
      targetBoard,
      language,
      complexity,
      thinkingMode,
      searchGrounding,
      lowLatencyMode,
    });

    if (!result.success) {
      setValidationError(result.error.issues[0].message);
      return;
    }

    setValidationError(null);
    onGenerate();
  };

  return (
    <div className="space-y-4">
      {/* Main Configuration Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-[#111719] p-5 sm:p-6 rounded-3xl border border-[#202728] space-y-5"
      >
        {/* Step 1: Project Description */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs uppercase tracking-wider text-[#9AA0A2] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#073D2D] text-[#25D366] border border-[#25D366]/30 flex items-center justify-center text-[11px] font-mono font-medium">
                1
              </span>
              <span className="font-medium text-[#F1F3F4] text-sm">Project Requirement</span>
            </label>
            {prompt && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onChangePrompt("")}
                className="text-xs font-normal text-[#9AA0A2] hover:text-[#F1F3F4] transition-colors flex items-center gap-1 cursor-pointer"
                title="Clear text"
              >
                <RotateCcw className="w-3 h-3 text-[#9AA0A2]" /> Clear
              </motion.button>
            )}
          </div>

          <div className="relative">
            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => {
                onChangePrompt(e.target.value);
                setValidationError(null);
              }}
              disabled={isGenerating}
              placeholder="e.g. Smart plant watering system using ESP32, capacitive soil sensor, DHT22, 0.96 inch I2C OLED, and 5V relay pump with auto-cutoff..."
              className="w-full bg-[#202628] border border-[#202728] focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366] rounded-2xl p-3.5 text-sm text-[#F1F3F4] placeholder-[#6F7779] leading-relaxed disabled:opacity-50 transition-colors duration-150 resize-none outline-hidden"
            />
            <div className="text-xs text-[#9AA0A2] flex justify-between items-center mt-1.5 px-1">
              <span>Natural student descriptions, informal notes, or component lists</span>
              <span className="font-mono text-xs text-[#6F7779]">
                {prompt.length} chars (No limit)
              </span>
            </div>
          </div>
        </div>

        {/* Validation Error */}
        <AnimatePresence>
          {validationError && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex items-center gap-2 text-xs text-[#f87171] bg-[#381617] p-3 rounded-xl border border-[#f87171]/30"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{validationError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 2: Target Microcontroller */}
        <div className="space-y-2 pt-2 border-t border-[#202728]">
          <div className="flex items-center justify-between">
            <label className="text-xs uppercase tracking-wider text-[#9AA0A2] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#073D2D] text-[#25D366] border border-[#25D366]/30 flex items-center justify-center text-[11px] font-mono font-medium">
                2
              </span>
              <span className="font-medium text-[#F1F3F4] text-sm">Target Microcontroller</span>
            </label>
          </div>

          <select
            value={targetBoard}
            onChange={(e) => onChangeTargetBoard(e.target.value as TargetBoard)}
            disabled={isGenerating}
            className="w-full bg-[#202628] border border-[#202728] focus:border-[#25D366] rounded-2xl p-2.5 text-sm font-normal text-[#F1F3F4] cursor-pointer transition-colors duration-150 outline-hidden"
          >
            <option value="Auto-Select">Auto-Select (Smart Hardware Heuristics)</option>
            <option value="ESP32 (WROOM-32)">ESP32 DevKit V1 (Wi-Fi + BLE, 3.3V Logic)</option>
            <option value="Arduino Uno / Nano">Arduino Uno / Nano (ATmega328P, 5.0V Logic)</option>
            <option value="ESP8266 (NodeMCU)">ESP8266 NodeMCU (Wi-Fi, 3.3V Logic)</option>
            <option value="STM32 (Blue Pill)">STM32 Blue Pill (ARM Cortex-M3, 72MHz, 3.3V)</option>
            <option value="Raspberry Pi Pico">Raspberry Pi Pico (RP2040 Dual Core, 3.3V)</option>
            <option value="8051 Microcontroller">8051 Microcontroller (AT89S52, 5.0V Classical)</option>
            <option value="Arduino Mega 2560">Arduino Mega 2560 (54 I/O Pins, 4 UARTs)</option>
          </select>

          <p className="text-xs text-[#9AA0A2] line-clamp-1">
            {selectedBoardInfo.bestFor}
          </p>
        </div>

        {/* Step 3: Firmware & Scope */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#202728]">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#9AA0A2]">
              Firmware Target
            </label>
            <select
              value={language}
              onChange={(e) => onChangeLanguage(e.target.value as FirmwareLanguage)}
              disabled={isGenerating}
              className="w-full bg-[#202628] border border-[#202728] focus:border-[#25D366] rounded-2xl p-2 text-xs font-normal text-[#F1F3F4] cursor-pointer outline-hidden"
            >
              <option value="Arduino C++ (.ino)">Arduino C++ (.ino)</option>
              <option value="MicroPython (.py)">MicroPython (.py)</option>
              <option value="Embedded C (Keil/AVR)">Embedded C (Keil/AVR)</option>
              <option value="CircuitPython (.py)">CircuitPython (.py)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#9AA0A2]">
              Project Scope
            </label>
            <select
              value={complexity}
              onChange={(e) => onChangeComplexity(e.target.value as ProjectComplexity)}
              disabled={isGenerating}
              className="w-full bg-[#202628] border border-[#202728] focus:border-[#25D366] rounded-2xl p-2 text-xs font-normal text-[#F1F3F4] cursor-pointer outline-hidden"
            >
              <option value="Undergraduate Lab / Mini Project">Undergrad Mini Project</option>
              <option value="Final Year / Capstone IoT Project">Final Year Capstone</option>
              <option value="Hobbyist / Maker Quick Build">Hobbyist Quick Build</option>
              <option value="Commercial / Industrial Prototype">Industrial Prototype</option>
            </select>
          </div>
        </div>

        {/* Collapsible Advanced Options */}
        <div className="border-t border-[#202728] pt-2">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs font-medium text-[#9AA0A2] hover:text-[#F1F3F4] flex items-center justify-between w-full transition-colors py-1 cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#9AA0A2]" />
              <span>Advanced Reasoning & Grounding Settings</span>
            </span>
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className="mt-2.5 space-y-2.5 p-3.5 bg-[#071011] rounded-2xl border border-[#202728] text-xs overflow-hidden"
              >
                {/* Thinking Mode */}
                <label className="flex items-start gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={thinkingMode}
                    onChange={(e) => {
                      onToggleThinkingMode(e.target.checked);
                      if (e.target.checked) onToggleLowLatencyMode(false);
                    }}
                    className="mt-0.5 rounded-md text-[#25D366] focus:ring-[#25D366] bg-[#202628] border-[#202728]"
                  />
                  <div>
                    <div className="font-medium text-[#F1F3F4] flex items-center gap-1.5 group-hover:text-[#25D366] transition-colors">
                      <Brain className="w-3.5 h-3.5 text-[#9AA0A2]" />
                      Deep Reasoning Mode (Advanced)
                    </div>
                    <div className="text-xs text-[#9AA0A2] mt-0.5 leading-normal">
                      Performs step-by-step pin safety arbitration, strapping pin validation, and power decoupling logic.
                    </div>
                  </div>
                </label>

                {/* Search Grounding */}
                <label className="flex items-start gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={searchGrounding}
                    onChange={(e) => onToggleSearchGrounding(e.target.checked)}
                    className="mt-0.5 rounded-md text-[#25D366] focus:ring-[#25D366] bg-[#202628] border-[#202728]"
                  />
                  <div>
                    <div className="font-medium text-[#F1F3F4] flex items-center gap-1.5 group-hover:text-[#25D366] transition-colors">
                      <Search className="w-3.5 h-3.5 text-[#9AA0A2]" />
                      Live Search Grounding
                    </div>
                    <div className="text-xs text-[#9AA0A2] mt-0.5 leading-normal">
                      Fetches current pricing averages from Indian electronics stores (Robu, ElectronicsComp, Amazon.in).
                    </div>
                  </div>
                </label>

                {/* Low Latency */}
                <label className="flex items-start gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={lowLatencyMode}
                    onChange={(e) => {
                      onToggleLowLatencyMode(e.target.checked);
                      if (e.target.checked) onToggleThinkingMode(false);
                    }}
                    className="mt-0.5 rounded-md text-[#25D366] focus:ring-[#25D366] bg-[#202628] border-[#202728]"
                  />
                  <div>
                    <div className="font-medium text-[#F1F3F4] flex items-center gap-1.5 group-hover:text-[#25D366] transition-colors">
                      <Zap className="w-3.5 h-3.5 text-[#9AA0A2]" />
                      Fast Stream Mode (High Speed)
                    </div>
                    <div className="text-xs text-[#9AA0A2] mt-0.5 leading-normal">
                      Optimized for instant sub-2 second response generation.
                    </div>
                  </div>
                </label>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Monthly Project Generation Quota Card */}
        <div className="bg-[#071011] p-3.5 rounded-2xl border border-[#202728] space-y-2 text-xs">
          <div className="flex items-center justify-between text-[#F1F3F4] font-medium">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#25D366]" />
              <span>Monthly Project Quota</span>
            </span>
            <span className={`font-mono font-bold ${quotaInfo.isQuotaExceeded ? "text-rose-400" : "text-[#25D366]"}`}>
              {quotaInfo.used} / {quotaInfo.max} Free Projects
            </span>
          </div>
          <div className="w-full bg-[#202628] h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                quotaInfo.isQuotaExceeded ? "bg-rose-500" : "bg-[#25D366]"
              }`}
              style={{ width: `${Math.min(100, (quotaInfo.used / quotaInfo.max) * 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#9AA0A2]">
            <span>All tools 100% free for 9 projects/mo</span>
            <span>Resets: {quotaInfo.resetDate}</span>
          </div>
        </div>

        {/* Primary Action Button */}
        {isGenerating ? (
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="button"
            onClick={onStop}
            className="w-full bg-[#381617] hover:bg-[#4a1c1d] border border-[#f87171]/40 text-[#f87171] font-medium py-3 rounded-full transition-colors duration-150 flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer"
          >
            <StopCircle className="w-4 h-4 animate-pulse" />
            <span>Stop Generation Stream</span>
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="button"
            onClick={handleGenerate}
            className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-[#071011] font-medium py-3 rounded-full transition-colors duration-150 flex items-center justify-center gap-2 text-sm tracking-wide disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-[#071011]" />
            <span className="font-medium">Generate Blueprint</span>
          </motion.button>
        )}
      </motion.div>

      {/* Indian Academic Curricula & Engineering Standards Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.05 }}
        className="bg-[#111719] border border-[#202728] rounded-3xl p-4 sm:p-5 text-xs text-[#F1F3F4] space-y-2.5"
      >
        <div className="font-medium text-[#F1F3F4] flex items-center gap-2 text-sm">
          <span>🇮🇳</span>
          <span>Indian ECE & EEE Lab Standards Built-in</span>
        </div>
        <ul className="space-y-2 text-xs text-[#9AA0A2] leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="text-[#25D366] font-medium mt-0.5">✓</span>
            <span><strong className="text-[#F1F3F4] font-medium">Localized BOM:</strong> Estimated prices in INR (₹) matching Robu.in & local shops.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#25D366] font-medium mt-0.5">✓</span>
            <span><strong className="text-[#F1F3F4] font-medium">Strapping Safety:</strong> Isolates ESP32 GPIO 0, 2, 12, 15 from sensor pull-ups.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#25D366] font-medium mt-0.5">✓</span>
            <span><strong className="text-[#F1F3F4] font-medium">Logic Protection:</strong> Auto-calculates voltage dividers for 5V sensor outputs.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#25D366] font-medium mt-0.5">✓</span>
            <span><strong className="text-[#F1F3F4] font-medium">Viva Voce Prep:</strong> Includes top 5 external examiner questions & sample answers.</span>
          </li>
        </ul>
      </motion.div>
    </div>
  );
};
