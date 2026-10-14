import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, BookOpen, Search, Cpu, Zap, Boxes, Code, ShieldCheck, Terminal, Lightbulb } from "lucide-react";

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DOC_SECTIONS = [
  {
    id: "getting_started",
    title: "1. Quick Start & Prompting",
    icon: <SparklesIcon className="w-4 h-4 text-sky-400" />,
    content: 
      "### Building Your First Circuit\n" +
      "Circuito AI translates natural language descriptions into professional hardware schematics, BOM parts lists, wiring tables, and production-ready microcontroller firmware.\n\n" +
      "1. **Select Target Board**: Choose your microcontroller platform in the configuration panel (e.g., *ESP32*, *Arduino Uno*, *Raspberry Pi Pico*, *STM32*).\n" +
      "2. **Describe Your Hardware Idea**: Write a detailed prompt specifying sensors, actuators, displays, and communication protocols (e.g., \"Smart environmental monitoring station with DHT22 temperature sensor, 0.96 inch OLED display, and MQTT telemetry\").\n" +
      "3. **Generate Blueprint**: Click **Generate Circuit Blueprint** to stream the complete AI hardware architecture in real-time."
    ,
  },
  {
    id: "schematics_pinout",
    title: "2. Schematics & Pinout Mapping",
    icon: <Cpu className="w-4 h-4 text-emerald-400" />,
    content: 
      "### Understanding Pin Connections\n" +
      "The **Schematics & Pinout** tab provides a complete physical wiring guide between your microcontroller and external sensors.\n\n" +
      "- **GPIO Assignments**: Automatically assigns optimal pins (e.g., avoiding strapping pins on ESP32, allocating hardware I2C SDA/SCL pins).\n" +
      "- **Power Rails**: Clearly separates 3.3V, 5V, and GND power distribution to prevent over-voltage damage.\n" +
      "- **Pull-up Resistors**: Highlights required pull-up resistors for I2C and button inputs."
    ,
  },
  {
    id: "components_bom",
    title: "3. Components & BOM Sourcing",
    icon: <Boxes className="w-4 h-4 text-amber-400" />,
    content: 
      "### Bill of Materials (BOM) & Inventory\n" +
      "The **Components** tab lists every electronic part required for your build:\n\n" +
      "- **Quantity & Specifications**: Exact part numbers, tolerances, and voltage ratings.\n" +
      "- **Inventory Tracking**: Mark items as *In Inventory* or *Needs Purchasing* to generate an instant shopping list.\n" +
      "- **Cost Estimation**: Estimates total build cost for prototyping and small-batch production."
    ,
  },
  {
    id: "firmware_code",
    title: "4. Firmware & Code Export",
    icon: <Code className="w-4 h-4 text-purple-400" />,
    content: 
      "### Firmware Languages & Export\n" +
      "Circuito AI generates complete, production-ready source code supporting multiple environments:\n\n" +
      "- **Arduino C++ (.ino)**: Fully configured with required library includes (#include <Wire.h>, #include <DHT.h>).\n" +
      "- **MicroPython / CircuitPython (.py)**: Clean object-oriented scripts for rapid prototyping.\n" +
      "- **ESP-IDF C**: Low-level FreeRTOS tasks for advanced ESP32 development."
    ,
  },
  {
    id: "safety_guidelines",
    title: "5. Electrical Safety & Protection",
    icon: <ShieldCheck className="w-4 h-4 text-rose-400" />,
    content: 
      "### Protecting Your Microcontroller\n\n" +
      "- **Voltage Level Shifting**: Always use bidirectional logic level converters when connecting 5V sensors (like HC-SR04) to 3.3V GPIO pins.\n" +
      "- **Current Limiting**: Always use series resistors with LEDs (typically 220Ω to 470Ω for 5V/3.3V).\n" +
      "- **Decoupling Capacitors**: Place 100nF ceramic capacitors close to VCC/GND pins of ICs and sensors to suppress voltage spikes."
    ,
  },
];

function SparklesIcon(props: any) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

export const DocumentationModal: React.FC<DocumentationModalProps> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState(DOC_SECTIONS[0].id);
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  const filteredSections = DOC_SECTIONS.filter(
    (sec) =>
      sec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sec.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentSec = DOC_SECTIONS.find((s) => s.id === activeSection) || DOC_SECTIONS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-4xl bg-[#0e121f] rounded-3xl shadow-2xl border border-[#232d45] overflow-hidden text-slate-300 flex flex-col h-[85vh] my-auto"
      >
        {/* Header */}
        <div className="bg-[#13182a] px-6 py-4 flex items-center justify-between border-b border-[#20273a] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/40">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-display font-extrabold text-white">
                Circuito AI Documentation & User Guide
              </h2>
              <p className="text-xs text-slate-400 font-tech">
                Comprehensive guide to hardware design, wiring, pinouts, and AI generation
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

        {/* Content Body with Sidebar Navigation */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Index Sidebar */}
          <div className="w-64 bg-[#0b0e18] border-r border-[#1c2234] p-4 flex flex-col gap-3 shrink-0 hidden sm:flex">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search guides..."
                className="w-full bg-[#131826] border border-[#232d45] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="space-y-1 overflow-y-auto flex-1">
              {filteredSections.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-tech font-bold flex items-center gap-2.5 transition cursor-pointer ${
                    activeSection === sec.id
                      ? "bg-sky-950/40 text-sky-200 border border-sky-500/40 shadow-xs"
                      : "text-slate-400 hover:text-white hover:bg-[#151a2b]"
                  }`}
                >
                  {sec.icon}
                  <span className="truncate">{sec.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Detailed Reading Area */}
          <div className="flex-1 bg-[#0e121f] p-6 overflow-y-auto space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#20273a]">
              <div className="w-8 h-8 rounded-xl bg-[#161d30] border border-[#2b3654] flex items-center justify-center">
                {currentSec.icon}
              </div>
              <h3 className="text-base font-bold text-white font-display">{currentSec.title}</h3>
            </div>

            <div className="prose prose-invert max-w-none text-xs sm:text-sm text-slate-300 space-y-3 leading-relaxed font-sans">
              {currentSec.content.split("\n\n").map((paragraph, i) => {
                if (paragraph.startsWith("### ")) {
                  return (
                    <h4 key={i} className="text-sm font-bold text-white font-display mt-4 mb-2">
                      {paragraph.replace("### ", "")}
                    </h4>
                  );
                }
                if (paragraph.startsWith("- ")) {
                  return (
                    <ul key={i} className="list-disc pl-5 space-y-1 text-slate-300">
                      {paragraph.split("\n").map((li, j) => (
                        <li key={j}>{li.replace("- ", "")}</li>
                      ))}
                    </ul>
                  );
                }
                return (
                  <p key={i} className="text-slate-300">
                    {paragraph}
                  </p>
                );
              })}
            </div>

            <div className="pt-6 mt-6 border-t border-[#1d263c] flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-amber-400" /> Need real-time help? Open the Support Chat Advisor.
              </span>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-tech font-bold transition cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
