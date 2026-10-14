import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BookOpen,
  Calculator,
  Stethoscope,
  MessageSquare,
  ChevronDown,
  Sparkles,
  Settings,
  HelpCircle,
  Palette,
  Wrench,
  X,
} from "lucide-react";
import { ProjectPreset, TargetBoard, SubscriptionTier } from "../types";
import { PROJECT_PRESETS } from "../data/presets";
import { CodeCraftLogo } from "./CodeCraftLogo";
import { UserAuthButton } from "./UserAuthButton";
import { AppUser as User } from "../services/supabase";

interface HeaderProps {
  apiKey: string;
  hasServerKey: boolean;
  onOpenKeyModal: () => void;
  onOpenCalculator: () => void;
  onOpenResistorTool?: () => void;
  onOpenDiagnostics: () => void;
  onToggleChat: () => void;
  isChatOpen: boolean;
  onSelectPreset: (preset: ProjectPreset) => void;
  activeModelMode: "flash" | "thinking" | "lite" | "search";
  onChangeModelMode: (mode: "flash" | "thinking" | "lite" | "search") => void;
  // Supabase Auth & Cloud Sync Props
  user: User | null;
  isLoadingAuth: boolean;
  onOpenCloudProjects: () => void;
  onSaveCurrentToCloud: () => void;
  onOpenLogin?: () => void;
  hasActiveBlueprint: boolean;
  savedProjectsCount: number;
  subscriptionTier?: SubscriptionTier;
  onOpenUpgradeModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  apiKey,
  hasServerKey,
  onOpenKeyModal,
  onOpenCalculator,
  onOpenResistorTool,
  onOpenDiagnostics,
  onToggleChat,
  isChatOpen,
  onSelectPreset,
  user,
  isLoadingAuth,
  onOpenCloudProjects,
  onSaveCurrentToCloud,
  onOpenLogin,
  hasActiveBlueprint,
  savedProjectsCount,
  subscriptionTier = "free",
  onOpenUpgradeModal,
}) => {
  const [showPresetsMenu, setShowPresetsMenu] = useState(false);
  const [showMobileTools, setShowMobileTools] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileToolsRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowPresetsMenu(false);
      }
      if (mobileToolsRef.current && !mobileToolsRef.current.contains(event.target as Node)) {
        setShowMobileTools(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getMaskedKey = () => {
    if (apiKey && apiKey.startsWith("AIzaSy")) {
      return `${apiKey.substring(0, 6)}••••${apiKey.substring(apiKey.length - 4)}`;
    }
    if (hasServerKey) {
      return "API Key Active";
    }
    return "Connect API Key";
  };

  const isKeyConfigured = Boolean(apiKey || hasServerKey);

  return (
    <header className="bg-[#070b0e] text-slate-200 border-b border-[#1b2226] sticky top-0 z-40">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Logo matching reference image */}
        <div className="flex items-center gap-3">
          <CodeCraftLogo size="xs" isAnimated={false} badgeOnly={true} />
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
              <span>Circuito</span>
              <span className="text-orange-500 font-extrabold">AI</span>
            </h1>
            <span className="text-slate-600 font-bold">•</span>
            <span className="text-xs text-slate-400 font-tech hidden sm:inline">
              Engineered by <strong className="text-slate-200 font-semibold">Shreyas HT</strong> (MITK)
            </span>
          </div>
        </div>

        {/* Center / Quick Engineering Tools */}
        <div className="hidden xl:flex items-center gap-2">
          {/* Presets Dropdown */}
          <div className="relative" ref={menuRef}>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setShowPresetsMenu(!showPresetsMenu)}
              className="text-xs bg-[#12181b] hover:bg-[#1a2226] text-slate-200 border border-[#222c30] px-3.5 py-1.5 rounded-full font-normal flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              <span>Templates</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${showPresetsMenu ? "rotate-180" : ""}`} />
            </motion.button>

            <AnimatePresence>
              {showPresetsMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 mt-2 w-80 bg-[#12181b] border border-[#222c30] rounded-2xl shadow-xl z-50 py-1.5 max-h-[26rem] overflow-y-auto divide-y divide-[#222c30]"
                >
                  <div className="px-4 py-2.5 text-xs font-medium text-orange-400 flex items-center gap-1.5 bg-[#0a0e12]">
                    <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                    <span>Ready-to-Use Engineering Projects</span>
                  </div>
                  <div className="py-1">
                    {PROJECT_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => {
                          onSelectPreset(preset);
                          setShowPresetsMenu(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs text-slate-200 hover:bg-[#1a2226] transition-colors flex flex-col gap-0.5 group cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-white group-hover:text-orange-400 transition-colors">
                            {preset.title}
                          </span>
                          <span className="text-[11px] text-orange-400 font-mono">
                            {preset.targetBoard.split(" ")[0]}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 line-clamp-1">
                          {preset.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={onOpenCalculator}
            className="text-xs bg-[#12181b] hover:bg-[#1a2226] text-slate-200 border border-[#222c30] px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5 text-slate-400" />
            <span>Calculator</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={onOpenResistorTool}
            className="text-xs bg-[#12181b] hover:bg-[#1a2226] text-slate-200 border border-[#222c30] px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Palette className="w-3.5 h-3.5 text-slate-400" />
            <span>Colors</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={onOpenDiagnostics}
            className="text-xs bg-[#12181b] hover:bg-[#1a2226] text-slate-200 border border-[#222c30] px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
            <span>Pin Linter</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={onToggleChat}
            className={`text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 border transition-colors cursor-pointer ${
              isChatOpen
                ? "bg-orange-500/20 border-orange-500/40 text-orange-400"
                : "bg-[#12181b] hover:bg-[#1a2226] text-slate-200 border-[#222c30]"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
            <span>Lab Advisor</span>
          </motion.button>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Mobile Tools Menu (< xl screens) */}
          <div className="relative xl:hidden" ref={mobileToolsRef}>
            <button
              onClick={() => setShowMobileTools(!showMobileTools)}
              title="Engineering Tools"
              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                showMobileTools
                  ? "bg-orange-500/20 border-orange-500/50 text-orange-400"
                  : "bg-[#12181b] hover:bg-[#1a2226] border-[#222c30] text-slate-300 hover:text-white"
              }`}
            >
              <Wrench className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {showMobileTools && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-56 bg-[#12181b] border border-[#222c30] rounded-2xl shadow-2xl z-50 py-1.5 divide-y divide-[#222c30]"
                >
                  <div className="px-3 py-2 text-[11px] font-semibold text-orange-400 uppercase tracking-wider bg-[#0a0e12]">
                    Quick Engineering Tools
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowMobileTools(false);
                        setShowPresetsMenu(true);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-slate-200 hover:bg-[#1a2226] flex items-center gap-2.5 cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4 text-orange-400" />
                      <span>Project Templates</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowMobileTools(false);
                        onOpenCalculator();
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-slate-200 hover:bg-[#1a2226] flex items-center gap-2.5 cursor-pointer"
                    >
                      <Calculator className="w-4 h-4 text-sky-400" />
                      <span>Circuit Calculator</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowMobileTools(false);
                        onOpenResistorTool?.();
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-slate-200 hover:bg-[#1a2226] flex items-center gap-2.5 cursor-pointer"
                    >
                      <Palette className="w-4 h-4 text-amber-400" />
                      <span>Resistor Color Bands</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowMobileTools(false);
                        onOpenDiagnostics();
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-slate-200 hover:bg-[#1a2226] flex items-center gap-2.5 cursor-pointer"
                    >
                      <Stethoscope className="w-4 h-4 text-emerald-400" />
                      <span>Pin & Safety Linter</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowMobileTools(false);
                        onToggleChat();
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-slate-200 hover:bg-[#1a2226] flex items-center gap-2.5 cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4 text-orange-400" />
                      <span>AI Lab Advisor</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Get Free Key Button (hidden on narrow screens) */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenKeyModal}
            className="text-xs text-slate-300 hover:text-white font-medium px-2.5 py-1.5 transition-colors cursor-pointer hidden md:inline"
          >
            Get Free Key
          </motion.button>

          {/* Subscription Plan Indicator Badge */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenUpgradeModal}
            title="View subscription plans & tier details"
            className={`px-3 py-1 rounded-full text-xs font-bold font-mono border transition flex items-center gap-1.5 cursor-pointer ${
              subscriptionTier === "pro"
                ? "bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25"
                : subscriptionTier === "student"
                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25"
                : "bg-[#12181b] hover:bg-[#1a2226] text-slate-300 border-[#222c30]"
            }`}
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${
              subscriptionTier === "pro"
                ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                : subscriptionTier === "student"
                ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                : "bg-slate-400"
            }`} />
            <span className="uppercase tracking-wider text-[10px] sm:text-[11px]">{subscriptionTier}</span>
          </motion.button>

          {/* API Key Active Status Pill with Green Dot */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenKeyModal}
            className="bg-[#12181b] hover:bg-[#1a2226] border border-[#222c30] px-2.5 sm:px-3 py-1.5 rounded-full flex items-center gap-1.5 sm:gap-2 transition-colors cursor-pointer text-xs"
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${isKeyConfigured ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" : "bg-amber-400"}`} />
            <span className="font-mono text-slate-200 text-[10px] sm:text-[11px] truncate max-w-[90px] sm:max-w-none">{getMaskedKey()}</span>
          </motion.button>

          {/* Settings Gear Button */}
          <button
            onClick={onOpenKeyModal}
            title="Settings"
            className="w-8 h-8 rounded-full bg-[#12181b] hover:bg-[#1a2226] border border-[#222c30] flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Help Question Icon */}
          <button
            onClick={onToggleChat}
            title="Help & Lab Advisor"
            className="w-8 h-8 rounded-full bg-[#12181b] hover:bg-[#1a2226] border border-[#222c30] flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* User Profile / Auth Button */}
          <UserAuthButton
            user={user}
            isLoadingAuth={isLoadingAuth}
            onOpenCloudProjects={onOpenCloudProjects}
            onSaveCurrentToCloud={onSaveCurrentToCloud}
            onOpenLogin={onOpenLogin}
            hasActiveBlueprint={hasActiveBlueprint}
            savedProjectsCount={savedProjectsCount}
          />
        </div>
      </div>

      {/* Dedicated Mobile Quick Engineering Tools Bar (Visible on < xl screens) */}
      <div className="xl:hidden bg-[#0a0e12] border-t border-[#1b2226] px-3 py-2 flex items-center gap-2 overflow-x-auto text-xs scroll-smooth">
        {/* Templates Button */}
        <button
          onClick={() => setShowPresetsMenu(!showPresetsMenu)}
          className="text-xs bg-[#12181b] hover:bg-[#1a2226] text-slate-200 border border-[#222c30] px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
        >
          <BookOpen className="w-3.5 h-3.5 text-orange-400" />
          <span>Templates</span>
          <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showPresetsMenu ? "rotate-180" : ""}`} />
        </button>

        {/* Calculator Button */}
        <button
          onClick={onOpenCalculator}
          className="text-xs bg-[#12181b] hover:bg-[#1a2226] text-slate-200 border border-[#222c30] px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
        >
          <Calculator className="w-3.5 h-3.5 text-sky-400" />
          <span>Calculator</span>
        </button>

        {/* Resistor Colors Button */}
        <button
          onClick={onOpenResistorTool}
          className="text-xs bg-[#12181b] hover:bg-[#1a2226] text-slate-200 border border-[#222c30] px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
        >
          <Palette className="w-3.5 h-3.5 text-amber-400" />
          <span>Colors</span>
        </button>

        {/* Pin Linter Button */}
        <button
          onClick={onOpenDiagnostics}
          className="text-xs bg-[#12181b] hover:bg-[#1a2226] text-slate-200 border border-[#222c30] px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
        >
          <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
          <span>Pin Linter</span>
        </button>

        {/* Lab Advisor Button */}
        <button
          onClick={onToggleChat}
          className={`text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 border transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
            isChatOpen
              ? "bg-orange-500/20 border-orange-500/40 text-orange-400"
              : "bg-[#12181b] hover:bg-[#1a2226] text-slate-200 border-[#222c30]"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-orange-400" />
          <span>Lab Advisor</span>
        </button>
      </div>

      {/* Mobile Templates Overlay Modal (Visible on < xl screens when Templates is tapped) */}
      <AnimatePresence>
        {showPresetsMenu && (
          <div className="xl:hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-lg bg-[#12181b] border border-[#222c30] rounded-3xl p-5 shadow-2xl max-h-[85vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#222c30] mb-3">
                <div className="flex items-center gap-2 text-orange-400 font-bold text-sm">
                  <Sparkles className="w-4 h-4 text-orange-400" />
                  <span>Engineering Project Templates</span>
                </div>
                <button
                  onClick={() => setShowPresetsMenu(false)}
                  className="w-8 h-8 rounded-full bg-[#1a2226] text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Templates List */}
              <div className="overflow-y-auto space-y-2.5 pr-1 flex-1">
                {PROJECT_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      onSelectPreset(preset);
                      setShowPresetsMenu(false);
                    }}
                    className="w-full text-left p-3.5 bg-[#161e22] hover:bg-[#1f292e] border border-[#222c30] rounded-2xl transition-all flex flex-col gap-1.5 text-xs group cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-white group-hover:text-orange-400 transition-colors">
                        {preset.title}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 font-mono shrink-0">
                        {preset.targetBoard.split(" ")[0]}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-2">
                      {preset.description}
                    </p>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
};
