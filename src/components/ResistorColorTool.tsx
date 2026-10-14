import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Palette,
  Sparkles,
  Copy,
  Check,
  Send,
  HelpCircle,
  Hash,
  BookOpen,
  ArrowRight,
  Zap,
  Info,
  Layers,
  Search,
  RotateCcw,
  Bot,
  User,
  Sliders,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { TargetBoard } from "../types";

export type BandCount = 4 | 5 | 6;

export interface ColorDef {
  name: string;
  digit: number | null;
  multiplier: number | null;
  tolerance: number | null;
  toleranceStr: string | null;
  tempco: number | null;
  bgClass: string;
  hex: string;
  textColor: string;
  borderClass: string;
}

export const COLOR_TABLE: Record<string, ColorDef> = {
  black: {
    name: "Black",
    digit: 0,
    multiplier: 1,
    tolerance: null,
    toleranceStr: null,
    tempco: 250,
    bgClass: "bg-black",
    hex: "#0f172a",
    textColor: "text-white",
    borderClass: "border-slate-700",
  },
  brown: {
    name: "Brown",
    digit: 1,
    multiplier: 10,
    tolerance: 1,
    toleranceStr: "±1% (F)",
    tempco: 100,
    bgClass: "bg-amber-900",
    hex: "#78350f",
    textColor: "text-amber-100",
    borderClass: "border-amber-700",
  },
  red: {
    name: "Red",
    digit: 2,
    multiplier: 100,
    tolerance: 2,
    toleranceStr: "±2% (G)",
    tempco: 50,
    bgClass: "bg-rose-600",
    hex: "#e11d48",
    textColor: "text-white",
    borderClass: "border-rose-400",
  },
  orange: {
    name: "Orange",
    digit: 3,
    multiplier: 1000,
    tolerance: 0.05,
    toleranceStr: "±0.05%",
    tempco: 15,
    bgClass: "bg-orange-500",
    hex: "#f97316",
    textColor: "text-white",
    borderClass: "border-orange-400",
  },
  yellow: {
    name: "Yellow",
    digit: 4,
    multiplier: 10000,
    tolerance: 0.02,
    toleranceStr: "±0.02%",
    tempco: 25,
    bgClass: "bg-yellow-400",
    hex: "#eab308",
    textColor: "text-slate-950",
    borderClass: "border-yellow-300",
  },
  green: {
    name: "Green",
    digit: 5,
    multiplier: 100000,
    tolerance: 0.5,
    toleranceStr: "±0.5% (D)",
    tempco: 20,
    bgClass: "bg-emerald-600",
    hex: "#059669",
    textColor: "text-white",
    borderClass: "border-emerald-400",
  },
  blue: {
    name: "Blue",
    digit: 6,
    multiplier: 1000000,
    tolerance: 0.25,
    toleranceStr: "±0.25% (C)",
    tempco: 10,
    bgClass: "bg-blue-600",
    hex: "#2563eb",
    textColor: "text-white",
    borderClass: "border-blue-400",
  },
  violet: {
    name: "Violet",
    digit: 7,
    multiplier: 10000000,
    tolerance: 0.1,
    toleranceStr: "±0.1% (B)",
    tempco: 5,
    bgClass: "bg-purple-600",
    hex: "#9333ea",
    textColor: "text-white",
    borderClass: "border-purple-400",
  },
  gray: {
    name: "Gray",
    digit: 8,
    multiplier: 100000000,
    tolerance: 0.05,
    toleranceStr: "±0.05% (A)",
    tempco: 1,
    bgClass: "bg-slate-500",
    hex: "#64748b",
    textColor: "text-white",
    borderClass: "border-slate-400",
  },
  white: {
    name: "White",
    digit: 9,
    multiplier: 1000000000,
    tolerance: null,
    toleranceStr: null,
    tempco: null,
    bgClass: "bg-slate-100",
    hex: "#f8fafc",
    textColor: "text-slate-900",
    borderClass: "border-slate-300",
  },
  gold: {
    name: "Gold",
    digit: null,
    multiplier: 0.1,
    tolerance: 5,
    toleranceStr: "±5% (J)",
    tempco: null,
    bgClass: "bg-amber-400",
    hex: "#d97706",
    textColor: "text-slate-950",
    borderClass: "border-amber-300",
  },
  silver: {
    name: "Silver",
    digit: null,
    multiplier: 0.01,
    tolerance: 10,
    toleranceStr: "±10% (K)",
    tempco: null,
    bgClass: "bg-slate-300",
    hex: "#94a3b8",
    textColor: "text-slate-950",
    borderClass: "border-slate-200",
  },
};

// Standard E24 base series values
const E24_BASE = [10, 11, 12, 13, 15, 16, 18, 20, 22, 24, 27, 30, 33, 36, 39, 43, 47, 51, 56, 62, 68, 75, 82, 91];
const E12_BASE = [10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82];

// Format ohms into clean Ω, kΩ, MΩ representation
export function formatOhms(ohms: number): string {
  if (ohms === 0) return "0 Ω";
  if (ohms >= 1_000_000) {
    const val = ohms / 1_000_000;
    return `${Number(val.toFixed(3))} MΩ`;
  }
  if (ohms >= 1_000) {
    const val = ohms / 1_000;
    return `${Number(val.toFixed(3))} kΩ`;
  }
  return `${Number(ohms.toFixed(2))} Ω`;
}

// Parse string like "4.7k", "10k", "220", "1M", "0.47" into numeric Ohms
export function parseResistanceInput(inputStr: string): number | null {
  const clean = inputStr.trim().toLowerCase().replace(/ohms?|ω/g, "").replace(/\s+/g, "");
  if (!clean) return null;

  // Handle "4k7" or "2m2" or "0r5" European notation
  const notationMatch = clean.match(/^(\d+)([kmr])(\d+)$/);
  if (notationMatch) {
    const [_, intPart, multChar, decPart] = notationMatch;
    const combined = parseFloat(`${intPart}.${decPart}`);
    if (multChar === "k") return combined * 1_000;
    if (multChar === "m") return combined * 1_000_000;
    if (multChar === "r") return combined;
  }

  // Handle "4.7k", "10m", "220r", "220"
  const standardMatch = clean.match(/^([0-9.]+)([kmr]?)$/);
  if (standardMatch) {
    const val = parseFloat(standardMatch[1]);
    const unit = standardMatch[2];
    if (isNaN(val)) return null;
    if (unit === "k") return val * 1_000;
    if (unit === "m") return val * 1_000_000;
    return val;
  }

  return null;
}

// Common application tips for typical resistor values
function getResistorApplicationTip(ohms: number): string {
  if (ohms === 220 || ohms === 330) return "Ideal current-limiting resistor for 5V microcontroller powering Standard Red/Green/Yellow LEDs (15–20mA).";
  if (ohms === 150 || ohms === 180) return "Ideal current-limiting resistor for 3.3V ESP32/RP2040 powering Red/Yellow LEDs (10–15mA).";
  if (ohms === 1000) return "Standard base resistor for NPN transistors (e.g. 2N2222, BC547) or 5V-to-3.3V voltage divider top branch (R1).";
  if (ohms === 2000) return "Standard bottom resistor (R2) for stepping 5V logic down to 3.3V ADC/GPIO safe level with 1kΩ R1.";
  if (ohms === 4700) return "Standard I2C Bus Pull-Up resistor (SDA & SCL lines on 3.3V & 5V) or DS18B20 1-Wire pull-up.";
  if (ohms === 10000) return "Standard active-low Pushbutton Pull-Up, ESP32 EN/Reset pull-up, or LDR light sensor voltage divider.";
  if (ohms === 100000) return "High-impedance pull-down / gate bleeder resistor for MOSFETs (IRLZ44N) or audio input bias.";
  if (ohms === 1000000) return "Ultra-high impedance sensor bias (pH probes, piezoelectric knock sensors, crystal oscillator loops).";
  if (ohms < 1) return "Current sense shunt resistor for measuring motor/supply amperage via ADC or INA219 sensor.";
  return "Standard electronic resistance value verified for general circuit biasing, timing, or dividers.";
}

