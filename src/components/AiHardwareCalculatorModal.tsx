import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calculator,
  Sparkles,
  Zap,
  Battery,
  Lightbulb,
  Cpu,
  X,
  Copy,
  Check,
  Send,
  AlertTriangle,
  CheckCircle2,
  Layers,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  PlusCircle,
  HelpCircle,
  Clock,
  Radio,
  Sliders,
  Palette,
} from "lucide-react";
import { TargetBoard } from "../types";
import { ResistorColorTool } from "./ResistorColorTool";

export type CalculatorTab =
  | "ai_solver"
  | "resistor_color"
  | "ohms_law"
  | "voltage_divider"
  | "led_resistor"
  | "battery_life"
  | "rc_filter"
  | "shunt_current";

export interface AiHardwareCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetBoard?: TargetBoard;
  currentProjectIdea?: string;
  onApplyToProject?: (textToAppend: string) => void;
  apiKey?: string;
  initialTab?: CalculatorTab;
}

interface AiCalculationResult {
  title: string;
  primaryFormula: string;
  inputs?: Array<{ name: string; value: string; unit: string }>;
  calculatedResults: Array<{ label: string; value: string; unit: string; isPrimary?: boolean }>;
  stepByStep?: string[];
  standardComponents?: Array<{ type: string; recommendedValue: string; series?: string; wattageRating?: string }>;
  safetyNotes?: string;
  engineeringTip?: string;
  promptSnippet?: string;
}

const AI_PRESET_PROMPTS = [
  "Calculate LED series resistor for 5V supply with 2.2V 20mA Red LED",
  "Calculate shunt resistor to measure up to 5 Amps using ESP32 3.3V ADC",
  "How long will a 2500mAh 18650 battery power an ESP32 drawing 160mA for 5s every 10 mins (sleep 15µA)?",
  "Calculate I2C pull-up resistor value for 400kHz Fast Mode with 120pF bus capacitance",
  "Calculate voltage divider to step down 12V solar panel to 3.3V ADC pin with low current",
  "Calculate RC debounce filter for mechanical pushbutton with 15ms debounce time",
];

const LED_PRESETS = [
  { name: "Red (Standard)", vf: 2.0, if: 20 },
  { name: "Yellow / Amber", vf: 2.1, if: 20 },
  { name: "Green (Standard)", vf: 2.2, if: 20 },
  { name: "Green (High Brightness)", vf: 3.0, if: 20 },
  { name: "Blue / Bright White", vf: 3.2, if: 20 },
  { name: "Infrared (IR 940nm)", vf: 1.3, if: 50 },
  { name: "UV / Purple", vf: 3.4, if: 20 },
];

const BATTERY_PRESETS = [
  { name: "18650 Li-ion Cell", capacity: 2600, voltage: 3.7 },
  { name: "LiPo Single Cell", capacity: 1200, voltage: 3.7 },
  { name: "2x AA Alkaline (Series)", capacity: 2400, voltage: 3.0 },
  { name: "9V Alkaline Block", capacity: 550, voltage: 9.0 },
  { name: "CR2032 Coin Cell", capacity: 220, voltage: 3.0 },
  { name: "10,000mAh Power Bank", capacity: 10000, voltage: 5.0 },
];

