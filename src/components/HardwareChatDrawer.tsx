import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  MessageSquare,
  Send,
  Bot,
  User,
  Sparkles,
  X,
  RotateCcw,
  HelpCircle,
  Code,
  ShieldCheck,
  Wrench,
  Stethoscope,
  Radio,
  GraduationCap,
  BatteryCharging,
  Copy,
  Check,
  Download,
  Cpu,
  Zap,
  ChevronDown,
  Palette,
} from "lucide-react";
import { ChatMessage, TargetBoard, ChatRolePreset, ChatModelOption } from "../types";

interface HardwareChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  targetBoard: TargetBoard;
  currentBlueprint: string;
  apiKey: string;
}

interface RoleConfig {
  id: ChatRolePreset;
  title: string;
  badge: string;
  icon: any;
  color: string;
  welcomeMessage: string;
  quickSkills: { label: string; prompt: string }[];
}

const ROLE_CONFIGS: Record<ChatRolePreset, RoleConfig> = {
  builder: {
    id: "builder",
    title: "Project Builder",
    badge: "Physical Assembly",
    icon: Wrench,
    color: "text-[#25D366] border-[#25D366]/30 bg-[#073D2D]",
    welcomeMessage:
      "🛠️ **Physical Project Builder Online!**\n\nI specialize in **end-to-end practical assembly**: breadboard topology, power bus wiring, soldering temperatures, component orientation, and zero-defect building sequences. Let's build your hardware safely!",
    quickSkills: [
      {
        label: "📋 Step-by-Step Build Order",
        prompt:
          "Provide a step-by-step physical assembly guide for this project: from breadboard power rail setup to sensor mounting and actuator integration.",
      },
      {
        label: "🔌 Soldering & Wiring Rules",
        prompt:
          "What are the best soldering temperatures, wire gauges, and connector techniques to assemble this project permanently?",
      },
      {
        label: "⚡ Common Ground & Power Busses",
        prompt:
          "How should I wire the common ground and separate the sensor power bus from actuator/relay power lines on this board?",
      },
      {
        label: "📦 Enclosure & Mounting Plan",
        prompt:
          "What is the best layout for placing this microcontroller, sensors, and power module inside a 3D-printed or acrylic project box?",
      },
    ],
  },
  advisor: {
    id: "advisor",
    title: "Lab Advisor",
    badge: "ECE Workbench",
    icon: Bot,
    color: "text-[#25D366] border-[#25D366]/30 bg-[#073D2D]",
    welcomeMessage:
      "🔬 **Senior ECE Lab Advisor Ready.**\n\nI can help you review your schematics, check pin compatibility, explain theoretical working principles, and optimize your lab setup.",
    quickSkills: [
      {
        label: "🔍 Review Circuit Safety",
        prompt:
          "Please review the entire active circuit blueprint for potential electrical hazards, reverse polarity risks, and 3.3V vs 5V logic mismatches.",
      },
      {
        label: "📐 Explain Protocol (I2C/SPI)",
        prompt:
          "Explain in detail how the communication bus (I2C/SPI/UART) operates for the sensors used in this project with timing diagrams.",
      },
      {
        label: "💡 Alternative Lower-Cost Parts",
        prompt:
          "Can you suggest cheaper or more readily available Indian market alternatives (₹) for the ICs or modules in this BOM?",
      },
      {
        label: "🧪 Lab Demonstration Setup",
        prompt:
          "How should I configure my lab bench for a live demonstration of this hardware project to faculty and lab instructors?",
      },
    ],
  },
  debugger: {
    id: "debugger",
    title: "Hardware Debugger",
    badge: "Multimeter & Scope",
    icon: Stethoscope,
    color: "text-[#25D366] border-[#25D366]/30 bg-[#073D2D]",
    welcomeMessage:
      "🐞 **Hardware Diagnostics & Fault Investigator.**\n\nLet's isolate electrical issues! I will guide you through multimeter probing points, brownout fixes, capacitor decoupling, and logic level conversions.",
    quickSkills: [
      {
        label: "⚡ Multimeter Pre-Power Test",
        prompt:
          "Give me an exact checklist of resistance and continuity multimeter tests to perform before turning on power to prevent blowing up the MCU.",
      },
      {
        label: "📉 Fix Brownout & Restarts",
        prompt:
          "My microcontroller restarts or crashes when the Wi-Fi/relay/servo triggers. How do I size and wire bypass decoupling capacitors to fix this?",
      },
      {
        label: "🔌 5V to 3.3V Level Shifter",
        prompt:
          "Calculate and show the exact resistor values for a voltage divider or BSS138 bi-directional level shifter for my 5V sensor.",
      },
      {
        label: "📊 Oscilloscope Probing Guide",
        prompt:
          "Where should I connect my oscilloscope ground clip and probe to measure the clean signal integrity and ripple on the power rail?",
      },
    ],
  },
  firmware: {
    id: "firmware",
    title: "Firmware Coach",
    badge: "C++ / MicroPython",
    icon: Code,
    color: "text-[#25D366] border-[#25D366]/30 bg-[#073D2D]",
    welcomeMessage:
      "💻 **Embedded Firmware & ISR Specialist.**\n\nI can help optimize your loop timing, write non-blocking `millis()` timers, configure hardware interrupts, and debug FreeRTOS tasks.",
    quickSkills: [
      {
        label: "⚡ Non-Blocking Loop Refactor",
        prompt:
          "Refactor the active firmware loop into clean, non-blocking millis() state-machine timers without using delay().",
      },
      {
        label: "🔔 Setup Hardware ISR Interrupt",
        prompt:
          "Write a clean IRAM_ATTR hardware interrupt service routine for a push button or rotary encoder on this board with debouncing.",
      },
      {
        label: "🌐 ESP-NOW / MQTT Stream",
        prompt:
          "Provide complete code snippets to stream sensor readings via ESP-NOW or MQTT with automatic reconnect handling.",
      },
      {
        label: "💾 Deep Sleep & Wakeup Stubs",
        prompt:
          "Show how to put this microcontroller into ultra-low-power Deep Sleep mode and wake up via RTC timer or GPIO pin.",
      },
    ],
  },
  viva: {
    id: "viva",
    title: "Viva Examiner",
    badge: "Oral Defense & Q&A",
    icon: GraduationCap,
    color: "text-[#25D366] border-[#25D366]/30 bg-[#073D2D]",
    welcomeMessage:
      "🎓 **ECE Final Year Viva Voce Examiner.**\n\nI will test your practical and theoretical knowledge of this project. Click a topic or answer my probing questions to prepare for faculty evaluations.",
    quickSkills: [
      {
        label: "🎯 Start Mock Viva Voce Drill",
        prompt:
          "Act as a strict university viva examiner. Ask me 3 challenging technical questions about the architecture, pull-up sizing, and bus protocol of this circuit.",
      },
      {
        label: "❓ Top 10 Faculty Viva Questions",
        prompt:
          "List the top 10 most frequently asked viva voce questions with concise, high-scoring answers for this specific circuit.",
      },
      {
        label: "📊 Block Diagram & Data Flow",
        prompt:
          "Explain the complete system block diagram and hardware-to-cloud data flow as I should explain it to the examination committee.",
      },
      {
        label: "⚖️ Why Not Arduino / Raspberry Pi?",
        prompt:
          "Give me the exact technical justification for choosing this specific microcontroller over other alternatives for my viva defense.",
      },
    ],
  },
  iot: {
    id: "iot",
    title: "IoT & Dashboard Pro",
    badge: "Blynk / ThingsBoard",
    icon: Radio,
    color: "text-[#25D366] border-[#25D366]/30 bg-[#073D2D]",
    welcomeMessage:
      "☁️ **IoT Cloud & Mobile Telemetry Architect.**\n\nLet's connect your hardware to modern cloud dashboards (Blynk 2.0, ThingsBoard, Adafruit IO, and ESP RainMaker) with zero latency.",
    quickSkills: [
      {
        label: "📱 Blynk 2.0 Virtual Pins Setup",
        prompt:
          "Provide the complete Blynk 2.0 firmware template and virtual pin mapping table for all sensors and actuators in this design.",
      },
      {
        label: "📊 ThingsBoard Telemetry Payload",
        prompt:
          "Format the sensor telemetry data into structured JSON and provide the MQTT publishing logic for ThingsBoard IoT dashboard.",
      },
      {
        label: "🔔 WhatsApp / Telegram Alerts",
        prompt:
          "Write the code to send instant threshold breach alert notifications via Telegram Bot API or Twilio WhatsApp when sensor values trigger.",
      },
      {
        label: "🔄 OTA Firmware Update Routine",
        prompt:
          "Show how to integrate ElegantOTA or Arduino OTA into this project for wireless over-the-air firmware upgrades.",
      },
    ],
  },
  power: {
    id: "power",
    title: "Power & Battery Sizing",
    badge: "LDO / Buck / Li-Ion",
    icon: BatteryCharging,
    color: "text-[#25D366] border-[#25D366]/30 bg-[#073D2D]",
    welcomeMessage:
      "🔋 **Power Architecture & Battery Sizing Specialist.**\n\nI can calculate your battery runtimes, choose between linear LDOs (AMS1117) and Buck converters (LM2596), size decoupling capacitors, and design solar charging circuits.",
    quickSkills: [
      {
        label: "⚡ Calculate Battery Runtime",
        prompt:
          "Calculate the battery life in hours/days for this circuit running on a 2500mAh 18650 Li-ion cell with Deep Sleep intervals.",
      },
      {
        label: "🔌 Sizing Buck vs LDO Regulator",
        prompt:
          "Compare power efficiency and thermal dissipation between an AMS1117 3.3V LDO and an MP1584 Buck converter for this board.",
      },
    ],
  },
  resistor: {
    id: "resistor",
    title: "Resistor Color & SMD",
    badge: "E24 / SMD / Decoders",
    icon: Palette,
    color: "text-[#25D366] border-[#25D366]/30 bg-[#073D2D]",
    welcomeMessage:
      "🎨 **Resistor Color Code & SMD Decoder Specialist.**\n\nI decode 4-band, 5-band, and 6-band through-hole resistor color bands, EIA-96 SMD codes, standard E-series values, and pull-up resistor sizing.",
    quickSkills: [
      {
        label: "🌈 Decode Color Bands",
        prompt: "Show the color bands for a 4.7kΩ, 10kΩ, 220Ω, and 1kΩ 1% tolerance metal film resistor.",
      },
      {
        label: "🏷️ SMD 3-Digit & 4-Digit Codes",
        prompt: "Explain how 3-digit (e.g. 103 = 10k) and EIA-96 SMD resistor marking codes work.",
      },
    ],
  },
};