interface ResistorColorToolProps {
  onApplySnippet?: (snippet: string) => void;
  targetBoard?: TargetBoard;
  apiKey?: string;
}

export const ResistorColorTool: React.FC<ResistorColorToolProps> = ({
  onApplySnippet,
  targetBoard = "ESP32 (WROOM-32)",
  apiKey = "",
}) => {
  // Band mode
  const [bandCount, setBandCount] = useState<BandCount>(4);
  const [activeSubView, setActiveSubView] = useState<"band_picker" | "reverse_lookup" | "smd_decoder" | "color_chart" | "ai_chat">("band_picker");

  // Band selections
  const [band1, setBand1] = useState<string>("yellow"); // 4
  const [band2, setBand2] = useState<string>("violet"); // 7
  const [band3, setBand3] = useState<string>("black");  // 0 (used for 5 & 6 band)
  const [multiplier, setMultiplier] = useState<string>("red"); // 100
  const [tolerance, setTolerance] = useState<string>("gold"); // 5%
  const [tempco, setTempco] = useState<string>("red"); // 50 ppm (6-band)

  // Reverse Lookup State
  const [reverseInput, setReverseInput] = useState<string>("4.7k");
  const [reverseTolerance, setReverseTolerance] = useState<string>("gold");

  // SMD Decoder State
  const [smdInput, setSmdInput] = useState<string>("472");

  // Chat State
  const [chatQuery, setChatQuery] = useState<string>("");
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "bot"; text: string }>>([
    {
      sender: "bot",
      text: "👋 **Resistor Color & Component Expert Ready!**\n\nAsk me any resistor question! For example:\n• *\"What colors make a 10k ohm 5% resistor?\"*\n• *\"Decode: Brown Black Red Gold\"*\n• *\"How do I calculate an LED resistor for 5V?\"*\n• *\"What does a 103 or 4702 SMD resistor mean?\"*",
    },
  ]);

  // Copy Feedback
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [appliedText, setAppliedText] = useState<boolean>(false);

  // --- Calculate Resistance from Selected Bands ---
  const calculation = useMemo(() => {
    const b1 = COLOR_TABLE[band1];
    const b2 = COLOR_TABLE[band2];
    const b3 = COLOR_TABLE[band3];
    const mult = COLOR_TABLE[multiplier];
    const tol = COLOR_TABLE[tolerance];
    const tc = COLOR_TABLE[tempco];

    if (!b1 || !b2 || !mult || !tol) {
      return { ohms: 0, formatted: "0 Ω", tolerancePercent: 5, minOhms: 0, maxOhms: 0, isE24: false, tip: "" };
    }

    let digitsVal = 0;
    if (bandCount === 4) {
      digitsVal = (b1.digit ?? 0) * 10 + (b2.digit ?? 0);
    } else {
      // 5 or 6 band
      digitsVal = (b1.digit ?? 0) * 100 + (b2.digit ?? 0) * 10 + (b3?.digit ?? 0);
    }

    const ohms = digitsVal * (mult.multiplier ?? 1);
    const tolPercent = tol.tolerance ?? 5;
    const minOhms = ohms * (1 - tolPercent / 100);
    const maxOhms = ohms * (1 + tolPercent / 100);

    // Check if matching standard E24/E12
    const logVal = ohms > 0 ? Math.log10(ohms) : 0;
    const exp = Math.floor(logVal) - 1;
    const norm = Math.round((ohms / Math.pow(10, exp)) * 10) / 10;
    const isE24 = E24_BASE.some((val) => Math.abs(val - norm) < 0.2);
    const isE12 = E12_BASE.some((val) => Math.abs(val - norm) < 0.2);

    const tip = getResistorApplicationTip(ohms);

    // Sequence of color names
    const colorNames =
      bandCount === 4
        ? [b1.name, b2.name, mult.name, tol.name]
        : bandCount === 5
        ? [b1.name, b2.name, b3.name, mult.name, tol.name]
        : [b1.name, b2.name, b3.name, mult.name, tol.name, tc.name];

    return {
      ohms,
      formatted: formatOhms(ohms),
      tolPercent,
      tolStr: tol.toleranceStr || `±${tolPercent}%`,
      tempcoVal: bandCount === 6 ? tc.tempco : null,
      minOhms,
      maxOhms,
      isE24,
      isE12,
      tip,
      colorNames,
    };
  }, [bandCount, band1, band2, band3, multiplier, tolerance, tempco]);

  // --- Calculate Bands from Resistance Value (Reverse Lookup) ---
  const reverseResult = useMemo(() => {
    const targetOhms = parseResistanceInput(reverseInput);
    if (targetOhms === null || targetOhms <= 0) {
      return null;
    }

    const tolDef = COLOR_TABLE[reverseTolerance] || COLOR_TABLE.gold;

    // 4-band calculation: 2 digits + multiplier
    const log10 = Math.log10(targetOhms);
    const exp4 = Math.floor(log10) - 1;
    const norm4 = targetOhms / Math.pow(10, exp4);
    const roundedNorm4 = Math.round(norm4);
    const digit1_4 = Math.floor(roundedNorm4 / 10);
    const digit2_4 = roundedNorm4 % 10;

    // Find multiplier color key
    const multVal4 = Math.pow(10, exp4);
    const multKey4 = Object.keys(COLOR_TABLE).find((k) => Math.abs((COLOR_TABLE[k].multiplier ?? 0) - multVal4) < multVal4 * 0.01) || "black";
    const d1Key4 = Object.keys(COLOR_TABLE).find((k) => COLOR_TABLE[k].digit === digit1_4) || "brown";
    const d2Key4 = Object.keys(COLOR_TABLE).find((k) => COLOR_TABLE[k].digit === digit2_4) || "black";

    // 5-band calculation: 3 digits + multiplier
    const exp5 = Math.floor(log10) - 2;
    const norm5 = targetOhms / Math.pow(10, exp5);
    const roundedNorm5 = Math.round(norm5);
    const digit1_5 = Math.floor(roundedNorm5 / 100);
    const digit2_5 = Math.floor((roundedNorm5 % 100) / 10);
    const digit3_5 = roundedNorm5 % 10;

    const multVal5 = Math.pow(10, exp5);
    const multKey5 = Object.keys(COLOR_TABLE).find((k) => Math.abs((COLOR_TABLE[k].multiplier ?? 0) - multVal5) < multVal5 * 0.01) || "black";
    const d1Key5 = Object.keys(COLOR_TABLE).find((k) => COLOR_TABLE[k].digit === digit1_5) || "brown";
    const d2Key5 = Object.keys(COLOR_TABLE).find((k) => COLOR_TABLE[k].digit === digit2_5) || "black";
    const d3Key5 = Object.keys(COLOR_TABLE).find((k) => COLOR_TABLE[k].digit === digit3_5) || "black";

    // Nearest standard E24 value
    const e24BaseNorm = targetOhms / Math.pow(10, Math.floor(log10) - 1);
    let nearestE24 = E24_BASE[0];
    let minDiff = Infinity;
    for (const b of E24_BASE) {
      const diff = Math.abs(b - e24BaseNorm);
      if (diff < minDiff) {
        minDiff = diff;
        nearestE24 = b;
      }
    }
    const nearestE24Ohms = nearestE24 * Math.pow(10, Math.floor(log10) - 1);

    return {
      ohms: targetOhms,
      formatted: formatOhms(targetOhms),
      fourBand: {
        b1: d1Key4,
        b2: d2Key4,
        mult: multKey4,
        tol: reverseTolerance,
        sequence: [COLOR_TABLE[d1Key4]?.name, COLOR_TABLE[d2Key4]?.name, COLOR_TABLE[multKey4]?.name, tolDef.name],
      },
      fiveBand: {
        b1: d1Key5,
        b2: d2Key5,
        b3: d3Key5,
        mult: multKey5,
        tol: "brown", // 1%
        sequence: [COLOR_TABLE[d1Key5]?.name, COLOR_TABLE[d2Key5]?.name, COLOR_TABLE[d3Key5]?.name, COLOR_TABLE[multKey5]?.name, "Brown"],
      },
      nearestE24Ohms,
      nearestE24Formatted: formatOhms(nearestE24Ohms),
      isExactE24: Math.abs(nearestE24Ohms - targetOhms) < 0.001,
    };
  }, [reverseInput, reverseTolerance]);

  // --- SMD Resistor Code Decoder ---
  const smdResult = useMemo(() => {
    const raw = smdInput.trim().toUpperCase();
    if (!raw) return null;

    // 1. Check for 'R' notation (e.g. 0R5 = 0.5Ω, 4R7 = 4.7Ω, R22 = 0.22Ω)
    if (raw.includes("R")) {
      const parts = raw.split("R");
      const val = parseFloat(`${parts[0] || "0"}.${parts[1] || "0"}`);
      if (!isNaN(val)) {
        return {
          code: raw,
          ohms: val,
          formatted: formatOhms(val),
          type: "Standard R-Decimal Notation",
          tolerance: "±1% to ±5%",
          description: `R represents the decimal point: ${raw} = ${val} Ω`,
        };
      }
    }

    // 2. Check 3-Digit Code (e.g. 103 = 10 * 10^3 = 10kΩ, 472 = 4.7kΩ)
    if (/^\d{3}$/.test(raw)) {
      const d1 = parseInt(raw[0], 10);
      const d2 = parseInt(raw[1], 10);
      const mult = parseInt(raw[2], 10);
      const ohms = (d1 * 10 + d2) * Math.pow(10, mult);
      return {
        code: raw,
        ohms,
        formatted: formatOhms(ohms),
        type: "3-Digit EIA Standard (5% Tolerance)",
        tolerance: "±5%",
        description: `Digits: ${d1}${d2} × 10^${mult} = ${ohms.toLocaleString()} Ω (${formatOhms(ohms)})`,
      };
    }

    // 3. Check 4-Digit Code (e.g. 1002 = 100 * 10^2 = 10kΩ 1%, 4701 = 4.7kΩ)
    if (/^\d{4}$/.test(raw)) {
      const d1 = parseInt(raw[0], 10);
      const d2 = parseInt(raw[1], 10);
      const d3 = parseInt(raw[2], 10);
      const mult = parseInt(raw[3], 10);
      const ohms = (d1 * 100 + d2 * 10 + d3) * Math.pow(10, mult);
      return {
        code: raw,
        ohms,
        formatted: formatOhms(ohms),
        type: "4-Digit Precision EIA (1% Tolerance)",
        tolerance: "±1%",
        description: `Digits: ${d1}${d2}${d3} × 10^${mult} = ${ohms.toLocaleString()} Ω (${formatOhms(ohms)})`,
      };
    }

    // 4. Check EIA-96 2-digit + letter (e.g. 01Y, 68A)
    const eia96Match = raw.match(/^(\d{2})([A-Z])$/);
    if (eia96Match) {
      const codeNum = eia96Match[1];
      const multLetter = eia96Match[2];
      const EIA96_TABLE: Record<string, number> = {
        "01": 100, "02": 102, "03": 105, "04": 107, "05": 110, "06": 113, "07": 115, "08": 118,
        "09": 121, "10": 124, "11": 127, "12": 130, "13": 133, "14": 137, "15": 140, "16": 143,
        "17": 147, "18": 150, "19": 154, "20": 158, "21": 162, "22": 165, "23": 169, "24": 174,
        "25": 178, "26": 182, "27": 187, "28": 191, "29": 196, "30": 200, "31": 205, "32": 210,
        "33": 215, "34": 221, "35": 226, "36": 232, "37": 237, "38": 243, "39": 249, "40": 255,
        "41": 261, "42": 267, "43": 274, "44": 280, "45": 287, "46": 294, "47": 301, "48": 309,
        "49": 316, "50": 324, "51": 332, "52": 340, "53": 348, "54": 357, "55": 365, "56": 374,
        "57": 383, "58": 392, "59": 402, "60": 412, "61": 422, "62": 432, "63": 442, "64": 453,
        "65": 464, "66": 475, "67": 487, "68": 499, "69": 511, "70": 523, "71": 536, "72": 549,
        "73": 562, "74": 576, "75": 590, "76": 604, "77": 619, "78": 634, "79": 649, "80": 665,
        "81": 681, "82": 698, "83": 715, "84": 732, "85": 750, "86": 768, "87": 787, "88": 806,
        "89": 825, "90": 845, "91": 866, "92": 887, "93": 909, "94": 931, "95": 953, "96": 976,
      };

      const EIA96_MULT: Record<string, number> = {
        Y: 0.01, X: 0.1, A: 1, B: 10, C: 100, D: 1000, E: 10000, F: 100000,
      };

      const baseVal = EIA96_TABLE[codeNum];
      const multVal = EIA96_MULT[multLetter];
      if (baseVal && multVal !== undefined) {
        const ohms = baseVal * multVal;
        return {
          code: raw,
          ohms,
          formatted: formatOhms(ohms),
          type: "EIA-96 Precision 1% SMD Code",
          tolerance: "±1%",
          description: `EIA-96 Lookup: Code '${codeNum}' = ${baseVal}, Multiplier '${multLetter}' = ×${multVal} -> ${formatOhms(ohms)}`,
        };
      }
    }

    return {
      code: raw,
      ohms: 0,
      formatted: "Invalid SMD Code",
      type: "Unrecognized Format",
      tolerance: "N/A",
      description: "Please enter a 3-digit code (e.g. 103, 472), 4-digit code (e.g. 1002, 4701), or R-notation (e.g. 0R5, 4R7).",
    };
  }, [smdInput]);

  // --- Copy / Apply Handlers ---
  const handleCopyCode = () => {
    const text = `${calculation.colorNames.join(" - ")} (${calculation.formatted} ${calculation.tolStr})`;
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleApplyToPrompt = () => {
    const text = `Resistor: ${calculation.formatted} (${calculation.colorNames.join(" • ")}, ${calculation.tolStr})`;
    if (onApplySnippet) {
      onApplySnippet(text);
      setAppliedText(true);
      setTimeout(() => setAppliedText(false), 2500);
    }
  };

  // --- Send Resistor AI Chat Query ---
  const handleSendChat = async (presetText?: string) => {
    const query = presetText || chatQuery.trim();
    if (!query) return;

    const userMsg = { sender: "user" as const, text: query };
    setChatMessages((prev) => [...prev, userMsg]);
    if (!presetText) setChatQuery("");
    setIsChatLoading(true);

    try {
      const res = await fetch("/api/v1/hardware-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: query }],
          targetBoard,
          rolePreset: "resistor",
          custom_api_key: apiKey,
        }),
      });

      if (!res.ok) {
        throw new Error("Chat request failed");
      }

      const data = await res.json();
      const botText = data.response || "No response received.";
      setChatMessages((prev) => [...prev, { sender: "bot", text: botText }]);
    } catch (err) {
      // High-quality local offline fallback answer if server is unavailable or offline
      let localAnswer = "Here is the verified resistor calculation:";
      const qLower = query.toLowerCase();

      if (qLower.includes("4.7k") || qLower.includes("4k7")) {
        localAnswer = "🟤 **4.7 kΩ Resistor Color Code (5% Tolerance)**:\n\n• **Band 1 (Digit 4)**: 🟡 **Yellow**\n• **Band 2 (Digit 7)**: 🟣 **Violet**\n• **Band 3 (Multiplier ×100)**: 🔴 **Red**\n• **Band 4 (Tolerance ±5%)**: 🟡 **Gold**\n\n📌 *Common Applications*: Standard I2C pull-up resistor (SDA/SCL) and DS18B20 1-Wire temperature sensor data pull-up.";
      } else if (qLower.includes("10k")) {
        localAnswer = "🟤 **10 kΩ Resistor Color Code (5% Tolerance)**:\n\n• **Band 1 (Digit 1)**: 🟤 **Brown**\n• **Band 2 (Digit 0)**: ⬛ **Black**\n• **Band 3 (Multiplier ×1,000)**: 🟠 **Orange**\n• **Band 4 (Tolerance ±5%)**: 🟡 **Gold**\n\n📌 *Common Applications*: Standard push-button pull-up/pull-down resistor, reset line pull-up, and LDR light divider.";
      } else if (qLower.includes("220") || qLower.includes("330")) {
        localAnswer = "🟤 **220 Ω Resistor Color Code (5% Tolerance)**:\n\n• **Band 1 (Digit 2)**: 🔴 **Red**\n• **Band 2 (Digit 2)**: 🔴 **Red**\n• **Band 3 (Multiplier ×10)**: 🟤 **Brown**\n• **Band 4 (Tolerance ±5%)**: 🟡 **Gold**\n\n📌 *Common Applications*: Standard 5V LED current limiting ballast resistor (provides ~15mA for Red/Green/Yellow LEDs).";
      } else if (qLower.includes("1k")) {
        localAnswer = "🟤 **1 kΩ Resistor Color Code (5% Tolerance)**:\n\n• **Band 1 (Digit 1)**: 🟤 **Brown**\n• **Band 2 (Digit 0)**: ⬛ **Black**\n• **Band 3 (Multiplier ×100)**: 🔴 **Red**\n• **Band 4 (Tolerance ±5%)**: 🟡 **Gold**\n\n📌 *Common Applications*: Transistor base drive resistor (BC547/2N2222) and voltage divider top branch (R1) for 5V to 3.3V conversion.";
      } else if (qLower.includes("mnemonic") || qLower.includes("bbroy")) {
        localAnswer = "🧠 **Resistor Color Code Mnemonic Guide**:\n\n**\"BBROY of Great Britain had a Very Good Wife wearing Gold Silver\"**\n\n• **B**lack = 0\n• **B**rown = 1\n• **R**ed = 2\n• **O**range = 3\n• **Y**ellow = 4\n• **G**reen = 5\n• **B**lue = 6\n• **V**iolet = 7\n• **G**ray = 8\n• **W**hite = 9\n• **G**old = Multiplier ×0.1 (±5% Tolerance)\n• **S**ilver = Multiplier ×0.01 (±10% Tolerance)";
      } else if (qLower.includes("103") || qLower.includes("smd")) {
        localAnswer = "🏷️ **SMD 103 Resistor Decoding**:\n\n• First two digits = **10**\n• Third digit (Multiplier) = **3** (10³ = 1,000)\n• **Total Resistance** = 10 × 1,000 = **10,000 Ω = 10 kΩ (±5%)**\n\n*4-Digit Precision equivalent*: `1002` (100 × 10² = 10 kΩ 1%).";
      } else {
        localAnswer = `Here is your resistor analysis for **${query}**:\n\n• **Standard Formula**: Resistance = (Significant Digits) × Multiplier\n• **Tolerance**: Gold (±5%), Silver (±10%), Brown (±1%)\n• **Power Check**: Always verify power dissipation P = V² / R or I² × R does not exceed 0.25W for standard 1/4W through-hole resistors.`;
      }

      setChatMessages((prev) => [...prev, { sender: "bot", text: localAnswer }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Helper to load reverse calculation values into band picker
  const handleLoadIntoPicker = (b1Key: string, b2Key: string, multKey: string, tolKey: string, b3Key?: string) => {
    setBand1(b1Key);
    setBand2(b2Key);
    if (b3Key) setBand3(b3Key);
    setMultiplier(multKey);
    setTolerance(tolKey);
    setActiveSubView("band_picker");
  };

  return (
    <div className="space-y-6">
      {/* Sub-View Navigation Tabs */}
      <div className="bg-[#121626] border border-[#20273a] p-1.5 rounded-2xl flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={() => setActiveSubView("band_picker")}
            className={`px-3 py-1.5 rounded-xl text-xs font-tech font-bold flex items-center gap-1.5 transition cursor-pointer ${
              activeSubView === "band_picker"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs"
                : "text-slate-400 hover:text-slate-200 hover:bg-[#1a2136]"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Interactive Band Decoder</span>
          </button>

          <button
            onClick={() => setActiveSubView("reverse_lookup")}
            className={`px-3 py-1.5 rounded-xl text-xs font-tech font-bold flex items-center gap-1.5 transition cursor-pointer ${
              activeSubView === "reverse_lookup"
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-xs"
                : "text-slate-400 hover:text-slate-200 hover:bg-[#1a2136]"
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Value → Color Bands</span>
          </button>

          <button
            onClick={() => setActiveSubView("smd_decoder")}
            className={`px-3 py-1.5 rounded-xl text-xs font-tech font-bold flex items-center gap-1.5 transition cursor-pointer ${
              activeSubView === "smd_decoder"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs"
                : "text-slate-400 hover:text-slate-200 hover:bg-[#1a2136]"
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            <span>SMD Code Decoder</span>
          </button>

          <button
            onClick={() => setActiveSubView("color_chart")}
            className={`px-3 py-1.5 rounded-xl text-xs font-tech font-bold flex items-center gap-1.5 transition cursor-pointer ${
              activeSubView === "color_chart"
                ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-xs"
                : "text-slate-400 hover:text-slate-200 hover:bg-[#1a2136]"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Color Code Chart & Mnemonics</span>
          </button>
        </div>

        <button
          onClick={() => setActiveSubView("ai_chat")}
          className={`px-3 py-1.5 rounded-xl text-xs font-tech font-bold flex items-center gap-1.5 transition cursor-pointer ${
            activeSubView === "ai_chat"
              ? "bg-gradient-to-r from-amber-500/30 to-orange-500/30 text-amber-200 border border-amber-500/50 shadow-xs"
              : "text-amber-400 hover:bg-amber-500/10 border border-amber-500/20"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Resistor AI Chat Assistant</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. INTERACTIVE BAND DECODER (4, 5, 6 BAND) */}
      {/* ========================================================================= */}
      {activeSubView === "band_picker" && (
        <div className="space-y-6">
          {/* Top Control Header: Band Count Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#13182a] border border-[#20273a] p-4 rounded-2xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-tech font-bold text-slate-300 uppercase tracking-wider">
                Select Resistor Type:
              </span>
              <div className="inline-flex bg-[#0b0e18] p-1 rounded-xl border border-[#1f263b]">
                {([4, 5, 6] as BandCount[]).map((count) => (
                  <button
                    key={count}
                    onClick={() => setBandCount(count)}
                    className={`px-3 py-1 rounded-lg text-xs font-tech font-bold transition cursor-pointer ${
                      bandCount === count
                        ? "bg-amber-500 text-slate-950 shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {count}-Band {count === 4 ? "(Standard 5%)" : count === 5 ? "(Precision 1%)" : "(High-Precision)"}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCode}
                className="px-3 py-1.5 bg-[#1a2136] hover:bg-[#232b45] text-slate-200 border border-[#2b3552] rounded-xl text-xs font-tech font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copiedText ? "Copied!" : "Copy Bands"}</span>
              </button>

              {onApplySnippet && (
                <button
                  onClick={handleApplyToPrompt}
                  className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-tech font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  {appliedText ? <Check className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                  <span>{appliedText ? "Inserted into Project!" : "Apply to Prompt"}</span>
                </button>
              )}
            </div>
          </div>

          {/* Realistic SVG Resistor Display Graphic */}
          <div className="bg-[#0b0e18] border border-[#20273a] p-6 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
            {/* Subtle Grid Ambient */}
            <div className="absolute inset-0 bg-[radial-gradient(#1f263b_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />

            {/* SVG Visual Resistor */}
            <div className="w-full max-w-xl py-2 relative z-10">
              <svg viewBox="0 0 540 130" className="w-full h-auto drop-shadow-[0_10px_25px_rgba(0,0,0,0.6)]">
                {/* Left & Right Metal Lead Wires */}
                <path d="M 0 65 L 120 65" stroke="#94a3b8" strokeWidth="8" strokeLinecap="round" />
                <path d="M 420 65 L 540 65" stroke="#94a3b8" strokeWidth="8" strokeLinecap="round" />
                {/* Solder lead shine */}
                <path d="M 0 63 L 120 63" stroke="#f8fafc" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                <path d="M 420 63 L 540 63" stroke="#f8fafc" strokeWidth="2" strokeLinecap="round" opacity="0.6" />

                {/* Resistor Ceramic Body: Beige for 4-band, Light Cyan/Blue for 5/6-band precision metal film */}
                <defs>
                  <linearGradient id="carbonBodyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fef3c7" />
                    <stop offset="25%" stopColor="#fde68a" />
                    <stop offset="50%" stopColor="#f59e0b" />
                    <stop offset="75%" stopColor="#d97706" />
                    <stop offset="100%" stopColor="#78350f" />
                  </linearGradient>
                  <linearGradient id="metalFilmBodyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e0f2fe" />
                    <stop offset="25%" stopColor="#bae6fd" />
                    <stop offset="50%" stopColor="#38bdf8" />
                    <stop offset="75%" stopColor="#0284c7" />
                    <stop offset="100%" stopColor="#0369a1" />
                  </linearGradient>
                  <linearGradient id="glossHighlight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
                    <stop offset="35%" stopColor="#ffffff" stopOpacity="0.1" />
                    <stop offset="70%" stopColor="#000000" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#000000" stopOpacity="0.6" />
                  </linearGradient>
                </defs>

                {/* Resistor Body Geometry */}
                <path
                  d="M 120 40 
                     C 120 20, 150 20, 160 30 
                     C 170 35, 175 35, 185 35 
                     L 355 35 
                     C 365 35, 370 35, 380 30 
                     C 390 20, 420 20, 420 40 
                     L 420 90 
                     C 420 110, 390 110, 380 100 
                     C 370 95, 365 95, 355 95 
                     L 185 95 
                     C 175 95, 170 95, 160 100 
                     C 150 110, 120 110, 120 90 
                     Z"
                  fill={bandCount === 4 ? "url(#carbonBodyGrad)" : "url(#metalFilmBodyGrad)"}
                  stroke="#0f172a"
                  strokeWidth="2"
                />

                {/* --- COLOR BANDS --- */}
                {/* Band 1: 1st Digit */}
                <rect x="155" y="24" width="16" height="82" rx="3" fill={COLOR_TABLE[band1]?.hex || "#78350f"} />
                <rect x="155" y="24" width="16" height="82" rx="3" fill="url(#glossHighlight)" />

                {/* Band 2: 2nd Digit */}
                <rect x="195" y="35" width="16" height="60" rx="2" fill={COLOR_TABLE[band2]?.hex || "#9333ea"} />
                <rect x="195" y="35" width="16" height="60" rx="2" fill="url(#glossHighlight)" />

                {/* Band 3: 3rd Digit (5/6 band) or Multiplier (4-band) */}
                {bandCount === 4 ? (
                  // Multiplier on 4-band
                  <>
                    <rect x="245" y="35" width="16" height="60" rx="2" fill={COLOR_TABLE[multiplier]?.hex || "#e11d48"} />
                    <rect x="245" y="35" width="16" height="60" rx="2" fill="url(#glossHighlight)" />
                  </>
                ) : (
                  // 3rd Digit on 5/6 band
                  <>
                    <rect x="235" y="35" width="16" height="60" rx="2" fill={COLOR_TABLE[band3]?.hex || "#0f172a"} />
                    <rect x="235" y="35" width="16" height="60" rx="2" fill="url(#glossHighlight)" />
                    {/* Multiplier on 5/6 band */}
                    <rect x="275" y="35" width="16" height="60" rx="2" fill={COLOR_TABLE[multiplier]?.hex || "#e11d48"} />
                    <rect x="275" y="35" width="16" height="60" rx="2" fill="url(#glossHighlight)" />
                  </>
                )}

                {/* Tolerance Band (Distinct wide gap spacing) */}
                <rect x="345" y="35" width="18" height="60" rx="2" fill={COLOR_TABLE[tolerance]?.hex || "#d97706"} />
                <rect x="345" y="35" width="18" height="60" rx="2" fill="url(#glossHighlight)" />

                {/* TempCo Band for 6-Band */}
                {bandCount === 6 && (
                  <>
                    <rect x="375" y="24" width="14" height="82" rx="3" fill={COLOR_TABLE[tempco]?.hex || "#e11d48"} />
                    <rect x="375" y="24" width="14" height="82" rx="3" fill="url(#glossHighlight)" />
                  </>
                )}

                {/* Resistor Highlight Reflection Overlay */}
                <path
                  d="M 125 45 C 140 32, 400 32, 415 45"
                  stroke="#ffffff"
                  strokeWidth="3"
                  strokeLinecap="round"
                  opacity="0.45"
                  fill="none"
                />
              </svg>
            </div>

            {/* Live Result Metric Banner */}
            <div className="w-full bg-[#13182b] border border-[#232d47] p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 mt-2">
              <div>
                <div className="flex items-baseline gap-2.5">
                  <span className="text-3xl font-display font-black text-white tracking-tight">
                    {calculation.formatted}
                  </span>
                  <span className="text-sm font-tech font-bold text-amber-400 bg-amber-950/60 border border-amber-500/40 px-2.5 py-0.5 rounded-lg">
                    {calculation.tolStr}
                  </span>
                  {bandCount === 6 && calculation.tempcoVal && (
                    <span className="text-xs font-mono text-indigo-300 bg-indigo-950/60 border border-indigo-500/40 px-2 py-0.5 rounded-lg">
                      {calculation.tempcoVal} ppm/°C
                    </span>
                  )}
                </div>
                <div className="text-xs font-mono text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                  <span>Exact: <strong>{calculation.ohms.toLocaleString()} Ω</strong></span>
                  <span>•</span>
                  <span>Range: <strong>{formatOhms(calculation.minOhms)} – {formatOhms(calculation.maxOhms)}</strong></span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5 text-right">
                <div className="flex items-center gap-1.5">
                  {calculation.isE24 ? (
                    <span className="text-[11px] font-tech font-semibold text-emerald-400 bg-emerald-950/70 border border-emerald-500/40 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Standard E24 Value
                    </span>
                  ) : (
                    <span className="text-[11px] font-tech font-semibold text-amber-400 bg-amber-950/70 border border-amber-500/40 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Info className="w-3 h-3" /> Non-Standard / Precision Value
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 font-sans max-w-sm">
                  {calculation.tip}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Color Band Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-tech">
            {/* Band 1: 1st Digit */}
            <div className="bg-[#121626] border border-[#20273a] p-4 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Band 1 (1st Digit)</span>
                </label>
                <span className="text-xs font-mono font-bold text-amber-400 uppercase">
                  {COLOR_TABLE[band1]?.name} ({COLOR_TABLE[band1]?.digit})
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {Object.keys(COLOR_TABLE)
                  .filter((k) => COLOR_TABLE[k].digit !== null && COLOR_TABLE[k].digit !== 0) // Band 1 cannot be 0, gold, silver
                  .map((key) => {
                    const c = COLOR_TABLE[key];
                    const isSelected = band1 === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setBand1(key)}
                        title={`${c.name} (${c.digit})`}
                        className={`h-8 rounded-xl flex items-center justify-center font-bold text-xs transition cursor-pointer relative ${c.bgClass} ${c.textColor} ${
                          isSelected ? "ring-2 ring-white ring-offset-2 ring-offset-[#0e121f] scale-105" : "opacity-80 hover:opacity-100"
                        }`}
                      >
                        {c.digit}
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Band 2: 2nd Digit */}
            <div className="bg-[#121626] border border-[#20273a] p-4 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <span>Band 2 (2nd Digit)</span>
                </label>
                <span className="text-xs font-mono font-bold text-indigo-400 uppercase">
                  {COLOR_TABLE[band2]?.name} ({COLOR_TABLE[band2]?.digit})
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {Object.keys(COLOR_TABLE)
                  .filter((k) => COLOR_TABLE[k].digit !== null) // Band 2 can be 0-9
                  .map((key) => {
                    const c = COLOR_TABLE[key];
                    const isSelected = band2 === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setBand2(key)}
                        title={`${c.name} (${c.digit})`}
                        className={`h-8 rounded-xl flex items-center justify-center font-bold text-xs transition cursor-pointer relative ${c.bgClass} ${c.textColor} ${
                          isSelected ? "ring-2 ring-white ring-offset-2 ring-offset-[#0e121f] scale-105" : "opacity-80 hover:opacity-100"
                        }`}
                      >
                        {c.digit}
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Band 3: 3rd Digit (If 5 or 6 Band) */}
            {bandCount >= 5 && (
              <div className="bg-[#121626] border border-[#20273a] p-4 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>Band 3 (3rd Digit)</span>
                  </label>
                  <span className="text-xs font-mono font-bold text-emerald-400 uppercase">
                    {COLOR_TABLE[band3]?.name} ({COLOR_TABLE[band3]?.digit})
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {Object.keys(COLOR_TABLE)
                    .filter((k) => COLOR_TABLE[k].digit !== null)
                    .map((key) => {
                      const c = COLOR_TABLE[key];
                      const isSelected = band3 === key;
                      return (
                        <button
                          key={key}
                          onClick={() => setBand3(key)}
                          title={`${c.name} (${c.digit})`}
                          className={`h-8 rounded-xl flex items-center justify-center font-bold text-xs transition cursor-pointer relative ${c.bgClass} ${c.textColor} ${
                            isSelected ? "ring-2 ring-white ring-offset-2 ring-offset-[#0e121f] scale-105" : "opacity-80 hover:opacity-100"
                          }`}
                        >
                          {c.digit}
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Multiplier Band */}
            <div className="bg-[#121626] border border-[#20273a] p-4 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>Multiplier Band</span>
                </label>
                <span className="text-xs font-mono font-bold text-rose-400">
                  {COLOR_TABLE[multiplier]?.name} (×{COLOR_TABLE[multiplier]?.multiplier?.toLocaleString()})
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {["silver", "gold", "black", "brown", "red", "orange", "yellow", "green", "blue", "violet", "gray", "white"].map((key) => {
                  const c = COLOR_TABLE[key];
                  const isSelected = multiplier === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setMultiplier(key)}
                      title={`${c.name} (×${c.multiplier})`}
                      className={`h-8 rounded-xl flex items-center justify-center font-mono font-bold text-[10.5px] transition cursor-pointer ${c.bgClass} ${c.textColor} ${
                        isSelected ? "ring-2 ring-white ring-offset-2 ring-offset-[#0e121f] scale-105" : "opacity-80 hover:opacity-100"
                      }`}
                    >
                      {c.multiplier !== null ? (c.multiplier >= 1_000_000 ? `${c.multiplier / 1_000_000}M` : c.multiplier >= 1_000 ? `${c.multiplier / 1_000}k` : `${c.multiplier}`) : "x"}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tolerance Band */}
            <div className="bg-[#121626] border border-[#20273a] p-4 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span>Tolerance Band</span>
                </label>
                <span className="text-xs font-mono font-bold text-amber-300">
                  {COLOR_TABLE[tolerance]?.name} ({COLOR_TABLE[tolerance]?.toleranceStr})
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {["gold", "silver", "brown", "red", "green", "blue", "violet", "gray"].map((key) => {
                  const c = COLOR_TABLE[key];
                  const isSelected = tolerance === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setTolerance(key)}
                      title={`${c.name} (${c.toleranceStr})`}
                      className={`h-8 rounded-xl flex items-center justify-center font-mono font-bold text-[10px] transition cursor-pointer ${c.bgClass} ${c.textColor} ${
                        isSelected ? "ring-2 ring-white ring-offset-2 ring-offset-[#0e121f] scale-105" : "opacity-80 hover:opacity-100"
                      }`}
                    >
                      {c.toleranceStr ? c.toleranceStr.split(" ")[0] : "±5%"}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TempCo Band (Only 6-Band) */}
            {bandCount === 6 && (
              <div className="bg-[#121626] border border-[#20273a] p-4 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                    <span>TempCo Band</span>
                  </label>
                  <span className="text-xs font-mono font-bold text-purple-300">
                    {COLOR_TABLE[tempco]?.name} ({COLOR_TABLE[tempco]?.tempco} ppm)
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {["brown", "red", "orange", "yellow", "blue", "violet"].map((key) => {
                    const c = COLOR_TABLE[key];
                    const isSelected = tempco === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setTempco(key)}
                        title={`${c.name} (${c.tempco} ppm/°C)`}
                        className={`h-8 rounded-xl flex items-center justify-center font-mono font-bold text-[10px] transition cursor-pointer ${c.bgClass} ${c.textColor} ${
                          isSelected ? "ring-2 ring-white ring-offset-2 ring-offset-[#0e121f] scale-105" : "opacity-80 hover:opacity-100"
                        }`}
                      >
                        {c.tempco}ppm
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. REVERSE LOOKUP (RESISTANCE VALUE -> COLOR BANDS) */}
      {/* ========================================================================= */}
      {activeSubView === "reverse_lookup" && (
        <div className="space-y-6">
          <div className="bg-[#121626] border border-[#20273a] p-5 rounded-2xl space-y-4">
            <div>
              <h3 className="text-sm font-display font-bold text-white mb-1">
                Enter Resistance Value to Generate Color Bands
              </h3>
              <p className="text-xs text-slate-400 font-tech">
                Type any standard or custom resistance value (e.g. <code>4.7k</code>, <code>220</code>, <code>10k</code>, <code>1M</code>, <code>0.47</code>, <code>100R</code>).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-tech font-bold text-slate-300">Resistance Input</label>
                <div className="relative">
                  <input
                    type="text"
                    value={reverseInput}
                    onChange={(e) => setReverseInput(e.target.value)}
                    placeholder="e.g. 4.7k, 220, 10k, 1M, 0.5R"
                    className="w-full bg-[#0b0e18] border border-[#242c42] rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-indigo-500"
                  />
                  <div className="absolute right-3 top-2.5 text-xs text-slate-500 font-mono">
                    {reverseResult ? reverseResult.formatted : "Invalid"}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-tech font-bold text-slate-300">Desired Tolerance</label>
                <select
                  value={reverseTolerance}
                  onChange={(e) => setReverseTolerance(e.target.value)}
                  className="w-full bg-[#0b0e18] border border-[#242c42] rounded-xl px-3 py-2.5 text-xs font-tech font-semibold text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="gold">Gold ±5% (Standard 4-Band)</option>
                  <option value="brown">Brown ±1% (Metal Film 5-Band)</option>
                  <option value="red">Red ±2% (Precision)</option>
                  <option value="silver">Silver ±10% (Legacy)</option>
                </select>
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-tech">
              <span className="text-slate-400 font-semibold">Common E24 Presets:</span>
              {["100", "220", "330", "470", "1k", "2.2k", "4.7k", "10k", "47k", "100k", "1M"].map((val) => (
                <button
                  key={val}
                  onClick={() => setReverseInput(val)}
                  className="px-2.5 py-1 bg-[#1a2136] hover:bg-[#252f4c] text-slate-300 rounded-lg border border-[#2a344f] transition cursor-pointer font-mono font-bold"
                >
                  {val}Ω
                </button>
              ))}
            </div>
          </div>

          {/* Reverse Calculated Results */}
          {reverseResult ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 4-Band Resistor Result */}
              <div className="bg-[#121626] border border-[#20273a] p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-display font-extrabold text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>4-Band Standard (5% Tolerance)</span>
                  </span>
                  <button
                    onClick={() =>
                      handleLoadIntoPicker(
                        reverseResult.fourBand.b1,
                        reverseResult.fourBand.b2,
                        reverseResult.fourBand.mult,
                        reverseResult.fourBand.tol
                      )
                    }
                    className="text-[11px] font-tech text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                  >
                    Load in Visualizer →
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {reverseResult.fourBand.sequence.map((colorName, idx) => {
                    const c = Object.values(COLOR_TABLE).find((x) => x.name.toLowerCase() === colorName.toLowerCase()) || COLOR_TABLE.black;
                    return (
                      <div
                        key={idx}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 shadow-xs ${c.bgClass} ${c.textColor} ${c.borderClass}`}
                      >
                        <span>Band {idx + 1}:</span>
                        <span>{colorName}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-[#0b0e18] p-3 rounded-xl border border-[#1e2539] text-xs font-mono text-slate-300 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Calculated Value:</span>
                    <span className="font-bold text-amber-400">{reverseResult.formatted} ±5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Color String:</span>
                    <span className="font-bold text-slate-200">{reverseResult.fourBand.sequence.join(" - ")}</span>
                  </div>
                </div>
              </div>

              {/* 5-Band Precision Result */}
              <div className="bg-[#121626] border border-[#20273a] p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-display font-extrabold text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                    <span>5-Band Precision (1% Metal Film)</span>
                  </span>
                  <button
                    onClick={() => {
                      setBandCount(5);
                      handleLoadIntoPicker(
                        reverseResult.fiveBand.b1,
                        reverseResult.fiveBand.b2,
                        reverseResult.fiveBand.mult,
                        reverseResult.fiveBand.tol,
                        reverseResult.fiveBand.b3
                      );
                    }}
                    className="text-[11px] font-tech text-sky-400 hover:text-sky-300 font-bold underline cursor-pointer"
                  >
                    Load in Visualizer →
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {reverseResult.fiveBand.sequence.map((colorName, idx) => {
                    const c = Object.values(COLOR_TABLE).find((x) => x.name.toLowerCase() === colorName.toLowerCase()) || COLOR_TABLE.black;
                    return (
                      <div
                        key={idx}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 shadow-xs ${c.bgClass} ${c.textColor} ${c.borderClass}`}
                      >
                        <span>Band {idx + 1}:</span>
                        <span>{colorName}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-[#0b0e18] p-3 rounded-xl border border-[#1e2539] text-xs font-mono text-slate-300 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Calculated Value:</span>
                    <span className="font-bold text-sky-400">{reverseResult.formatted} ±1%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Color String:</span>
                    <span className="font-bold text-slate-200">{reverseResult.fiveBand.sequence.join(" - ")}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 bg-[#121626] border border-[#20273a] rounded-2xl font-tech">
              Please enter a valid numeric resistance value above (e.g. 4.7k, 220, 10k).
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SMD RESISTOR CODE DECODER */}
      {/* ========================================================================= */}
      {activeSubView === "smd_decoder" && (
        <div className="space-y-6">
          <div className="bg-[#121626] border border-[#20273a] p-5 rounded-2xl space-y-4">
            <div>
              <h3 className="text-sm font-display font-bold text-white mb-1">
                SMD Surface-Mount Resistor Code Decoder
              </h3>
              <p className="text-xs text-slate-400 font-tech">
                Decode 3-digit (e.g. <code>103</code>, <code>472</code>), 4-digit (e.g. <code>1002</code>, <code>4701</code>), R-notation (e.g. <code>0R5</code>, <code>4R7</code>), or EIA-96 codes (e.g. <code>01Y</code>, <code>68A</code>).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-tech font-bold text-slate-300">Enter SMD Resistor Code</label>
                <input
                  type="text"
                  value={smdInput}
                  onChange={(e) => setSmdInput(e.target.value)}
                  placeholder="e.g. 103, 472, 1002, 0R5, 01Y"
                  className="w-full bg-[#0b0e18] border border-[#242c42] rounded-xl px-4 py-2.5 text-base font-mono font-bold text-amber-400 tracking-wider uppercase focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* SMD Resistor Realistic Black Chip Illustration */}
              <div className="flex flex-col items-center justify-center">
                <div className="w-36 h-18 bg-[#090b10] border-2 border-[#1e2539] rounded-lg relative flex items-center justify-center shadow-lg">
                  {/* Metal Terminals */}
                  <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-slate-400 to-slate-200 rounded-l-[4px]" />
                  <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-slate-400 to-slate-200 rounded-r-[4px]" />
                  {/* Printed Silk text */}
                  <span className="font-mono font-bold text-slate-200 text-sm tracking-wider">
                    {smdInput.trim().toUpperCase() || "SMD"}
                  </span>
                </div>
                <span className="text-[10px] font-tech text-slate-500 mt-1">SMD 0805 / 1206 Package</span>
              </div>
            </div>

            {/* Common SMD Presets */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-tech">
              <span className="text-slate-400 font-semibold">Common SMD Codes:</span>
              {[
                { code: "103", label: "103 (10kΩ)" },
                { code: "472", label: "472 (4.7kΩ)" },
                { code: "221", label: "221 (220Ω)" },
                { code: "331", label: "331 (330Ω)" },
                { code: "1002", label: "1002 (10kΩ 1%)" },
                { code: "4701", label: "4701 (4.7kΩ 1%)" },
                { code: "0R5", label: "0R5 (0.5Ω)" },
                { code: "01Y", label: "01Y (EIA-96 1Ω)" },
                { code: "68A", label: "68A (EIA-96 4.99kΩ)" },
              ].map((item) => (
                <button
                  key={item.code}
                  onClick={() => setSmdInput(item.code)}
                  className="px-2.5 py-1 bg-[#1a2136] hover:bg-[#252f4c] text-slate-300 rounded-lg border border-[#2a344f] transition cursor-pointer font-mono font-bold"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* SMD Result Card */}
          {smdResult && (
            <div className="bg-[#121626] border border-[#20273a] p-5 rounded-2xl space-y-3 font-tech">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Decoded SMD Specification
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-500/40 px-2.5 py-0.5 rounded-full">
                  {smdResult.type}
                </span>
              </div>

              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-display font-black text-white">
                  {smdResult.formatted}
                </span>
                <span className="text-xs font-mono text-amber-400 font-bold">
                  Tolerance: {smdResult.tolerance}
                </span>
              </div>

              <p className="text-xs text-slate-300 font-mono bg-[#0b0e18] p-3 rounded-xl border border-[#1d2438]">
                {smdResult.description}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. COLOR CHART & MNEMONICS REFERENCE TABLE */}
      {/* ========================================================================= */}
      {activeSubView === "color_chart" && (
        <div className="space-y-6">
          {/* Mnemonic Memory Banner */}
          <div className="bg-gradient-to-r from-amber-950/40 via-indigo-950/30 to-purple-950/40 border border-amber-500/30 p-4 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-display font-bold text-xs uppercase tracking-wider">
              <Zap className="w-4 h-4" />
              <span>Standard Mnemonic Memory Phrase</span>
            </div>
            <p className="text-sm font-display font-extrabold text-white leading-relaxed">
              <span className="text-slate-300">"</span>
              <strong className="text-amber-400">B</strong>.
              <strong className="text-amber-600">B</strong>.
              <strong className="text-rose-400">R</strong>.
              <strong className="text-orange-400">O</strong>.
              <strong className="text-yellow-300">Y</strong> of{" "}
              <strong className="text-emerald-400">G</strong>reat{" "}
              <strong className="text-blue-400">B</strong>ritain had a{" "}
              <strong className="text-purple-400">V</strong>ery{" "}
              <strong className="text-slate-400">G</strong>ood{" "}
              <strong className="text-slate-100">W</strong>ife wearing{" "}
              <strong className="text-amber-400">G</strong>old{" "}
              <strong className="text-slate-300">S</strong>ilver
              <span className="text-slate-300">"</span>
            </p>
            <p className="text-xs text-slate-400 font-tech">
              Black (0), Brown (1), Red (2), Orange (3), Yellow (4), Green (5), Blue (6), Violet (7), Gray (8), White (9), Gold (×0.1, 5%), Silver (×0.01, 10%).
            </p>
          </div>

          {/* Full Color Chart Table */}
          <div className="bg-[#121626] border border-[#20273a] rounded-2xl overflow-hidden shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-tech">
                <thead className="bg-[#0b0e18] border-b border-[#20273a] text-slate-400 uppercase font-bold text-[11px]">
                  <tr>
                    <th className="p-3">Color</th>
                    <th className="p-3">Digit 1, 2, 3</th>
                    <th className="p-3">Multiplier</th>
                    <th className="p-3">Tolerance</th>
                    <th className="p-3">TempCo (PPM/K)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2539]">
                  {Object.keys(COLOR_TABLE).map((key) => {
                    const c = COLOR_TABLE[key];
                    return (
                      <tr key={key} className="hover:bg-[#161c30] transition">
                        <td className="p-3 flex items-center gap-2.5">
                          <span className={`w-4 h-4 rounded-md border ${c.bgClass} ${c.borderClass}`} />
                          <span className="font-bold text-white">{c.name}</span>
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-200">
                          {c.digit !== null ? c.digit : "—"}
                        </td>
                        <td className="p-3 font-mono text-slate-300">
                          {c.multiplier !== null
                            ? `10^${Math.log10(c.multiplier) >= 0 ? Math.log10(c.multiplier) : Math.round(Math.log10(c.multiplier))} (×${c.multiplier.toLocaleString()})`
                            : "—"}
                        </td>
                        <td className="p-3 font-mono font-bold text-amber-400">
                          {c.toleranceStr || "—"}
                        </td>
                        <td className="p-3 font-mono text-slate-400">
                          {c.tempco ? `${c.tempco} ppm/K` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. RESISTOR AI CHAT ASSISTANT */}
      {/* ========================================================================= */}
      {activeSubView === "ai_chat" && (
        <div className="space-y-4">
          <div className="bg-[#121626] border border-[#20273a] p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-xs font-display font-bold text-white uppercase tracking-wider">
                  Resistor Color & Component Chat Specialist
                </span>
              </div>
              <span className="text-[10px] font-tech text-slate-400">Powered by Gemini & ECE Rule Engine</span>
            </div>

            {/* Quick Query Skills */}
            <div className="flex flex-wrap gap-1.5 text-xs font-tech">
              {[
                { label: "🟤 4.7kΩ Color Code", query: "What are the color bands for a 4.7k ohm 5% resistor?" },
                { label: "⬛ 10kΩ Color Code", query: "What are the color bands for a 10k ohm 5% resistor?" },
                { label: "💡 5V LED Resistor", query: "Calculate the exact resistor color code for a 5V supply with 2V 20mA Red LED" },
                { label: "🔍 Decode: Brown Black Red Gold", query: "Decode resistor color code: Brown, Black, Red, Gold with tolerance range" },
                { label: "🧠 Mnemonic Guide", query: "Explain the BBROY mnemonic memory code for resistors" },
                { label: "🏷️ SMD 103 Meaning", query: "What does a 103 SMD resistor mean and what is its resistance?" },
              ].map((skill, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendChat(skill.query)}
                  className="px-2.5 py-1 bg-[#1a2136] hover:bg-[#242d4a] text-slate-300 border border-[#26314f] rounded-lg transition cursor-pointer text-[11px]"
                >
                  {skill.label}
                </button>
              ))}
            </div>

            {/* Chat History Box */}
            <div className="h-64 overflow-y-auto bg-[#0b0e18] border border-[#1e2538] rounded-xl p-3.5 space-y-3 font-sans text-xs">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-2.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.sender === "bot" && (
                    <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <div
                    className={`p-3 rounded-2xl max-w-[85%] whitespace-pre-wrap leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-amber-500 text-slate-950 font-semibold rounded-br-none"
                        : "bg-[#14192b] text-slate-200 border border-[#222b42] rounded-bl-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                  {msg.sender === "user" && (
                    <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center shrink-0">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              ))}

              {isChatLoading && (
                <div className="flex gap-2.5 items-center text-slate-400 text-xs font-tech">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 animate-pulse" />
                  </div>
                  <span>Analyzing resistor color coding and calculating tolerance...</span>
                </div>
              )}
            </div>

            {/* Input Row */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={chatQuery}
                onChange={(e) => setChatQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !isChatLoading && handleSendChat()}
                placeholder="Ask about resistor colors, SMD codes, LED sizing, or mnemonics..."
                className="flex-1 bg-[#0b0e18] border border-[#242c42] rounded-xl px-4 py-2 text-xs font-sans text-white focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={() => handleSendChat()}
                disabled={isChatLoading || !chatQuery.trim()}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-tech font-bold rounded-xl text-xs flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