export const AiHardwareCalculatorModal: React.FC<AiHardwareCalculatorModalProps> = ({
  isOpen,
  onClose,
  targetBoard = "ESP32 (WROOM-32)",
  currentProjectIdea = "",
  onApplyToProject,
  apiKey = "",
  initialTab,
}) => {
  const [activeTab, setActiveTab] = useState<CalculatorTab>(initialTab || "ai_solver");

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  // AI Solver State
  const [aiQuery, setAiQuery] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AiCalculationResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [copiedAi, setCopiedAi] = useState(false);
  const [appliedAi, setAppliedAi] = useState(false);

  // Ohm's Law State (V, I, R, P)
  const [voltage, setVoltage] = useState<string>("5");
  const [current, setCurrent] = useState<string>("0.02"); // 20mA
  const [resistance, setResistance] = useState<string>("250");
  const [power, setPower] = useState<string>("0.1"); // 100mW
  const [ohmsLastChanged, setOhmsLastChanged] = useState<"V" | "I" | "R" | "P">("V");

  // Voltage Divider State
  const [divVin, setDivVin] = useState<number>(5.0);
  const [divR1, setDivR1] = useState<number>(1000); // 1k
  const [divR2, setDivR2] = useState<number>(2000); // 2k

  // LED Resistor State
  const [ledVcc, setLedVcc] = useState<number>(5.0);
  const [ledVf, setLedVf] = useState<number>(2.0);
  const [ledIf, setLedIf] = useState<number>(20); // mA
  const [ledCount, setLedCount] = useState<number>(1);

  // Battery Life State
  const [batCapacity, setBatCapacity] = useState<number>(2600); // mAh
  const [batActiveMa, setBatActiveMa] = useState<number>(160); // mA
  const [batActiveSec, setBatActiveSec] = useState<number>(2); // seconds active
  const [batSleepUa, setBatSleepUa] = useState<number>(15); // uA in deep sleep
  const [batSleepSec, setBatSleepSec] = useState<number>(60); // seconds in sleep

  // RC Filter State
  const [rcResistor, setRcResistor] = useState<number>(10000); // 10k
  const [rcCapacitor, setRcCapacitor] = useState<number>(0.1); // 0.1 uF

  // Shunt Resistor State
  const [shuntMaxAmps, setShuntMaxAmps] = useState<number>(5.0);
  const [shuntAdcMv, setShuntAdcMv] = useState<number>(100); // 100mV full scale drop

  // Clear states when opening
  useEffect(() => {
    if (isOpen && !aiResult && currentProjectIdea) {
      // Preload a smart query suggestion if none exists
      setAiQuery(`Calculate power consumption & current budget for: ${currentProjectIdea.substring(0, 80)}`);
    }
  }, [isOpen, currentProjectIdea]);

  if (!isOpen) return null;

  // --- AI SOLVER HANDLER ---
  const handleAiCalculate = async (customText?: string) => {
    const queryToUse = customText || aiQuery;
    if (!queryToUse.trim()) return;

    setIsAiLoading(true);
    setAiError(null);
    setAiResult(null);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (apiKey) {
        headers["x-gemini-api-key"] = apiKey;
      }

      const response = await fetch("/api/v1/ai-calculate", {
        method: "POST",
        headers,
        body: JSON.stringify({
          query: queryToUse,
          contextBoard: targetBoard,
          projectIdea: currentProjectIdea,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Calculation service returned status ${response.status}`);
      }

      const data: AiCalculationResult = await response.json();
      setAiResult(data);
    } catch (err: any) {
      console.error("Calculation failure:", err);
      setAiError(err.message || "Failed to solve electronic calculation. Please retry.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // --- OHM'S LAW SOLVER ---
  const handleOhmsInput = (field: "V" | "I" | "R" | "P", valStr: string) => {
    const val = parseFloat(valStr);
    if (isNaN(val) || val < 0) {
      if (field === "V") setVoltage(valStr);
      if (field === "I") setCurrent(valStr);
      if (field === "R") setResistance(valStr);
      if (field === "P") setPower(valStr);
      return;
    }

    if (field === "V") {
      setVoltage(valStr);
      const r = parseFloat(resistance);
      const i = parseFloat(current);
      if (r > 0) {
        const newI = val / r;
        setCurrent(newI.toFixed(4));
        setPower((val * newI).toFixed(4));
      } else if (i > 0) {
        const newR = val / i;
        setResistance(newR.toFixed(2));
        setPower((val * i).toFixed(4));
      }
    } else if (field === "I") {
      setCurrent(valStr);
      const v = parseFloat(voltage);
      const r = parseFloat(resistance);
      if (v > 0) {
        const newR = val > 0 ? v / val : 0;
        setResistance(newR.toFixed(2));
        setPower((v * val).toFixed(4));
      } else if (r > 0) {
        const newV = val * r;
        setVoltage(newV.toFixed(3));
        setPower((newV * val).toFixed(4));
      }
    } else if (field === "R") {
      setResistance(valStr);
      const v = parseFloat(voltage);
      const i = parseFloat(current);
      if (v > 0 && val > 0) {
        const newI = v / val;
        setCurrent(newI.toFixed(4));
        setPower((v * newI).toFixed(4));
      } else if (i > 0 && val > 0) {
        const newV = i * val;
        setVoltage(newV.toFixed(3));
        setPower((newV * i).toFixed(4));
      }
    } else if (field === "P") {
      setPower(valStr);
      const v = parseFloat(voltage);
      const r = parseFloat(resistance);
      if (v > 0 && val > 0) {
        const newI = val / v;
        setCurrent(newI.toFixed(4));
        setResistance((v / newI).toFixed(2));
      } else if (r > 0 && val > 0) {
        const newI = Math.sqrt(val / r);
        const newV = newI * r;
        setCurrent(newI.toFixed(4));
        setVoltage(newV.toFixed(3));
      }
    }
  };

  // --- VOLTAGE DIVIDER CALCULATIONS ---
  const vout = divVin * (divR2 / (divR1 + divR2 || 1));
  const dividerCurrentMa = (divVin / (divR1 + divR2 || 1)) * 1000;
  const pR1mW = Math.pow(divVin - vout, 2) / (divR1 || 1) * 1000;
  const pR2mW = Math.pow(vout, 2) / (divR2 || 1) * 1000;
  const isSafeFor3V3 = vout <= 3.45 && vout >= 2.8;
  const isHazardFor3V3 = vout > 3.6;

  // --- LED RESISTOR CALCULATIONS ---
  const totalLedVf = ledVf * ledCount;
  const ledVoltageDrop = Math.max(0, ledVcc - totalLedVf);
  const ledResistorExact = ledIf > 0 ? (ledVoltageDrop / (ledIf / 1000)) : 0;
  // Nearest standard E24 resistor calculation
  const findStandardE24 = (exact: number) => {
    if (exact <= 0) return 0;
    const e24Base = [10, 11, 12, 13, 15, 16, 18, 20, 22, 24, 27, 30, 33, 36, 39, 43, 47, 51, 56, 62, 68, 75, 82, 91];
    const logVal = Math.log10(exact);
    const exponent = Math.floor(logVal) - 1;
    const normalized = exact / Math.pow(10, exponent);
    
    // Find closest or next higher value for safety
    let closest = e24Base[0];
    for (const val of e24Base) {
      if (val >= normalized) {
        closest = val;
        break;
      }
    }
    return Math.round(closest * Math.pow(10, exponent));
  };
  const standardLedResistor = findStandardE24(ledResistorExact);
  const ledResistorPowerMw = (Math.pow(ledVoltageDrop, 2) / (standardLedResistor || 1)) * 1000;

  // --- BATTERY LIFE CALCULATIONS ---
  const totalPeriodSec = batActiveSec + batSleepSec;
  const activeDutyCycle = totalPeriodSec > 0 ? batActiveSec / totalPeriodSec : 1;
  const sleepDutyCycle = totalPeriodSec > 0 ? batSleepSec / totalPeriodSec : 0;
  const avgCurrentMa = (batActiveMa * activeDutyCycle) + ((batSleepUa / 1000) * sleepDutyCycle);
  // Standard 85% usable battery discharge factor (accounting for LDO drop out / chemistry)
  const usableCapacityMah = batCapacity * 0.85;
  const batteryHours = avgCurrentMa > 0 ? usableCapacityMah / avgCurrentMa : 0;
  const batteryDays = batteryHours / 24;
  const batteryMonths = batteryDays / 30.4;
  const batteryYears = batteryDays / 365.25;

  // --- RC FILTER CALCULATIONS ---
  const rcTimeConstantMs = (rcResistor * (rcCapacitor * 1e-6)) * 1000; // Tau in ms
  const rcSettlingTimeMs = rcTimeConstantMs * 5; // 5 Tau (99.3% full charge)
  const rcCutoffFreqHz = rcResistor > 0 && rcCapacitor > 0 ? 1 / (2 * Math.PI * rcResistor * (rcCapacitor * 1e-6)) : 0;

  // --- SHUNT CURRENT SENSOR ---
  const shuntResistanceOhms = shuntMaxAmps > 0 ? (shuntAdcMv / 1000) / shuntMaxAmps : 0;
  const shuntResistanceMilliOhms = shuntResistanceOhms * 1000;
  const shuntPowerDissipationW = Math.pow(shuntMaxAmps, 2) * shuntResistanceOhms;

  const handleCopySnippet = (snippet: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedAi(true);
    setTimeout(() => setCopiedAi(false), 2000);
  };

  const handleApplySnippet = (snippet: string) => {
    if (onApplyToProject) {
      onApplyToProject(snippet);
      setAppliedAi(true);
      setTimeout(() => setAppliedAi(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
        className="w-full max-w-4xl bg-[#0e121f] rounded-3xl shadow-2xl border border-[#232d45] overflow-hidden text-slate-300 flex flex-col max-h-[92vh] my-auto"
      >
        {/* Top Header */}
        <div className="bg-[#13182a] px-6 py-4 flex items-center justify-between border-b border-[#20273a] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-indigo-500/20 to-emerald-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 shadow-inner">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-display font-extrabold text-white">
                  AI Hardware & Circuit Calculator
                </h2>
                <span className="text-[10px] font-tech font-bold bg-indigo-950/70 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded-full">
                  {targetBoard.split(" ")[0]} Project Solver
                </span>
              </div>
              <p className="text-xs text-slate-400 font-tech">
                Voltages, Amperage, Wattage, Resistors, Battery Life & RC Math for Physical Hardware
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl transition hover:bg-[#1f2538] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-[#0b0e18] px-4 py-2 border-b border-[#1c2234] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => setActiveTab("resistor_color")}
            className={`px-3 py-1.5 rounded-xl text-xs font-tech font-bold flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
              activeTab === "resistor_color"
                ? "bg-gradient-to-r from-amber-500/30 to-orange-500/30 text-amber-200 border border-amber-500/60 shadow-xs"
                : "text-amber-400/80 hover:text-amber-300 hover:bg-[#141828]"
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-amber-400" />
            <span>Resistor Color & Bands</span>
            <span className="text-[10px] font-mono text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded-md border border-amber-500/40">
              4/5/6 Band
            </span>
          </button>

          <button
            onClick={() => setActiveTab("ai_solver")}
            className={`px-3 py-1.5 rounded-xl text-xs font-tech font-bold flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
              activeTab === "ai_solver"
                ? "bg-gradient-to-r from-indigo-600/40 to-sky-600/40 text-sky-200 border border-sky-500/50 shadow-xs"
                : "text-slate-400 hover:text-slate-200 hover:bg-[#141828]"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>AI Natural Solver</span>
          </button>

          <button
            onClick={() => setActiveTab("ohms_law")}
            className={`px-3 py-1.5 rounded-xl text-xs font-tech font-bold flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
              activeTab === "ohms_law"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs"
                : "text-slate-400 hover:text-slate-200 hover:bg-[#141828]"
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Ohm's Law & Power (V/I/R/P)</span>
          </button>

          <button
            onClick={() => setActiveTab("voltage_divider")}
            className={`px-3 py-1.5 rounded-xl text-xs font-tech font-bold flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
              activeTab === "voltage_divider"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs"
                : "text-slate-400 hover:text-slate-200 hover:bg-[#141828]"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>5V→3.3V Voltage Divider</span>
          </button>

          <button
            onClick={() => setActiveTab("led_resistor")}
            className={`px-3 py-1.5 rounded-xl text-xs font-tech font-bold flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
              activeTab === "led_resistor"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-xs"
                : "text-slate-400 hover:text-slate-200 hover:bg-[#141828]"
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5 text-rose-400" />
            <span>LED Resistor & Wattage</span>
          </button>

          <button
            onClick={() => setActiveTab("battery_life")}
            className={`px-3 py-1.5 rounded-xl text-xs font-tech font-bold flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
              activeTab === "battery_life"
                ? "bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-xs"
                : "text-slate-400 hover:text-slate-200 hover:bg-[#141828]"
            }`}
          >
            <Battery className="w-3.5 h-3.5 text-teal-400" />
            <span>Battery Life Budget</span>
          </button>

          <button
            onClick={() => setActiveTab("rc_filter")}
            className={`px-3 py-1.5 rounded-xl text-xs font-tech font-bold flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
              activeTab === "rc_filter"
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-xs"
                : "text-slate-400 hover:text-slate-200 hover:bg-[#141828]"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>RC Filter & Debounce</span>
          </button>

          <button
            onClick={() => setActiveTab("shunt_current")}
            className={`px-3 py-1.5 rounded-xl text-xs font-tech font-bold flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
              activeTab === "shunt_current"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-xs"
                : "text-slate-400 hover:text-slate-200 hover:bg-[#141828]"
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-purple-400" />
            <span>Shunt Resistor (Amps Sense)</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6 font-sans">
          
          {/* TAB 0: RESISTOR COLOR CODE, SMD DECODER & CHAT */}
          {activeTab === "resistor_color" && (
            <ResistorColorTool
              onApplySnippet={onApplyToProject}
              targetBoard={targetBoard}
              apiKey={apiKey}
            />
          )}

          {/* TAB 1: AI NATURAL LANGUAGE CIRCUIT SOLVER */}
          {activeTab === "ai_solver" && (
            <div className="space-y-5">
              <div className="bg-[#121626] border border-[#232b40] p-4 rounded-2xl">
                <label className="block text-xs font-display font-bold text-slate-200 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-400" />
                    <span>Ask Any Hardware / Voltage / Current Calculation</span>
                  </span>
                  <span className="text-[11px] font-tech text-slate-400">Powered by AI Hardware Engine</span>
                </label>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAiCalculate()}
                    placeholder="e.g., Calculate shunt resistor for 5A load with 3.3V ADC on ESP32..."
                    className="flex-1 bg-[#090c14] border border-[#232d45] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-tech focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  />
                  <button
                    onClick={() => handleAiCalculate()}
                    disabled={isAiLoading || !aiQuery.trim()}
                    className="bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl font-tech font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-sky-950/50 shrink-0"
                  >
                    {isAiLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Calculating...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5" />
                        <span>Solve</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Preset Chips */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-tech font-bold text-slate-400 uppercase tracking-wider mr-1">
                    Quick Calculations:
                  </span>
                  {AI_PRESET_PROMPTS.map((promptText, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setAiQuery(promptText);
                        handleAiCalculate(promptText);
                      }}
                      className="text-[11px] font-tech bg-[#151a2b] hover:bg-[#1e253c] text-slate-300 hover:text-sky-300 border border-[#26314c] hover:border-sky-500/40 px-2.5 py-1 rounded-lg transition text-left cursor-pointer truncate max-w-[260px]"
                    >
                      {promptText}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Message if any */}
              {aiError && (
                <div className="p-3.5 bg-rose-950/30 border border-rose-500/40 rounded-xl text-rose-200 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Calculation Error:</span> {aiError}
                  </div>
                </div>
              )}

              {/* AI Calculation Results Box */}
              {aiResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#111626] border border-[#252f47] rounded-2xl p-5 space-y-4 shadow-xl"
                >
                  <div className="flex items-center justify-between border-b border-[#1f283d] pb-3">
                    <div>
                      <h3 className="font-display font-bold text-white text-sm flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>{aiResult.title}</span>
                      </h3>
                      {aiResult.primaryFormula && (
                        <div className="text-xs font-mono font-bold text-sky-400 mt-0.5">
                          Formula: {aiResult.primaryFormula}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {aiResult.promptSnippet && (
                        <button
                          onClick={() => handleApplySnippet(aiResult.promptSnippet!)}
                          className="bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-xl text-xs font-tech font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                          title="Apply this calculated component to your active project idea"
                        >
                          {appliedAi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />}
                          <span>{appliedAi ? "Applied to Project!" : "Add to Project Idea"}</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleCopySnippet(JSON.stringify(aiResult, null, 2))}
                        className="bg-[#171d2f] hover:bg-[#20273e] text-slate-300 border border-[#2a344f] px-2.5 py-1.5 rounded-xl text-xs font-tech flex items-center gap-1.5 transition cursor-pointer"
                        title="Copy raw result"
                      >
                        {copiedAi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedAi ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Primary & Secondary Results Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {aiResult.calculatedResults.map((res, i) => (
                      <div
                        key={i}
                        className={`p-3.5 rounded-xl border ${
                          res.isPrimary
                            ? "bg-sky-950/30 border-sky-500/50 text-sky-200"
                            : "bg-[#0c101c] border-[#1f273b] text-slate-200"
                        }`}
                      >
                        <div className="text-[10px] font-tech uppercase font-bold text-slate-400">
                          {res.label}
                        </div>
                        <div className="text-xl font-extrabold font-mono text-white mt-1">
                          {res.value} <span className="text-xs text-sky-400 font-sans">{res.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Standard Components Recommendation */}
                  {aiResult.standardComponents && aiResult.standardComponents.length > 0 && (
                    <div className="bg-[#0b0e18] p-3.5 rounded-xl border border-[#20283c] space-y-2">
                      <div className="text-xs font-tech font-bold text-amber-400 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5" />
                        <span>Recommended Standard Component Values (E24 / Sourcing)</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-tech">
                        {aiResult.standardComponents.map((comp, idx) => (
                          <div key={idx} className="bg-[#121727] p-2.5 rounded-lg border border-[#1f273b] flex items-center justify-between">
                            <div>
                              <span className="font-bold text-slate-100">{comp.type}: </span>
                              <span className="font-mono text-emerald-400 font-bold">{comp.recommendedValue}</span>
                              {comp.series && <span className="text-[10px] text-slate-500 ml-1.5">({comp.series})</span>}
                            </div>
                            {comp.wattageRating && (
                              <span className="text-[10px] font-mono font-bold bg-amber-950/60 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md">
                                {comp.wattageRating}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step by Step Mathematical Derivation */}
                  {aiResult.stepByStep && aiResult.stepByStep.length > 0 && (
                    <div className="bg-[#0b0e18] p-3.5 rounded-xl border border-[#20283c] space-y-1.5">
                      <div className="text-xs font-tech font-bold text-indigo-300 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" />
                        <span>Step-by-Step Engineering Derivation</span>
                      </div>
                      <ul className="space-y-1 text-xs text-slate-300 font-mono">
                        {aiResult.stepByStep.map((step, idx) => (
                          <li key={idx} className="leading-relaxed">
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Safety & Lab Tips */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-tech">
                    {aiResult.safetyNotes && (
                      <div className="p-3 bg-rose-950/20 border border-rose-500/30 rounded-xl text-rose-200">
                        <div className="font-bold flex items-center gap-1.5 text-rose-400 mb-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Electrical Safety Check</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-300 font-sans">{aiResult.safetyNotes}</p>
                      </div>
                    )}

                    {aiResult.engineeringTip && (
                      <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-emerald-200">
                        <div className="font-bold flex items-center gap-1.5 text-emerald-400 mb-1">
                          <Lightbulb className="w-3.5 h-3.5" />
                          <span>Lab Mentor Hardware Tip</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-300 font-sans">{aiResult.engineeringTip}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* TAB 2: OHM'S LAW & POWER (V, I, R, P) */}
          {activeTab === "ohms_law" && (
            <div className="space-y-5">
              <div className="bg-[#121626] border border-[#232b40] p-4 rounded-2xl">
                <div className="text-xs font-display font-bold text-white mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Interactive Ohm's Law & Power Quadrant (V = I × R, P = V × I)</span>
                </div>
                <p className="text-xs text-slate-400 font-tech">
                  Type any 2 values to immediately calculate the remaining electrical parameters and check resistor wattage dissipation.
                </p>
              </div>

              {/* 4 Inputs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-tech">
                {/* Voltage */}
                <div className="p-3.5 bg-[#121626] border border-[#232b40] rounded-2xl">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 flex items-center justify-between">
                    <span>Voltage (V)</span>
                    <span className="text-amber-400">Volts</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={voltage}
                      onChange={(e) => handleOhmsInput("V", e.target.value)}
                      className="w-full bg-[#090c14] border border-[#232d45] rounded-xl p-2.5 text-base font-bold text-white font-mono focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                    <span className="absolute right-2.5 top-3 text-xs text-slate-500 font-mono">V</span>
                  </div>
                </div>

                {/* Current */}
                <div className="p-3.5 bg-[#121626] border border-[#232b40] rounded-2xl">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 flex items-center justify-between">
                    <span>Current (I)</span>
                    <span className="text-sky-400">Amperes</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.001"
                      value={current}
                      onChange={(e) => handleOhmsInput("I", e.target.value)}
                      className="w-full bg-[#090c14] border border-[#232d45] rounded-xl p-2.5 text-base font-bold text-white font-mono focus:ring-1 focus:ring-sky-500 focus:outline-none"
                    />
                    <span className="absolute right-2.5 top-3 text-xs text-slate-500 font-mono">A</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">
                    = {(parseFloat(current) * 1000 || 0).toFixed(1)} mA
                  </div>
                </div>

                {/* Resistance */}
                <div className="p-3.5 bg-[#121626] border border-[#232b40] rounded-2xl">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 flex items-center justify-between">
                    <span>Resistance (R)</span>
                    <span className="text-emerald-400">Ohms</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      value={resistance}
                      onChange={(e) => handleOhmsInput("R", e.target.value)}
                      className="w-full bg-[#090c14] border border-[#232d45] rounded-xl p-2.5 text-base font-bold text-white font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                    <span className="absolute right-2.5 top-3 text-xs text-slate-500 font-mono">Ω</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">
                    = {(parseFloat(resistance) / 1000 || 0).toFixed(2)} kΩ
                  </div>
                </div>

                {/* Power */}
                <div className="p-3.5 bg-[#121626] border border-[#232b40] rounded-2xl">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 flex items-center justify-between">
                    <span>Power (P)</span>
                    <span className="text-rose-400">Watts</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={power}
                      onChange={(e) => handleOhmsInput("P", e.target.value)}
                      className="w-full bg-[#090c14] border border-[#232d45] rounded-xl p-2.5 text-base font-bold text-white font-mono focus:ring-1 focus:ring-rose-500 focus:outline-none"
                    />
                    <span className="absolute right-2.5 top-3 text-xs text-slate-500 font-mono">W</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">
                    = {(parseFloat(power) * 1000 || 0).toFixed(1)} mW
                  </div>
                </div>
              </div>

              {/* Power Rating & Safety Assessment */}
              {parseFloat(power) > 0 && (
                <div className="bg-[#101423] p-4 rounded-2xl border border-[#232b40] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-display font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span>Resistor Package & Thermal Power Sizing</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-300">
                      Dissipating: {(parseFloat(power) * 1000).toFixed(1)} mW
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-tech text-xs">
                    <div className={`p-3 rounded-xl border ${
                      parseFloat(power) <= 0.125
                        ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-200"
                        : "bg-[#090d16] border-[#1e2638] text-slate-400"
                    }`}>
                      <div className="font-bold">1/8 Watt (125mW)</div>
                      <div className="text-[11px] mt-0.5">SMD 0805 / 0603 Package</div>
                      <div className="text-[10px] mt-1 font-mono">
                        {parseFloat(power) <= 0.125 ? "✓ Safe & Cool" : "✗ Overheated"}
                      </div>
                    </div>

                    <div className={`p-3 rounded-xl border ${
                      parseFloat(power) <= 0.25 && parseFloat(power) > 0.125
                        ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-200"
                        : parseFloat(power) <= 0.25
                        ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                        : "bg-[#090d16] border-[#1e2638] text-slate-400"
                    }`}>
                      <div className="font-bold">1/4 Watt (250mW)</div>
                      <div className="text-[11px] mt-0.5">Standard Through-Hole (CFR)</div>
                      <div className="text-[10px] mt-1 font-mono">
                        {parseFloat(power) <= 0.25 ? "✓ Recommended Standard" : "✗ Needs >0.5W"}
                      </div>
                    </div>

                    <div className={`p-3 rounded-xl border ${
                      parseFloat(power) > 0.25
                        ? "bg-amber-950/40 border-amber-500/50 text-amber-200"
                        : "bg-[#090d16] border-[#1e2638] text-slate-400"
                    }`}>
                      <div className="font-bold">1/2W to 5W Power Resistor</div>
                      <div className="text-[11px] mt-0.5">Wirewound / Ceramic Cement</div>
                      <div className="text-[10px] mt-1 font-mono">
                        {parseFloat(power) > 0.25 ? "⚠ High heat: Use heatsink" : "Optional heavy-duty"}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: VOLTAGE DIVIDER (5V -> 3.3V) */}
          {activeTab === "voltage_divider" && (
            <div className="space-y-4 text-xs font-tech">
              <div className="bg-[#121626] border border-[#232b40] p-4 rounded-2xl">
                <div className="text-xs font-display font-bold text-white mb-1 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>5V to 3.3V Logic Level Voltage Divider (GPIO Protector)</span>
                </div>
                <p className="text-xs text-slate-400">
                  Safely interfaces 5V sensors (e.g. HC-SR04 Echo, 5V UART, 5V digital signals) with 3.3V MCU inputs (ESP32, STM32, RP2040).
                </p>
              </div>

              {/* Schematic View */}
              <div className="bg-[#090c14] p-4 rounded-2xl text-slate-300 font-mono text-xs border border-[#20273a] flex flex-col items-center">
                <div className="text-emerald-400 font-bold mb-2 flex items-center gap-1.5 font-tech">
                  <Zap className="w-3.5 h-3.5" /> Circuit Schematic Topology
                </div>
                <pre className="text-emerald-300 text-center leading-tight text-[11px]">
{`  5V Sensor Signal ────[ R1 (${divR1}Ω) ]────┬──── Output to 3.3V GPIO (${vout.toFixed(2)}V)
                                             │
                                         [ R2 (${divR2}Ω) ]
                                             │
                                            GND (0V)`}
                </pre>
              </div>

              {/* 3 Inputs */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-[#121626] border border-[#232b40] rounded-xl">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Input Voltage (Vin):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={divVin}
                      onChange={(e) => setDivVin(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#090c14] border border-[#232b40] rounded-xl p-2 text-xs text-white font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                    <span className="absolute right-2.5 top-2 text-[11px] text-slate-500 font-mono">V</span>
                  </div>
                </div>

                <div className="p-3 bg-[#121626] border border-[#232b40] rounded-xl">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    R1 (Upper Resistor):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="100"
                      value={divR1}
                      onChange={(e) => setDivR1(parseInt(e.target.value, 10) || 1)}
                      className="w-full bg-[#090c14] border border-[#232b40] rounded-xl p-2 text-xs text-white font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                    <span className="absolute right-2.5 top-2 text-[11px] text-slate-500 font-mono">Ω</span>
                  </div>
                </div>

                <div className="p-3 bg-[#121626] border border-[#232b40] rounded-xl">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    R2 (Lower Resistor):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="100"
                      value={divR2}
                      onChange={(e) => setDivR2(parseInt(e.target.value, 10) || 1)}
                      className="w-full bg-[#090c14] border border-[#232b40] rounded-xl p-2 text-xs text-white font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                    <span className="absolute right-2.5 top-2 text-[11px] text-slate-500 font-mono">Ω</span>
                  </div>
                </div>
              </div>

              {/* Output Result Card */}
              <div
                className={`p-4 rounded-2xl border transition flex items-center justify-between ${
                  isHazardFor3V3
                    ? "bg-rose-950/30 border-rose-500/40 text-rose-200"
                    : isSafeFor3V3
                    ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-200"
                    : "bg-amber-950/30 border-amber-500/40 text-amber-200"
                }`}
              >
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                    Calculated Output Voltage (Vout)
                  </div>
                  <div className="text-2xl font-extrabold font-mono mt-0.5">
                    {vout.toFixed(2)} Volts
                  </div>
                  <div className="text-[11px] mt-1 font-sans text-slate-300">
                    Continuous Bus Current: <span className="font-mono font-bold text-white">{dividerCurrentMa.toFixed(2)} mA</span> | Dissipation R1: <span className="font-mono text-white">{pR1mW.toFixed(1)} mW</span>, R2: <span className="font-mono text-white">{pR2mW.toFixed(1)} mW</span>
                  </div>
                </div>

                <div className="text-right">
                  {isSafeFor3V3 ? (
                    <div className="flex items-center gap-1.5 text-emerald-400 font-display font-bold text-xs bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-500/40 shadow-xs">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>3.3V Logic Safe</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-rose-400 font-display font-bold text-xs bg-rose-950/60 px-3 py-1.5 rounded-xl border border-rose-500/40 shadow-xs">
                      <AlertTriangle className="w-4 h-4" />
                      <span>{vout > 3.6 ? "Hazard: Exceeds 3.3V" : "Under-voltage"}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Standard Resistor Pair Presets */}
              <div className="space-y-1.5">
                <div className="text-[10px] uppercase font-bold text-slate-400">
                  Standard E24 Resistor Presets:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { name: "1kΩ / 2kΩ (Optimal)", r1: 1000, r2: 2000, desc: "Fast rise time, 3.33V" },
                    { name: "10kΩ / 20kΩ (Low Power)", r1: 10000, r2: 20000, desc: "0.16mA draw, 3.33V" },
                    { name: "2.2kΩ / 4.7kΩ (Common)", r1: 2200, r2: 4700, desc: "3.41V safe" },
                    { name: "4.7kΩ / 10kΩ (Standard)", r1: 4700, r2: 10000, desc: "3.40V safe" },
                  ].map((pair, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setDivR1(pair.r1);
                        setDivR2(pair.r2);
                      }}
                      className="p-2.5 bg-[#141826] hover:bg-[#1c2236] border border-[#232b40] hover:border-emerald-500/50 rounded-xl text-left transition text-slate-200 cursor-pointer"
                    >
                      <div className="font-bold text-emerald-300 text-xs">{pair.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{pair.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LED RESISTOR & WATTAGE */}
          {activeTab === "led_resistor" && (
            <div className="space-y-4 font-tech">
              <div className="bg-[#121626] border border-[#232b40] p-4 rounded-2xl">
                <div className="text-xs font-display font-bold text-white mb-1 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-rose-400" />
                  <span>LED Current-Limiting Resistor & Power Sizing (R = (Vcc - Vf) / If)</span>
                </div>
                <p className="text-xs text-slate-400">
                  Prevents burning out LEDs and GPIO pins by calculating exact resistance and power rating.
                </p>
              </div>

              {/* Preset Color Chips */}
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">
                  Select LED Color / Chemistry Preset:
                </div>
                <div className="flex flex-wrap gap-2">
                  {LED_PRESETS.map((led, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setLedVf(led.vf);
                        setLedIf(led.if);
                      }}
                      className={`text-xs px-3 py-1.5 rounded-xl border transition cursor-pointer flex items-center gap-1.5 ${
                        ledVf === led.vf
                          ? "bg-rose-950/40 border-rose-500/50 text-rose-200 font-bold"
                          : "bg-[#141826] border-[#222a3d] text-slate-300 hover:bg-[#1a2034]"
                      }`}
                    >
                      <span>{led.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({led.vf}V)</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-[#121626] border border-[#232b40] rounded-xl">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Supply Voltage (Vcc):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={ledVcc}
                      onChange={(e) => setLedVcc(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#090c14] border border-[#232b40] rounded-xl p-2 text-xs text-white font-mono focus:ring-1 focus:ring-rose-500 focus:outline-none"
                    />
                    <span className="absolute right-2.5 top-2 text-[11px] text-slate-500 font-mono">V</span>
                  </div>
                </div>

                <div className="p-3 bg-[#121626] border border-[#232b40] rounded-xl">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    LED Forward Voltage (Vf):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={ledVf}
                      onChange={(e) => setLedVf(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#090c14] border border-[#232b40] rounded-xl p-2 text-xs text-white font-mono focus:ring-1 focus:ring-rose-500 focus:outline-none"
                    />
                    <span className="absolute right-2.5 top-2 text-[11px] text-slate-500 font-mono">V</span>
                  </div>
                </div>

                <div className="p-3 bg-[#121626] border border-[#232b40] rounded-xl">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Target Current (If):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      value={ledIf}
                      onChange={(e) => setLedIf(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#090c14] border border-[#232b40] rounded-xl p-2 text-xs text-white font-mono focus:ring-1 focus:ring-rose-500 focus:outline-none"
                    />
                    <span className="absolute right-2.5 top-2 text-[11px] text-slate-500 font-mono">mA</span>
                  </div>
                </div>

                <div className="p-3 bg-[#121626] border border-[#232b40] rounded-xl">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    LEDs in Series:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={ledCount}
                    onChange={(e) => setLedCount(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-[#090c14] border border-[#232b40] rounded-xl p-2 text-xs text-white font-mono focus:ring-1 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Calculated Result */}
              <div className="p-4 bg-[#111627] border border-[#252f47] rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-[#0a0d17] border border-[#1f273c] rounded-xl">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Exact Theoretical Value</div>
                  <div className="text-xl font-extrabold font-mono text-white mt-1">
                    {ledResistorExact.toFixed(1)} <span className="text-xs text-rose-400 font-sans">Ω</span>
                  </div>
                </div>

                <div className="p-3 bg-rose-950/30 border border-rose-500/50 rounded-xl">
                  <div className="text-[10px] uppercase font-bold text-rose-300">Nearest Standard E24 Resistor</div>
                  <div className="text-xl font-extrabold font-mono text-rose-200 mt-1">
                    {standardLedResistor} <span className="text-xs text-rose-400 font-sans">Ω</span>
                  </div>
                </div>

                <div className="p-3 bg-[#0a0d17] border border-[#1f273c] rounded-xl">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Resistor Power Dissipation</div>
                  <div className="text-xl font-extrabold font-mono text-white mt-1">
                    {ledResistorPowerMw.toFixed(1)} <span className="text-xs text-amber-400 font-sans">mW</span>
                  </div>
                  <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                    Rating: {ledResistorPowerMw < 200 ? "1/4 Watt (250mW) Safe" : "Use 1/2 Watt"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: BATTERY LIFE & POWER BUDGET */}
          {activeTab === "battery_life" && (
            <div className="space-y-4 font-tech">
              <div className="bg-[#121626] border border-[#232b40] p-4 rounded-2xl">
                <div className="text-xs font-display font-bold text-white mb-1 flex items-center gap-2">
                  <Battery className="w-4 h-4 text-teal-400" />
                  <span>IoT Battery Life & Power Budget Estimator (Active vs Deep Sleep)</span>
                </div>
                <p className="text-xs text-slate-400">
                  Calculates total battery longevity in Days, Months & Years factoring in duty cycle and 85% usable chemistry discharge.
                </p>
              </div>

              {/* Battery Capacity Presets */}
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">
                  Select Battery Chemistry / Pack:
                </div>
                <div className="flex flex-wrap gap-2">
                  {BATTERY_PRESETS.map((bat, idx) => (
                    <button
                      key={idx}
                      onClick={() => setBatCapacity(bat.capacity)}
                      className={`text-xs px-3 py-1.5 rounded-xl border transition cursor-pointer flex items-center gap-1.5 ${
                        batCapacity === bat.capacity
                          ? "bg-teal-950/40 border-teal-500/50 text-teal-200 font-bold"
                          : "bg-[#141826] border-[#222a3d] text-slate-300 hover:bg-[#1a2034]"
                      }`}
                    >
                      <span>{bat.name}</span>
                      <span className="text-[10px] text-teal-400 font-mono font-bold">({bat.capacity} mAh)</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Power Profile Inputs */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <div className="p-3 bg-[#121626] border border-[#232b40] rounded-xl">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Capacity (mAh):
                  </label>
                  <input
                    type="number"
                    value={batCapacity}
                    onChange={(e) => setBatCapacity(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#090c14] border border-[#232b40] rounded-xl p-2 text-xs text-white font-mono focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div className="p-3 bg-[#121626] border border-[#232b40] rounded-xl">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Active Current (mA):
                  </label>
                  <input
                    type="number"
                    value={batActiveMa}
                    onChange={(e) => setBatActiveMa(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#090c14] border border-[#232b40] rounded-xl p-2 text-xs text-white font-mono focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div className="p-3 bg-[#121626] border border-[#232b40] rounded-xl">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Active Time (sec):
                  </label>
                  <input
                    type="number"
                    value={batActiveSec}
                    onChange={(e) => setBatActiveSec(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#090c14] border border-[#232b40] rounded-xl p-2 text-xs text-white font-mono focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div className="p-3 bg-[#121626] border border-[#232b40] rounded-xl">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Sleep Current (µA):
                  </label>
                  <input
                    type="number"
                    value={batSleepUa}
                    onChange={(e) => setBatSleepUa(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#090c14] border border-[#232b40] rounded-xl p-2 text-xs text-white font-mono focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div className="p-3 bg-[#121626] border border-[#232b40] rounded-xl">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Sleep Time (sec):
                  </label>
                  <input
                    type="number"
                    value={batSleepSec}
                    onChange={(e) => setBatSleepSec(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#090c14] border border-[#232b40] rounded-xl p-2 text-xs text-white font-mono focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Longevity Results */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-teal-950/30 border border-teal-500/50 rounded-2xl">
                  <div className="text-[10px] uppercase font-bold text-teal-300">Estimated Days</div>
                  <div className="text-2xl font-extrabold font-mono text-white mt-1">
                    {batteryDays.toFixed(1)} <span className="text-xs text-teal-400 font-sans">Days</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    = {batteryHours.toFixed(0)} continuous hours
                  </div>
                </div>

                <div className="p-4 bg-teal-950/30 border border-teal-500/50 rounded-2xl">
                  <div className="text-[10px] uppercase font-bold text-teal-300">Estimated Months</div>
                  <div className="text-2xl font-extrabold font-mono text-white mt-1">
                    {batteryMonths.toFixed(1)} <span className="text-xs text-teal-400 font-sans">Months</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    = {(batteryYears).toFixed(2)} Years
                  </div>
                </div>

                <div className="p-4 bg-[#101423] border border-[#232b40] rounded-2xl">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Average Current Draw</div>
                  <div className="text-2xl font-extrabold font-mono text-sky-400 mt-1">
                    {avgCurrentMa.toFixed(2)} <span className="text-xs text-slate-400 font-sans">mA</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Active Duty: {(activeDutyCycle * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="p-4 bg-[#101423] border border-[#232b40] rounded-2xl">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Usable Energy</div>
                  <div className="text-2xl font-extrabold font-mono text-emerald-400 mt-1">
                    {usableCapacityMah.toFixed(0)} <span className="text-xs text-slate-400 font-sans">mAh</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    85% Chemistry factor
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: RC FILTER & DEBOUNCE */}
          {activeTab === "rc_filter" && (
            <div className="space-y-4 font-tech">
              <div className="bg-[#121626] border border-[#232b40] p-4 rounded-2xl">
                <div className="text-xs font-display font-bold text-white mb-1 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <span>RC Filter & Switch Debounce Time Constant (τ = R × C, fc = 1 / 2πRC)</span>
                </div>
                <p className="text-xs text-slate-400">
                  Calculates hardware debouncing for mechanical buttons, rotary encoders, and low-pass analog sensor smoothing.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-[#121626] border border-[#232b40] rounded-xl">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Resistor Value (R in Ω):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="100"
                      value={rcResistor}
                      onChange={(e) => setRcResistor(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#090c14] border border-[#232b40] rounded-xl p-2 text-xs text-white font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                    <span className="absolute right-2.5 top-2 text-[11px] text-slate-500 font-mono">Ω</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 font-mono">
                    = {(rcResistor / 1000).toFixed(2)} kΩ
                  </div>
                </div>

                <div className="p-3.5 bg-[#121626] border border-[#232b40] rounded-xl">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Capacitor Value (C in µF):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={rcCapacitor}
                      onChange={(e) => setRcCapacitor(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#090c14] border border-[#232b40] rounded-xl p-2 text-xs text-white font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                    <span className="absolute right-2.5 top-2 text-[11px] text-slate-500 font-mono">µF</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 font-mono">
                    = {(rcCapacitor * 1000).toFixed(1)} nF
                  </div>
                </div>
              </div>

              {/* RC Results Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-indigo-950/30 border border-indigo-500/50 rounded-2xl">
                  <div className="text-[10px] uppercase font-bold text-indigo-300">Time Constant (τ = RC)</div>
                  <div className="text-2xl font-extrabold font-mono text-white mt-1">
                    {rcTimeConstantMs.toFixed(2)} <span className="text-xs text-indigo-400 font-sans">ms</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">63.2% charge point</div>
                </div>

                <div className="p-4 bg-emerald-950/30 border border-emerald-500/50 rounded-2xl">
                  <div className="text-[10px] uppercase font-bold text-emerald-300">99.3% Settling Time (5τ)</div>
                  <div className="text-2xl font-extrabold font-mono text-white mt-1">
                    {rcSettlingTimeMs.toFixed(2)} <span className="text-xs text-emerald-400 font-sans">ms</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Ideal for button debouncing (10-20ms)</div>
                </div>

                <div className="p-4 bg-[#101423] border border-[#232b40] rounded-2xl">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Cutoff Frequency (fc)</div>
                  <div className="text-2xl font-extrabold font-mono text-sky-400 mt-1">
                    {rcCutoffFreqHz.toFixed(1)} <span className="text-xs text-slate-400 font-sans">Hz</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">-3dB Low Pass Filter cutoff</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: SHUNT CURRENT SENSOR */}
          {activeTab === "shunt_current" && (
            <div className="space-y-4 font-tech">
              <div className="bg-[#121626] border border-[#232b40] p-4 rounded-2xl">
                <div className="text-xs font-display font-bold text-white mb-1 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-purple-400" />
                  <span>Shunt Resistor & High-Side/Low-Side Current Measurement</span>
                </div>
                <p className="text-xs text-slate-400">
                  Calculates precision shunt resistor values (mΩ) and power dissipation for measuring amperes with MCU ADCs or INA219/INA226 ICs.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-[#121626] border border-[#232b40] rounded-xl">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Max Load Current (Imax in Amps):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      value={shuntMaxAmps}
                      onChange={(e) => setShuntMaxAmps(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#090c14] border border-[#232b40] rounded-xl p-2 text-xs text-white font-mono focus:ring-1 focus:ring-purple-500 focus:outline-none"
                    />
                    <span className="absolute right-2.5 top-2 text-[11px] text-slate-500 font-mono">A</span>
                  </div>
                </div>

                <div className="p-3.5 bg-[#121626] border border-[#232b40] rounded-xl">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Max Allowed Voltage Drop (mV):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="10"
                      value={shuntAdcMv}
                      onChange={(e) => setShuntAdcMv(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#090c14] border border-[#232b40] rounded-xl p-2 text-xs text-white font-mono focus:ring-1 focus:ring-purple-500 focus:outline-none"
                    />
                    <span className="absolute right-2.5 top-2 text-[11px] text-slate-500 font-mono">mV</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 font-mono">
                    Standard INA219 max: 320mV
                  </div>
                </div>
              </div>

              {/* Shunt Results */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-purple-950/30 border border-purple-500/50 rounded-2xl">
                  <div className="text-[10px] uppercase font-bold text-purple-300">Ideal Shunt Resistance</div>
                  <div className="text-2xl font-extrabold font-mono text-white mt-1">
                    {shuntResistanceMilliOhms.toFixed(1)} <span className="text-xs text-purple-400 font-sans">mΩ</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">= {shuntResistanceOhms.toFixed(4)} Ω</div>
                </div>

                <div className="p-4 bg-amber-950/30 border border-amber-500/50 rounded-2xl">
                  <div className="text-[10px] uppercase font-bold text-amber-300">Shunt Power Dissipation</div>
                  <div className="text-2xl font-extrabold font-mono text-white mt-1">
                    {shuntPowerDissipationW.toFixed(2)} <span className="text-xs text-amber-400 font-sans">Watts</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Min Resistor Rating: {(shuntPowerDissipationW * 2).toFixed(1)}W (2x Safety Factor)
                  </div>
                </div>

                <div className="p-4 bg-[#101423] border border-[#232b40] rounded-2xl">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Sensor Recommendation</div>
                  <div className="text-base font-bold text-emerald-400 mt-1">
                    {shuntMaxAmps <= 3.2 ? "INA219 (0.1Ω internal)" : "External 4-terminal Kelvin Shunt"}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">I2C Digital High-Side Sense</div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-[#121627] px-6 py-3.5 border-t border-[#20273a] flex items-center justify-between shrink-0 font-tech text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.5)]" />
            <span>Exact Engineering Mathematical Precision • E24 Series Verified</span>
          </div>

          <button
            onClick={onClose}
            className="bg-[#1b2236] hover:bg-[#252f4a] text-slate-200 px-4 py-2 rounded-xl transition cursor-pointer font-bold"
          >
            Close Calculator
          </button>
        </div>
      </motion.div>
    </div>
  );
};