export const HardwareChatDrawer: React.FC<HardwareChatDrawerProps> = ({
  isOpen,
  onClose,
  targetBoard,
  currentBlueprint,
  apiKey,
}) => {
  const [activeRole, setActiveRole] = useState<ChatRolePreset>("advisor");
  const [selectedModel, setSelectedModel] = useState<ChatModelOption>("gemini-2.5-flash");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize welcome message when role changes or drawer opens
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: ROLE_CONFIGS[activeRole].welcomeMessage,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          roleUsed: activeRole,
        },
      ]);
    }
  }, [activeRole, isOpen]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (!isOpen) return null;

  const currentRoleConfig = ROLE_CONFIGS[activeRole];

  const handleRoleChange = (newRole: ChatRolePreset) => {
    setActiveRole(newRole);
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: "assistant",
        content: `*Switched to **${ROLE_CONFIGS[newRole].title}** mode.*\n\n${ROLE_CONFIGS[newRole].welcomeMessage}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        roleUsed: newRole,
      },
    ]);
  };

  const handleSend = async (customText?: string) => {
    const textToSend = (customText || input).trim();
    if (!textToSend || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/v1/hardware-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { "x-gemini-api-key": apiKey } : {}),
        },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({ role: m.role, content: m.content })),
          targetBoard: targetBoard,
          currentBlueprint: currentBlueprint,
          rolePreset: activeRole,
          model: selectedModel,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chat response failed");

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply || "I couldn't process your request. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        modelUsed: data.modelUsed || selectedModel,
        roleUsed: activeRole,
      };

      setMessages([...newHistory, botMsg]);
    } catch (err: any) {
      setMessages([
        ...newHistory,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `⚠️ **Lab Advisor Error:** ${err.message || "Failed to contact AI service. Please verify your connection."}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          roleUsed: activeRole,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: "cleared",
        role: "assistant",
        content: ROLE_CONFIGS[activeRole].welcomeMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        roleUsed: activeRole,
      },
    ]);
  };

  const handleCopyMessage = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleExportTranscript = () => {
    const transcript = messages
      .map((m) => `[${m.timestamp}] ${m.role === "user" ? "USER" : "LAB ADVISOR"}:\n${m.content}\n`)
      .join("\n---\n\n");
    const blob = new Blob([transcript], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `circuitgen-chat-transcript-${Date.now()}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-xs flex justify-end">
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-2xl bg-[#121819] border-l border-[#202728] h-full shadow-2xl flex flex-col text-[#F1F3F4] relative"
      >
        {/* Drawer Header */}
        <div className="p-4 bg-[#111719] border-b border-[#202728] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center border border-[#25D366]/30 bg-[#073D2D] text-[#25D366]">
              {React.createElement(currentRoleConfig.icon, { className: "w-5 h-5" })}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-[#F1F3F4]">AI Lab Advisor & Skills Workshop</h3>
                <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full border border-[#25D366]/30 bg-[#073D2D] text-[#25D366]">
                  {targetBoard || "MCU Project"}
                </span>
              </div>
              <p className="text-xs text-[#9AA0A2]">Multi-Turn Practical Engineering Assistant</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleExportTranscript}
              title="Export Conversation Transcript"
              className="text-[#9AA0A2] hover:text-[#F1F3F4] p-2 rounded-full transition-colors hover:bg-[#202628] cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handleClearHistory}
              title="Reset Conversation"
              className="text-[#9AA0A2] hover:text-[#F1F3F4] p-2 rounded-full transition-colors hover:bg-[#202628] cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="text-[#9AA0A2] hover:text-[#F1F3F4] p-2 rounded-full transition-colors hover:bg-[#202628] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Role Presets & Model Bar */}
        <div className="bg-[#111719] border-b border-[#202728] px-3 py-2 space-y-2 shrink-0">
          {/* Top Row: Model Selector & Active Role Indicator */}
          <div className="flex items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-1.5 text-[#9AA0A2]">
              <Sparkles className="w-3.5 h-3.5 text-[#25D366]" />
              <span className="font-medium text-[#F1F3F4]">Engine:</span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as ChatModelOption)}
                className="bg-[#202628] border border-[#202728] text-[#F1F3F4] text-xs rounded-full px-2.5 py-1 focus:outline-none focus:border-[#25D366] cursor-pointer"
              >
                <option value="gemini-3.7-flash">Gemini 3.7 Flash (Standard / Balanced)</option>
                <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash-Lite (Fast / Low Latency)</option>
                <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Deep STEM Reasoning)</option>
              </select>
            </div>

            <div className="text-xs text-[#9AA0A2] hidden sm:block">
              Role: <strong className="text-[#F1F3F4] font-medium">{currentRoleConfig.title}</strong>
            </div>
          </div>

          {/* Role Preset Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {(Object.keys(ROLE_CONFIGS) as ChatRolePreset[]).map((roleKey) => {
              const r = ROLE_CONFIGS[roleKey];
              const isActive = activeRole === roleKey;
              const Icon = r.icon;
              return (
                <button
                  key={roleKey}
                  onClick={() => handleRoleChange(roleKey)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? "bg-[#25D366] text-[#071011] shadow-xs"
                      : "bg-[#202628] hover:bg-[#202628]/80 border border-[#202728] text-[#9AA0A2] hover:text-[#F1F3F4]"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{r.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Practical Skills Workshop Chips */}
        <div className="p-2.5 bg-[#071011] border-b border-[#202728] flex gap-1.5 overflow-x-auto text-xs shrink-0">
          <span className="text-[10px] uppercase font-medium text-[#9AA0A2] flex items-center px-1 shrink-0">
            Practical Skills:
          </span>
          {currentRoleConfig.quickSkills.map((qs, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(qs.prompt)}
              disabled={loading}
              className="bg-[#202628] hover:bg-[#111719] border border-[#202728] text-[#25D366] hover:text-[#25D366] px-3 py-1 rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer text-xs"
            >
              {qs.label}
            </button>
          ))}
        </div>

        {/* Messages Stream Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans">
          {messages.map((m, idx) => {
            const isBot = m.role === "assistant";
            return (
              <div key={m.id} className={`flex gap-3 ${isBot ? "items-start" : "items-end flex-row-reverse"}`}>
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs shadow-xs ${
                    isBot
                      ? "bg-[#073D2D] text-[#25D366] border border-[#25D366]/30"
                      : "bg-[#202628] text-[#F1F3F4] border border-[#202728]"
                  }`}
                >
                  {isBot ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                </div>

                <div
                  className={`p-4 rounded-3xl max-w-[88%] leading-relaxed space-y-2 relative group ${
                    isBot
                      ? "bg-[#202628] border border-[#202728] text-[#F1F3F4]"
                      : "bg-[#005C4B] text-[#F1F3F4] rounded-br-none"
                  }`}
                >
                  {/* Message Meta */}
                  <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5 text-[10px] text-[#9AA0A2]">
                    <span className="font-medium flex items-center gap-1 text-[#25D366]">
                      {isBot ? `Lab Advisor (${m.roleUsed || activeRole})` : "You"}
                    </span>
                    <div className="flex items-center gap-2">
                      {m.modelUsed && <span className="font-mono text-[9px] text-[#9AA0A2]">{m.modelUsed}</span>}
                      <span>{m.timestamp}</span>
                      <button
                        onClick={() => handleCopyMessage(m.content, idx)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-[#9AA0A2] hover:text-[#F1F3F4] p-0.5"
                        title="Copy message"
                      >
                        {copiedIndex === idx ? <Check className="w-3 h-3 text-[#25D366]" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {/* Message Body with Remark GFM Table & Code Styling */}
                  <div className="prose prose-invert prose-xs max-w-none text-[#F1F3F4] leading-relaxed overflow-x-auto">
                    <Markdown remarkPlugins={[remarkGfm]}>{m.content}</Markdown>
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2.5 text-[#25D366] text-xs p-3 bg-[#202628] rounded-2xl border border-[#202728] w-fit shadow-xs">
              <Sparkles className="w-4 h-4 animate-spin text-[#25D366]" />
              <div className="space-y-0.5">
                <div className="font-medium text-[#25D366]">Consulting ECE Engineering Knowledge Base...</div>
                <div className="text-[10px] text-[#9AA0A2] font-mono">Running on {selectedModel} with active blueprint context</div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-[#111719] border-t border-[#202728] flex flex-col gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder={`Ask ${currentRoleConfig.title} about physical wiring, multimeter checks, or viva...`}
              disabled={loading}
              className="flex-1 bg-[#202628] border border-[#202728] focus:border-[#25D366] rounded-full px-4 py-2.5 text-xs text-[#F1F3F4] placeholder-[#6F7779] focus:outline-none"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="bg-[#25D366] hover:bg-[#20bd5a] disabled:opacity-40 text-[#071011] p-2.5 rounded-full transition-colors cursor-pointer flex items-center justify-center shrink-0"
            >
              <Send className="w-4 h-4 text-[#071011]" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[10px] text-[#9AA0A2] px-2">
            <span>Press Enter to send</span>
            <span>Context: Full Blueprint Active</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
