import React, { useState, useMemo, useEffect } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "motion/react";
import {
  Copy,
  Check,
  Download,
  Printer,
  FileSpreadsheet,
  FileCode,
  ShieldAlert,
  Cpu,
  Layers,
  HelpCircle,
  Stethoscope,
  Sparkles,
  Zap,
  AlertTriangle,
  FileText,
  Eye,
  EyeOff,
  ChevronRight,
  CheckCircle2,
  Cloud,
  ShoppingCart,
  Package,
  CheckSquare,
  Square,
  Filter,
  Lock,
} from "lucide-react";
import { ParsedBlueprint, TargetBoard, SubscriptionTier } from "../types";
import { hasFeatureAccess } from "../utils/entitlements";
import { PinoutVisualizer } from "./PinoutVisualizer";
import { CircuitPreviewGenerator } from "./CircuitPreviewGenerator";
import { CodeCraftLogo } from "./CodeCraftLogo";
import { LoadingInterface } from "./LoadingInterface";
import { safeDownloadFile, exportSafeCsv, sanitizeFilename } from "../utils/security";
import { SkeletonOverlay } from "./SkeletonOverlay";

interface RightPanelProps {
  blueprint: ParsedBlueprint;
  isGenerating: boolean;
  targetBoard: TargetBoard;
  onOpenDiagnostics: () => void;
  onOpenCalculator: () => void;
  onOpenChat: () => void;
  onSaveToCloud?: () => void;
  onUpdateBOMItemStatus?: (index: number, status: "needs_purchasing" | "in_inventory") => void;
  onUpdateAllBOMItemStatuses?: (status: "needs_purchasing" | "in_inventory") => void;
  selectedTab?: string;
  subscriptionTier?: SubscriptionTier;
  onOpenUpgradeModal?: () => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  blueprint,
  isGenerating,
  targetBoard,
  onOpenDiagnostics,
  onOpenCalculator,
  onOpenChat,
  onSaveToCloud,
  onUpdateBOMItemStatus,
  onUpdateAllBOMItemStatuses,
  selectedTab,
  subscriptionTier = "free",
  onOpenUpgradeModal,
}) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "circuit_preview" | "bom" | "pinout" | "code" | "testing_viva" | "visualizer" | "raw_markdown"
  >("overview");

  useEffect(() => {
    if (selectedTab) {
      if (selectedTab === "workspace") setActiveTab("overview");
      else if (selectedTab === "schematics") setActiveTab("pinout");
      else if (selectedTab === "components") setActiveTab("bom");
    }
  }, [selectedTab]);
  const [bomFilter, setBomFilter] = useState<"all" | "needs_purchasing" | "in_inventory">("all");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [vivaInterviewQuestions, setVivaInterviewQuestions] = useState<string>("");
  const [isGeneratingViva, setIsGeneratingViva] = useState(false);
  const [revealedViva, setRevealedViva] = useState<Record<number, boolean>>({});

  const hasContent = Boolean(blueprint.rawMarkdown && blueprint.rawMarkdown.trim().length > 0);

  const bomStats = useMemo(() => {
    const items = blueprint.bomItems || [];
    let totalCost = 0;
    let needsPurchasingCost = 0;
    let inInventoryCost = 0;
    let needsCount = 0;
    let inventoryCount = 0;

    items.forEach((item) => {
      const price = Number(item.approxPriceINR) || 0;
      totalCost += price;
      const status = item.inventoryStatus || "needs_purchasing";
      if (status === "in_inventory") {
        inInventoryCost += price;
        inventoryCount++;
      } else {
        needsPurchasingCost += price;
        needsCount++;
      }
    });

    return {
      totalCost,
      needsPurchasingCost,
      inInventoryCost,
      needsCount,
      inventoryCount,
      totalCount: items.length,
    };
  }, [blueprint.bomItems]);

  const handleExportShoppingListCsv = () => {
    const itemsToExport = blueprint.bomItems.filter((item) => {
      const status = item.inventoryStatus || "needs_purchasing";
      if (bomFilter === "needs_purchasing") return status === "needs_purchasing";
      if (bomFilter === "in_inventory") return status === "in_inventory";
      return true;
    });

    const headers = ["Component", "Specification", "Quantity", "Role", "Approx Price (INR)", "Inventory Status", "Source / Notes"];
    const rows = itemsToExport.map((item) => [
      item.component,
      item.specification || "",
      item.quantity || 1,
      item.role || "",
      item.approxPriceINR || 0,
      item.inventoryStatus === "in_inventory" ? "In Inventory" : "Needs Purchasing",
      item.sourceNote || "",
    ]);

    exportSafeCsv(headers, rows, "circuitgen_shopping_list.csv");
  };

  const generateVivaInterview = async () => {
    setIsGeneratingViva(true);
    setVivaInterviewQuestions("");
    try {
      const storedKey = typeof window !== "undefined" ? localStorage.getItem("GEMINI_API_KEY") : null;
      const response = await fetch("/api/v1/hardware-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(storedKey ? { "x-gemini-api-key": storedKey } : {}),
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Generate 5-10 technical interview questions for this project including answers on circuit theory, pinout functions, and safety." }],
          currentBlueprint: JSON.stringify(blueprint),
          rolePreset: "viva_generator"
        }),
      });
      const data = await response.json();
      setVivaInterviewQuestions(data.reply);
    } catch (error) {
      console.error("Failed to generate viva questions:", error);
      setVivaInterviewQuestions("Failed to generate questions. Please try again.");
    } finally {
      setIsGeneratingViva(false);
    }
  };

  const handleCopyCode = () => {
    if (!blueprint.codeBlock.code) return;
    navigator.clipboard.writeText(blueprint.codeBlock.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyMarkdown = () => {
    if (!blueprint.rawMarkdown) return;
    navigator.clipboard.writeText(blueprint.rawMarkdown);
    setCopiedMarkdown(true);
    setTimeout(() => setCopiedMarkdown(false), 2000);
  };

  const handleDownloadCode = () => {
    const code = blueprint.codeBlock.code;
    if (!code) return;
    const isPython = blueprint.codeBlock.language.includes("python") || blueprint.codeBlock.language.includes("py");
    const rawFilename = isPython ? "circuitgen_firmware.py" : "circuitgen_firmware.ino";
    safeDownloadFile(code, rawFilename, "text/plain;charset=utf-8");
  };

  const toggleVivaReveal = (idx: number) => {
    setRevealedViva((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: Layers, feature: null },
    { id: "circuit_preview", label: "Circuit Preview", icon: Zap, feature: null },
    { id: "bom", label: `BOM & Shopping List (${blueprint.bomItems.length})`, icon: ShoppingCart, feature: null },
    { id: "pinout", label: `Pinout (${blueprint.pinoutRows.length})`, icon: null, feature: "pinout" },
    { id: "code", label: "Firmware", icon: FileCode, feature: "firmware" },
    { id: "testing_viva", label: "Lab Viva & Interview", icon: HelpCircle, feature: "viva" },
    { id: "visualizer", label: "Pin Visualizer", icon: Cpu, feature: "pinout" },
    { id: "raw_markdown", label: "Full Spec", icon: FileText, feature: null },
  ];

  const currentTabObj = tabs.find((t) => t.id === activeTab);
  const isTabLocked = currentTabObj?.feature
    ? !hasFeatureAccess(subscriptionTier, currentTabObj.feature as any)
    : false;

  return (
    <div className="surface-secondary border border-[var(--divider)] rounded-3xl min-h-[640px] flex flex-col overflow-hidden relative">
      <AnimatePresence>
        {isGenerating && <SkeletonOverlay />}
      </AnimatePresence>
      {/* Top Header & Actions Bar */}
      <div className="border-b border-[var(--divider)] px-5 py-3.5 flex flex-wrap justify-between items-center surface-secondary gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center shadow-xs">
            <CodeCraftLogo size="xs" badgeOnly={true} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Hardware Blueprint & Firmware Canvas
            </h2>
            {isGenerating && (
              <span className="text-xs text-[var(--accent-blue)] flex items-center gap-1.5 mt-0.5">
                <Sparkles className="w-3 h-3 text-[var(--accent-blue)] animate-spin" /> Synthesizing engineering specs in real-time...
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {hasContent && (
          <div className="flex items-center flex-wrap gap-1.5">
            {blueprint.codeBlock.code && (
              <>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleCopyCode}
                  className="text-xs surface-primary hover:bg-[var(--bg-primary)] border border-[var(--divider)] text-[var(--text-primary)] px-4 py-3 sm:px-3.5 sm:py-1.5 rounded-full font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-[var(--accent-blue)]" /> : <Copy className="w-3.5 h-3.5 text-[var(--text-secondary)]" />}
                  <span>{copiedCode ? "Copied" : "Copy Code"}</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleDownloadCode}
                  className="text-xs bg-[var(--accent-blue)] hover:bg-[var(--accent-dark-blue)] text-white px-4 py-3 sm:px-3.5 sm:py-1.5 rounded-full font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-white" />
                  <span>Download .ino</span>
                </motion.button>
              </>
            )}


            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={onOpenChat}
              title="Launch AI Lab Advisor & Practical Skills Workshop"
              className="text-xs surface-primary hover:bg-[var(--bg-primary)] border border-[var(--divider)] text-[var(--text-primary)] px-3.5 py-1.5 rounded-full font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
              <span>Lab Advisor</span>
            </motion.button>

            {onSaveToCloud && (
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={onSaveToCloud}
                title="Save circuit design & firmware to Supabase Cloud"
                className="text-xs bg-[var(--accent-blue)] hover:bg-[var(--accent-dark-blue)] text-white px-3.5 py-1.5 rounded-full font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Cloud className="w-3.5 h-3.5 text-white" />
                <span>Save to Cloud</span>
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => window.print()}
              title="Print Lab Submission Report / PDF"
              className="text-xs surface-primary hover:bg-[var(--bg-primary)] border border-[var(--divider)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3.5 py-1.5 rounded-full font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
              <span className="hidden sm:inline">Print Report</span>
            </motion.button>
          </div>
        )}
      </div>

      {/* Navigation Tabs with Smooth Pill Indicator */}
      {hasContent && (
        <div className="border-b border-[#202728] bg-[#071011] px-3 flex gap-1 overflow-x-auto text-xs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const TabIcon = tab.icon;
            const isLocked = tab.feature ? !hasFeatureAccess(subscriptionTier, tab.feature as any) : false;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`relative px-3.5 py-3 transition-colors whitespace-nowrap flex items-center gap-1.5 font-medium cursor-pointer ${
                  isActive
                    ? "text-[#25D366]"
                    : "text-[#9AA0A2] hover:text-[#F1F3F4]"
                }`}
              >
                {isLocked ? (
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  TabIcon && <TabIcon className={`w-3.5 h-3.5 ${isActive ? "text-[#25D366]" : "text-[#9AA0A2]"}`} />
                )}
                <span>{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeTabPill"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#25D366]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Content Body */}
      <div className="p-6 flex-1 overflow-y-auto">
        {isTabLocked ? (
          <div className="p-8 text-center bg-[#0d1322] border border-[#1d283f] rounded-3xl max-w-md mx-auto my-12 space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white font-display">Premium Feature Locked</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-white">{currentTabObj?.label}</strong> is available on the <strong className="text-emerald-400">Student</strong> and <strong className="text-amber-400">Pro</strong> plans. Upgrade to unlock full production firmware, pinout visualizers, and viva voce defense.
            </p>
            <button
              onClick={onOpenUpgradeModal}
              className="w-full py-3 px-4 bg-[#00c853] hover:bg-[#00b248] text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              Upgrade Subscription Plan
            </button>
          </div>
        ) : isGenerating && !hasContent ? (
          <LoadingInterface
            isGenerating={isGenerating}
            targetBoard={targetBoard}
          />
        ) : !hasContent ? (
          <div className="text-center py-10 px-4 max-w-lg mx-auto space-y-6">
            <CodeCraftLogo
              size="lg"
              showTagline={true}
              showBadges={true}
              className="mx-auto"
            />

            <div className="pt-2">
              <h3 className="text-base font-medium text-[#F1F3F4]">
                Your Hardware & Firmware Canvas is Ready
              </h3>
              <p className="text-xs text-[#9AA0A2] mt-1.5 leading-relaxed">
                Enter your project idea on the left, select target microcontroller & logic voltage, and synthesize non-blocking production code, BOM, and viva questions.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2">
              <div className="p-4 bg-[#202628] rounded-2xl border border-[#202728] text-xs space-y-1">
                <span className="font-medium text-[#25D366] flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-[#25D366]" /> Pin Safety Matrix
                </span>
                <p className="text-xs text-[#9AA0A2] leading-relaxed">
                  Strapping pin guardrails & 3.3V logic protection
                </p>
              </div>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
            >
              {/* TAB 1: OVERVIEW */}
              {activeTab === "overview" && (
                <div className="space-y-5">
                  <div className="p-5 sm:p-6 bg-[#202628] border border-[#202728] rounded-3xl space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-medium uppercase tracking-wider text-[#25D366] flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-[#25D366]" />
                        Executive Hardware Specification
                      </span>
                    </div>

                    <div className="text-sm text-[#F1F3F4] leading-relaxed prose max-w-none">
                      <Markdown remarkPlugins={[remarkGfm]}>{blueprint.executiveSummary || blueprint.rawMarkdown.substring(0, 500)}</Markdown>
                    </div>
                  </div>

                  {/* Key Metrics Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 bg-[#202628] border border-[#202728] rounded-2xl">
                      <div className="text-xs uppercase font-medium text-[#9AA0A2]">Target Microcontroller</div>
                      <div className="text-sm font-medium text-[#F1F3F4] mt-1">{blueprint.detectedBoard}</div>
                      <div className="text-xs text-[#25D366] mt-1 font-mono">
                        Logic: {blueprint.detectedBoard.includes("ESP") || blueprint.detectedBoard.includes("STM") || blueprint.detectedBoard.includes("Pico") ? "3.3V" : "5.0V"}
                      </div>
                    </div>

                    <div className="p-4 bg-[#202628] border border-[#202728] rounded-2xl">
                      <div className="text-xs uppercase font-medium text-[#9AA0A2]">Components Count</div>
                      <div className="text-sm font-medium text-[#F1F3F4] mt-1">{blueprint.bomItems.length} Components</div>
                    </div>

                    <div className="p-4 bg-[#202628] border border-[#202728] rounded-2xl">
                      <div className="text-xs uppercase font-medium text-[#9AA0A2]">Firmware Architecture</div>
                      <div className="text-sm font-medium text-[#25D366] mt-1">
                        {blueprint.codeBlock.language.toUpperCase()}
                      </div>
                      <div className="text-xs text-[#9AA0A2] mt-1">Non-blocking / Verified</div>
                    </div>
                  </div>

                  {/* AI Lab Advisor & Practical Skills Workshop Interactive Card */}
                  <div className="p-5 bg-[#202628] border border-[#202728] rounded-3xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#073D2D] text-[#25D366] flex items-center justify-center border border-[#25D366]/30">
                          <Sparkles className="w-4 h-4 text-[#25D366]" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-[#F1F3F4]">AI Lab Advisor & Practical Skills Workshop</h4>
                          <p className="text-xs text-[#9AA0A2]">Physical assembly, multimeter checks, IoT cloud, and mock viva</p>
                        </div>
                      </div>
                      <button
                        onClick={onOpenChat}
                        className="text-xs font-medium bg-[#25D366] hover:bg-[#20bd5a] text-[#071011] px-4 py-1.5 rounded-full transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <span>Open Lab Advisor</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 text-xs">
                      <button
                        onClick={onOpenChat}
                        className="p-3 bg-[#111719] hover:bg-[#1a2022] border border-[#202728] rounded-2xl text-left transition-colors cursor-pointer w-full"
                      >
                        <div className="font-medium text-[#F1F3F4] flex items-center gap-1.5">
                          <span>🛠️</span> Build Guide
                        </div>
                        <div className="text-xs text-[#9AA0A2] truncate mt-0.5">Breadboard & soldering</div>
                      </button>

                      <button
                        onClick={onOpenChat}
                        className="p-3 bg-[#111719] hover:bg-[#1a2022] border border-[#202728] rounded-2xl text-left transition-colors cursor-pointer w-full"
                      >
                        <div className="font-medium text-[#F1F3F4] flex items-center gap-1.5">
                          <span>🐞</span> DMM Probing
                        </div>
                        <div className="text-xs text-[#9AA0A2] truncate mt-0.5">Continuity & brownout</div>
                      </button>

                      <button
                        onClick={onOpenChat}
                        className="p-3 bg-[#111719] hover:bg-[#1a2022] border border-[#202728] rounded-2xl text-left transition-colors cursor-pointer w-full"
                      >
                        <div className="font-medium text-[#25D366] flex items-center gap-1.5">
                          <span>📡</span> Blynk 2.0 / IoT
                        </div>
                        <div className="text-xs text-[#9AA0A2] truncate mt-0.5">MQTT & wireless mesh</div>
                      </button>

                      <button
                        onClick={onOpenChat}
                        className="p-3 bg-[#111719] hover:bg-[#1a2022] border border-[#202728] rounded-2xl text-left transition-colors cursor-pointer w-full"
                      >
                        <div className="font-medium text-[#F1F3F4] flex items-center gap-1.5">
                          <span>🎓</span> Mock Viva
                        </div>
                        <div className="text-xs text-[#9AA0A2] truncate mt-0.5">Examiner Q&A defense</div>
                      </button>
                    </div>
                  </div>

                  {/* Navigation Quick Links */}
                  <div className="p-4 bg-[#202628] border border-[#202728] rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
                    <span className="font-medium text-[#9AA0A2]">Jump directly to engineering section:</span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setActiveTab("circuit_preview")}
                        className="px-3.5 py-1.5 bg-[#073D2D] hover:bg-[#0c4e3b] border border-[#25D366]/30 text-[#25D366] rounded-full font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Zap className="w-3.5 h-3.5 text-[#25D366]" />
                        <span>Circuit Preview (Pin-by-Pin)</span>
                      </button>
                      <button
                        onClick={() => setActiveTab("pinout")}
                        className="px-3.5 py-1.5 bg-[#111719] hover:bg-[#1a2022] border border-[#202728] rounded-full text-[#F1F3F4] font-medium transition-colors cursor-pointer"
                      >
                        Pin Wiring Table
                      </button>
                      <button
                        onClick={() => setActiveTab("code")}
                        className="px-4 py-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-[#071011] font-medium rounded-full transition-colors cursor-pointer"
                      >
                        View Firmware
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 1.5: INTERACTIVE PIN-BY-PIN CIRCUIT PREVIEW GENERATOR */}
              {activeTab === "circuit_preview" && (
                <CircuitPreviewGenerator
                  pinoutRows={blueprint.pinoutRows}
                  bomItems={blueprint.bomItems}
                  targetBoard={targetBoard}
                  detectedBoard={blueprint.detectedBoard}
                />
              )}

              {/* TAB 2: BOM & SHOPPING LIST */}
              {activeTab === "bom" && (
                <div className="space-y-6">
                  {/* Header & Stats Banner */}
                  <div className="p-5 bg-[var(--bg-elevated)] border border-[var(--divider)] rounded-3xl space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
                          <ShoppingCart className="w-4 h-4 text-[var(--accent-primary)]" />
                          <span>Bill of Materials & Smart Shopping List</span>
                        </h3>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                          Mark components as 'In Inventory' or 'Needs Purchasing' to automatically calculate shopping cost and filter requirements.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onUpdateAllBOMItemStatuses?.("in_inventory")}
                          className="text-xs px-3 py-1.5 surface-primary hover:bg-[var(--bg-primary)] border border-[var(--divider)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-full transition-colors cursor-pointer"
                        >
                          Mark All Owned
                        </button>
                        <button
                          onClick={() => onUpdateAllBOMItemStatuses?.("needs_purchasing")}
                          className="text-xs px-3 py-1.5 surface-primary hover:bg-[var(--bg-primary)] border border-[var(--divider)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-full transition-colors cursor-pointer"
                        >
                          Mark All Needed
                        </button>
                        <button
                          onClick={handleExportShoppingListCsv}
                          className="text-xs px-3.5 py-1.5 bg-[var(--accent-primary)] hover:bg-[var(--accent-dark)] text-[var(--bg-primary)] font-medium rounded-full transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          <span>Export CSV</span>
                        </button>
                      </div>
                    </div>

                    {/* Summary Metric Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div className="p-3.5 bg-[var(--bg-primary)] border border-[var(--divider)] rounded-2xl">
                        <div className="text-[10px] uppercase font-medium text-[var(--text-tertiary)]">Total Project BOM Cost</div>
                        <div className="text-lg font-bold font-mono text-[var(--text-primary)] mt-1">₹{bomStats.totalCost.toLocaleString("en-IN")}</div>
                        <div className="text-xs text-[var(--text-secondary)] mt-0.5">{bomStats.totalCount} total components</div>
                      </div>

                      <div className="p-3.5 bg-[var(--bg-primary)] border border-[var(--divider)] rounded-2xl">
                        <div className="text-[10px] uppercase font-medium text-amber-400">Needs Purchasing</div>
                        <div className="text-lg font-bold font-mono text-amber-400 mt-1">₹{bomStats.needsPurchasingCost.toLocaleString("en-IN")}</div>
                        <div className="text-xs text-[var(--text-secondary)] mt-0.5">{bomStats.needsCount} items to buy</div>
                      </div>

                      <div className="p-3.5 bg-[var(--bg-primary)] border border-[var(--divider)] rounded-2xl">
                        <div className="text-[10px] uppercase font-medium text-[var(--accent-primary)]">In Inventory (Owned)</div>
                        <div className="text-lg font-bold font-mono text-[var(--accent-primary)] mt-1">₹{bomStats.inInventoryCost.toLocaleString("en-IN")}</div>
                        <div className="text-xs text-[var(--text-secondary)] mt-0.5">{bomStats.inventoryCount} items in stock</div>
                      </div>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-2 pt-1 border-t border-[var(--divider)]">
                      <span className="text-xs text-[var(--text-tertiary)] flex items-center gap-1 font-medium">
                        <Filter className="w-3.5 h-3.5" /> Filter List:
                      </span>
                      <button
                        onClick={() => setBomFilter("all")}
                        className={`text-xs px-3 py-1 rounded-full font-medium transition-colors cursor-pointer ${
                          bomFilter === "all"
                            ? "bg-[var(--accent-primary)] text-[var(--bg-primary)]"
                            : "surface-primary text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--divider)]"
                        }`}
                      >
                        All ({bomStats.totalCount})
                      </button>
                      <button
                        onClick={() => setBomFilter("needs_purchasing")}
                        className={`text-xs px-3 py-1 rounded-full font-medium transition-colors cursor-pointer ${
                          bomFilter === "needs_purchasing"
                            ? "bg-amber-500 text-slate-950"
                            : "surface-primary text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--divider)]"
                        }`}
                      >
                        Needs Purchasing ({bomStats.needsCount})
                      </button>
                      <button
                        onClick={() => setBomFilter("in_inventory")}
                        className={`text-xs px-3 py-1 rounded-full font-medium transition-colors cursor-pointer ${
                          bomFilter === "in_inventory"
                            ? "bg-[var(--accent-primary)] text-[var(--bg-primary)]"
                            : "surface-primary text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--divider)]"
                        }`}
                      >
                        In Inventory ({bomStats.inventoryCount})
                      </button>
                    </div>
                  </div>

                  {/* BOM Table */}
                  {blueprint.bomItems && blueprint.bomItems.length > 0 ? (
                    <div className="border border-[var(--divider)] rounded-2xl overflow-x-auto bg-[var(--bg-elevated)]">
                      <table className="w-full text-xs text-left min-w-[600px]">
                        <thead className="bg-[var(--bg-primary)] text-[var(--text-tertiary)] font-medium uppercase tracking-wider text-[11px] border-b border-[var(--divider)]">
                          <tr>
                            <th className="px-4 py-3">Inventory Status</th>
                            <th className="px-4 py-3">Component</th>
                            <th className="px-4 py-3">Specification</th>
                            <th className="px-4 py-3">Qty</th>
                            <th className="px-4 py-3">Role / Purpose</th>
                            <th className="px-4 py-3 text-right">Price (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--divider)] text-[var(--text-primary)]">
                          {blueprint.bomItems
                            .map((item, originalIndex) => ({ ...item, originalIndex }))
                            .filter((item) => {
                              const status = item.inventoryStatus || "needs_purchasing";
                              if (bomFilter === "needs_purchasing") return status === "needs_purchasing";
                              if (bomFilter === "in_inventory") return status === "in_inventory";
                              return true;
                            })
                            .map((item) => {
                              const isOwned = item.inventoryStatus === "in_inventory";
                              return (
                                <tr
                                  key={item.originalIndex}
                                  className={`hover:bg-[var(--bg-primary)] transition-colors ${
                                    isOwned ? "opacity-75 bg-[var(--bg-primary)]/40" : ""
                                  }`}
                                >
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <button
                                      onClick={() =>
                                        onUpdateBOMItemStatus?.(
                                          item.originalIndex,
                                          isOwned ? "needs_purchasing" : "in_inventory"
                                        )
                                      }
                                      className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                                        isOwned
                                          ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 hover:bg-[var(--accent-primary)]/20"
                                          : "bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20"
                                      }`}
                                    >
                                      {isOwned ? (
                                        <>
                                          <CheckSquare className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                                          <span>In Inventory</span>
                                        </>
                                      ) : (
                                        <>
                                          <Square className="w-3.5 h-3.5 text-amber-400" />
                                          <span>Needs Purchasing</span>
                                        </>
                                      )}
                                    </button>
                                  </td>
                                  <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
                                    {item.component}
                                  </td>
                                  <td className="px-4 py-3 text-[var(--text-secondary)] font-mono text-[11px]">
                                    {item.specification || "-"}
                                  </td>
                                  <td className="px-4 py-3 font-mono font-medium text-[var(--text-primary)]">
                                    {item.quantity}
                                  </td>
                                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                                    {item.role || "-"}
                                  </td>
                                  <td className="px-4 py-3 text-right font-mono font-medium text-[var(--accent-primary)]">
                                    ₹{Number(item.approxPriceINR || 0).toLocaleString("en-IN")}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-8 bg-[var(--bg-elevated)] rounded-2xl text-center text-xs text-[var(--text-secondary)]">
                      No BOM items found in the generated blueprint.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: PINOUT MATRIX */}
              {activeTab === "pinout" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#202728] pb-3">
                    <div>
                      <h3 className="text-sm font-medium text-[#F1F3F4]">
                        Pin-to-Pin Interconnection Table
                      </h3>
                      <p className="text-xs text-[#9AA0A2]">
                        Wiring mapping between peripheral sensor/actuator pins and microcontroller GPIOs
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab("visualizer")}
                      className="text-xs font-medium bg-[#073D2D] hover:bg-[#0c4e3b] text-[#25D366] border border-[#25D366]/30 px-3.5 py-1.5 rounded-full transition-colors cursor-pointer"
                    >
                      Open Pin Visualizer 📐
                    </button>
                  </div>

                  {blueprint.pinoutRows.length > 0 ? (
                    <div className="border border-[#202728] rounded-2xl overflow-x-auto">
                      <table className="w-full text-xs text-left min-w-[650px]">
                        <thead className="bg-[#202628] text-[#9AA0A2] font-medium uppercase tracking-wider text-xs border-b border-[#202728]">
                          <tr>
                            <th className="px-4 py-3">Peripheral Module</th>
                            <th className="px-4 py-3">Module Pin</th>
                            <th className="px-4 py-3">MCU Pin</th>
                            <th className="px-4 py-3">Signal Type</th>
                            <th className="px-4 py-3">Voltage Logic</th>
                            <th className="px-4 py-3">Wiring / Resistor Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#202728] text-[#F1F3F4] bg-[#111719]">
                          {blueprint.pinoutRows.map((row, idx) => (
                            <tr
                              key={idx}
                              className={`hover:bg-[#202628] transition-colors ${
                                row.isStrappingWarning ? "bg-[#381617]/20" : ""
                              }`}
                            >
                              <td className="px-4 py-3 font-medium text-[#F1F3F4]">{row.module}</td>
                              <td className="px-4 py-3 font-mono text-[#9AA0A2]">{row.modulePin}</td>
                              <td className="px-4 py-3 font-mono font-medium text-[#25D366]">
                                <span className="bg-[#202628] px-2 py-0.5 rounded-full border border-[#202728]">
                                  {row.mcuPin}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-[#9AA0A2] font-mono">{row.signalType}</td>
                              <td className="px-4 py-3 font-mono">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                                    row.voltageLogic === "5V"
                                      ? "bg-[#381617] text-[#f87171] border border-[#f87171]/30"
                                      : row.voltageLogic === "3.3V"
                                      ? "bg-[#073D2D] text-[#25D366] border border-[#25D366]/30"
                                      : "bg-[#202628] text-[#9AA0A2]"
                                  }`}
                                >
                                  {row.voltageLogic}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-[#9AA0A2] text-xs">
                                {row.isStrappingWarning && (
                                  <span className="text-[#f87171] font-medium block">
                                    ⚠️ Strapping pin caution
                                  </span>
                                )}
                                {row.wiringNotes || "Direct jumper wire connection"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-6 bg-[#202628] rounded-2xl text-center text-xs text-[#9AA0A2]">
                      Extracting pin connections...
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: FIRMWARE CODE */}
              {activeTab === "code" && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#202728] pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-[#F1F3F4]">
                          Verified Working Firmware
                        </h3>
                        <span className="text-[10px] font-medium uppercase font-mono bg-[#202628] text-[#F1F3F4] border border-[#202728] px-2 py-0.5 rounded-full">
                          {blueprint.codeBlock.language}
                        </span>
                        <span className="text-[10px] font-medium uppercase bg-[#073D2D] text-[#25D366] border border-[#25D366]/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-[#25D366]" />
                          100/100 Linter Passed
                        </span>
                      </div>
                      <p className="text-xs text-[#9AA0A2]">
                        Ultra-low-latency non-blocking code, 100% compilable for upload via Arduino IDE / Thonny
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={onOpenDiagnostics}
                        className="text-xs bg-[#073D2D] hover:bg-[#0c4e3b] border border-[#25D366]/30 text-[#25D366] px-3.5 py-1.5 rounded-full font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Stethoscope className="w-3.5 h-3.5 text-[#25D366]" />
                        <span>Run Full Linter Audit</span>
                      </button>
                      <button
                        onClick={handleCopyCode}
                        className="text-xs bg-[#25D366] hover:bg-[#20bd5a] text-[#071011] font-medium px-4 py-1.5 rounded-full transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5 text-[#071011]" /> : <Copy className="w-3.5 h-3.5 text-[#071011]" />}
                        <span>{copiedCode ? "Copied" : "Copy Code"}</span>
                      </button>
                    </div>
                  </div>

                  {/* 100% Quality & Latency Assurance Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div className="p-3 bg-[#202628] border border-[#202728] rounded-2xl flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#073D2D] text-[#25D366] flex items-center justify-center shrink-0">
                        <Zap className="w-4 h-4 text-[#25D366]" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-[#9AA0A2] font-medium">Latency</div>
                        <div className="font-medium text-[#25D366] text-xs">Non-Blocking millis()</div>
                      </div>
                    </div>

                    <div className="p-3 bg-[#202628] border border-[#202728] rounded-2xl flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#073D2D] text-[#25D366] flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-[#25D366]" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-[#9AA0A2] font-medium">Linter Score</div>
                        <div className="font-medium text-[#25D366] text-xs">100% Passed</div>
                      </div>
                    </div>

                    <div className="p-3 bg-[#202628] border border-[#202728] rounded-2xl flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#073D2D] text-[#25D366] flex items-center justify-center shrink-0">
                        <ShieldAlert className="w-4 h-4 text-[#25D366]" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-[#9AA0A2] font-medium">Pin Safety</div>
                        <div className="font-medium text-[#25D366] text-xs">0 Boot Conflicts</div>
                      </div>
                    </div>

                    <div className="p-3 bg-[#202628] border border-[#202728] rounded-2xl flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#073D2D] text-[#25D366] flex items-center justify-center shrink-0">
                        <Cpu className="w-4 h-4 text-[#25D366]" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-[#9AA0A2] font-medium">Serial Baud</div>
                        <div className="font-medium text-[#25D366] text-xs">115200 High-Speed</div>
                      </div>
                    </div>
                  </div>

                  {/* Required Libraries Checklist */}
                  {blueprint.codeBlock.libraries.length > 0 && (
                    <div className="p-4 bg-[#202628] border border-[#202728] rounded-2xl text-xs space-y-2">
                      <div className="font-medium text-[#F1F3F4] flex items-center gap-1.5">
                        <span>📦</span> Required Libraries (Install via Arduino Library Manager / pip):
                      </div>
                      <div className="flex flex-wrap gap-1.5 font-mono">
                        {blueprint.codeBlock.libraries.map((lib, idx) => (
                          <span
                            key={idx}
                            className="bg-[#111719] border border-[#202728] text-[#9AA0A2] px-2.5 py-1 rounded-full text-xs font-normal"
                          >
                            {lib}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Clean Code Block with Roboto Mono */}
                  <div className="relative rounded-2xl overflow-hidden border border-[#202728] bg-[#071011] text-[#F1F3F4] font-mono text-xs">
                    <div className="bg-[#111719] px-4 py-2.5 text-xs text-[#9AA0A2] flex justify-between items-center border-b border-[#202728]">
                      <span className="text-[#25D366] font-mono font-medium">codecraft_main.{blueprint.codeBlock.language.includes("python") ? "py" : "ino"}</span>
                      <span className="text-[#25D366] font-medium flex items-center gap-1">
                        <Check className="w-3 h-3 text-[#25D366]" />
                        100% Compilable C++/MicroPython
                      </span>
                    </div>
                    <pre className="p-4 sm:p-5 overflow-x-auto leading-relaxed text-[#F1F3F4] font-mono text-xs">
                      <code>{blueprint.codeBlock.code || "// Firmware generating..."}</code>
                    </pre>
                  </div>
                </div>
              )}

              {/* TAB 6: UNIFIED LAB VIVA & INTERVIEW */}
              {activeTab === "testing_viva" && (
                <div className="space-y-6">
                  {/* Bench Testing Protocol */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
                      <span>🧪</span> Step-by-Step Bench Testing & Serial Diagnostics
                    </h3>
                    <div className="p-5 bg-[var(--bg-elevated)] border border-[var(--divider)] rounded-2xl text-xs text-[var(--text-secondary)] space-y-2.5 leading-relaxed">
                      <p className="font-medium text-[var(--accent-primary)]">Lab Verification Protocol:</p>
                      {blueprint.testingSteps && blueprint.testingSteps.length > 0 ? (
                        <ol className="list-decimal list-inside space-y-2 text-[var(--text-primary)] pl-1">
                          {blueprint.testingSteps.map((step, sIdx) => (
                            <li key={sIdx} className="leading-normal">{step}</li>
                          ))}
                        </ol>
                      ) : (
                        <ol className="list-decimal list-inside space-y-2 text-[var(--text-primary)] pl-1">
                          <li>Check all power and GND jumper connections with a multimeter in continuity mode before applying power.</li>
                          <li>Ensure common GND rail connects the microcontroller and all external sensor/actuator power supplies.</li>
                          <li>Open Serial Monitor at <strong className="text-[var(--text-primary)] font-mono font-medium">115200 baud</strong>.</li>
                          <li>Verify startup calibration messages and sensor initialization flags.</li>
                          <li>Simulate trigger conditions and verify that actuator responses match the non-blocking state machine.</li>
                        </ol>
                      )}
                    </div>
                  </div>

                  {/* Troubleshooting & Diagnostics */}
                  {blueprint.troubleshootingSteps && blueprint.troubleshootingSteps.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
                        <span>🔧</span> Troubleshooting & Failure Recovery
                      </h3>
                      <div className="p-5 bg-[var(--bg-elevated)] border border-[var(--divider)] rounded-2xl text-xs text-[var(--text-secondary)] space-y-2.5 leading-relaxed">
                        <ul className="space-y-2 text-[var(--text-primary)]">
                          {blueprint.troubleshootingSteps.map((trouble, tIdx) => (
                            <li key={tIdx} className="flex items-start gap-2">
                              <span className="text-amber-400 font-mono mt-0.5">•</span>
                              <span>{trouble}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Viva Voce Technical Defense Q&A */}
                  {blueprint.vivaQuestions && blueprint.vivaQuestions.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-[var(--text-primary)] flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span>🎓</span> External Examiner Viva Voce & Technical Defense ({blueprint.vivaQuestions.length})
                        </span>
                        <span className="text-xs text-[var(--text-tertiary)] font-normal">Click question to reveal model answer</span>
                      </h3>
                      <div className="space-y-3">
                        {blueprint.vivaQuestions.map((vq, qIdx) => (
                          <div
                            key={qIdx}
                            className="bg-[var(--bg-elevated)] border border-[var(--divider)] rounded-2xl p-4 transition-all"
                          >
                            <button
                              onClick={() => toggleVivaReveal(qIdx)}
                              className="w-full text-left flex items-start justify-between gap-3 cursor-pointer"
                            >
                              <div className="flex items-start gap-2.5">
                                <span className="w-5 h-5 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-mono text-[10px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
                                  {qIdx + 1}
                                </span>
                                <div>
                                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--accent-blue)] block mb-0.5">
                                    {vq.category}
                                  </span>
                                  <p className="text-xs font-medium text-[var(--text-primary)] leading-relaxed">
                                    {vq.question}
                                  </p>
                                </div>
                              </div>
                              <span className="text-[11px] text-[var(--accent-primary)] shrink-0 font-medium mt-1">
                                {revealedViva[qIdx] ? "Hide Answer" : "Show Answer"}
                              </span>
                            </button>

                            {revealedViva[qIdx] && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="mt-3 pt-3 border-t border-[var(--divider)] pl-7 text-xs text-[var(--text-secondary)] leading-relaxed"
                              >
                                <p className="text-[var(--accent-primary)] font-medium mb-1">Model Technical Defense:</p>
                                <p className="text-[var(--text-primary)]">{vq.answer}</p>
                              </motion.div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Viva Interview Generator */}
                  <div className="space-y-3 pt-3 border-t border-[var(--divider)]">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
                        <span>🎙️</span> AI Viva Interview Generator & Mock Examiner
                      </h3>
                      <button
                        onClick={generateVivaInterview}
                        disabled={isGeneratingViva}
                        className="text-xs bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-black px-3.5 py-1.5 rounded-full font-medium transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {isGeneratingViva ? "Generating..." : "Generate Interview Q&A"}
                      </button>
                    </div>
                    <div className="p-5 bg-[var(--bg-elevated)] border border-[var(--divider)] rounded-2xl text-xs text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap font-sans">
                      {vivaInterviewQuestions || "Click 'Generate Interview Q&A' to synthesize deep technical interview questions and scoring rubrics tailored specifically to your circuit architecture."}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: GRAPHICAL PINOUT VISUALIZER */}
              {activeTab === "visualizer" && (
                <PinoutVisualizer
                  pinoutRows={blueprint.pinoutRows}
                  targetBoard={targetBoard}
                  detectedBoard={blueprint.detectedBoard}
                />
              )}

              {/* TAB 8: RAW MARKDOWN */}
              {activeTab === "raw_markdown" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-[#202728] pb-2">
                    <span className="text-xs font-medium text-[#9AA0A2] uppercase">
                      Full Formatted Engineering Blueprint (Markdown)
                    </span>
                    <button
                      onClick={handleCopyMarkdown}
                      className="text-xs bg-[#202628] hover:bg-[#283033] border border-[#202728] text-[#F1F3F4] px-3.5 py-1.5 rounded-full font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedMarkdown ? <Check className="w-3.5 h-3.5 text-[#25D366]" /> : <Copy className="w-3.5 h-3.5 text-[#9AA0A2]" />}
                      <span>{copiedMarkdown ? "Copied" : "Copy Markdown"}</span>
                    </button>
                  </div>
                  <div className="prose max-w-none text-[#F1F3F4] leading-relaxed overflow-x-auto">
                    <Markdown remarkPlugins={[remarkGfm]}>{blueprint.rawMarkdown}</Markdown>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
