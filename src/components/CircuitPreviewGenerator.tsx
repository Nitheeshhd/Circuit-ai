import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Cpu,
  Zap,
  Activity,
  Layers,
  Sparkles,
  Maximize2,
  Minimize2,
  RefreshCw,
  Info,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Play,
  RotateCcw,
  Sliders,
} from "lucide-react";
import { PinoutRow, TargetBoard, BOMItem } from "../types";
import { BOARDS_CATALOG } from "../data/boards";

interface CircuitPreviewGeneratorProps {
  pinoutRows: PinoutRow[];
  bomItems: BOMItem[];
  targetBoard: TargetBoard;
  detectedBoard: string;
}

export const CircuitPreviewGenerator: React.FC<CircuitPreviewGeneratorProps> = ({
  pinoutRows,
  bomItems,
  targetBoard,
  detectedBoard,
}) => {
  const [selectedWire, setSelectedWire] = useState<number | null>(null);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [filterVoltage, setFilterVoltage] = useState<string>("ALL");
  const [isSimulating, setIsSimulating] = useState(true);

  const boardKey =
    targetBoard === "Auto-Select"
      ? detectedBoard.includes("ESP")
        ? "ESP32 (WROOM-32)"
        : "Arduino Uno / Nano"
      : targetBoard;
  const boardInfo = BOARDS_CATALOG[boardKey] || BOARDS_CATALOG["ESP32 (WROOM-32)"];

  // Group pin connections by module
  const modulesMap = useMemo(() => {
    const map: Record<string, PinoutRow[]> = {};
    pinoutRows.forEach((row) => {
      const mod = row.module || "General Sensor";
      if (!map[mod]) map[mod] = [];
      map[mod].push(row);
    });
    return map;
  }, [pinoutRows]);

  const moduleNames = useMemo(() => Object.keys(modulesMap), [modulesMap]);

  // Color mapping based on voltage / signal type
  const getWireColor = (row: PinoutRow) => {
    const v = row.voltageLogic || "";
    const sig = (row.signalType || "").toLowerCase();
    const pin = (row.modulePin || "").toLowerCase();

    if (pin.includes("gnd") || sig.includes("ground")) return { stroke: "#9AA0A2", bg: "bg-[#9AA0A2]", glow: "#9AA0A2", name: "GND" };
    if (v.includes("5V") || pin.includes("5v") || pin.includes("vcc")) return { stroke: "#f87171", bg: "bg-[#f87171]", glow: "#f87171", name: "5V Power" };
    if (v.includes("3.3") || pin.includes("3v3") || pin.includes("3.3v")) return { stroke: "#25D366", bg: "bg-[#25D366]", glow: "#25D366", name: "3.3V Logic" };
    if (sig.includes("i2c") || pin.includes("sda") || pin.includes("scl")) return { stroke: "#25D366", bg: "bg-[#25D366]", glow: "#25D366", name: "I2C Bus" };
    if (sig.includes("spi") || pin.includes("miso") || pin.includes("mosi") || pin.includes("sck") || pin.includes("cs")) return { stroke: "#F1F3F4", bg: "bg-[#F1F3F4]", glow: "#F1F3F4", name: "SPI Bus" };
    if (sig.includes("analog") || pin.includes("adc") || pin.includes("a0") || pin.includes("a1")) return { stroke: "#f59e0b", bg: "bg-[#f59e0b]", glow: "#f59e0b", name: "Analog" };
    return { stroke: "#25D366", bg: "bg-[#25D366]", glow: "#25D366", name: "GPIO Signal" };
  };

  const filteredRows = useMemo(() => {
    return pinoutRows.filter((r) => {
      if (selectedModule && r.module !== selectedModule) return false;
      if (filterVoltage === "5V" && !r.voltageLogic.includes("5V")) return false;
      if (filterVoltage === "3.3V" && !r.voltageLogic.includes("3.3")) return false;
      return true;
    });
  }, [pinoutRows, selectedModule, filterVoltage]);

  return (
    <div className="space-y-4">
      {/* Control Toolbar */}
      <div className="bg-[#202628] border border-[#202728] p-3.5 rounded-3xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#25D366]" />
          <span className="font-medium text-[#F1F3F4] uppercase tracking-wider">
            Interactive Pin-to-Pin Circuit Schematic
          </span>
          <span className="text-[10px] bg-[#073D2D] text-[#25D366] border border-[#25D366]/30 px-2.5 py-0.5 rounded-full font-mono">
            {pinoutRows.length} Connections Active
          </span>
        </div>

        {/* Filters and Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Module Filter */}
          <select
            value={selectedModule || ""}
            onChange={(e) => setSelectedModule(e.target.value ? e.target.value : null)}
            className="bg-[#111719] border border-[#202728] text-[#F1F3F4] text-xs rounded-full px-3 py-1.5 focus:outline-none focus:border-[#25D366] cursor-pointer"
          >
            <option value="">All Peripherals ({moduleNames.length})</option>
            {moduleNames.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {/* Voltage Logic Filter */}
          <div className="flex bg-[#111719] p-0.5 rounded-full border border-[#202728]">
            {["ALL", "3.3V", "5V"].map((v) => (
              <button
                key={v}
                onClick={() => setFilterVoltage(v)}
                className={`px-3 py-1 rounded-full text-[10px] font-medium transition-colors cursor-pointer ${
                  filterVoltage === v
                    ? "bg-[#25D366] text-[#071011] shadow-xs"
                    : "text-[#9AA0A2] hover:text-[#F1F3F4]"
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Signal Pulse Animation Toggle */}
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 transition-colors cursor-pointer ${
              isSimulating
                ? "bg-[#073D2D] border-[#25D366]/40 text-[#25D366]"
                : "bg-[#111719] border-[#202728] text-[#9AA0A2]"
            }`}
          >
            <Activity className={`w-3.5 h-3.5 ${isSimulating ? "animate-pulse text-[#25D366]" : ""}`} />
            <span>{isSimulating ? "Live Signals" : "Static View"}</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Circuit Canvas */}
      <div className="relative bg-[#071011] border border-[#202728] rounded-3xl overflow-hidden shadow-2xl p-4 sm:p-6 min-h-[480px]">
        {/* Subtle Grid Background */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, #25D366 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />

        {/* Live Schematic Breadboard Architecture */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* LEFT: Target Microcontroller IC Card (5 cols) */}
          <div className="md:col-span-5 bg-[#111719] border-2 border-[#25D366]/40 rounded-3xl p-5 shadow-xl relative group">
            {/* Corner Screws / PCB Mounting Holes */}
            <div className="absolute top-2.5 left-2.5 w-2 h-2 rounded-full bg-[#202628] border border-[#202728]" />
            <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#202628] border border-[#202728]" />
            <div className="absolute bottom-2.5 left-2.5 w-2 h-2 rounded-full bg-[#202628] border border-[#202728]" />
            <div className="absolute bottom-2.5 right-2.5 w-2 h-2 rounded-full bg-[#202628] border border-[#202728]" />

            <div className="flex items-center justify-between border-b border-[#202728] pb-3 mb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#073D2D] text-[#25D366] border border-[#25D366]/40 flex items-center justify-center font-medium">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-medium text-[#F1F3F4]">{boardInfo.name}</h4>
                  <p className="text-[10px] font-mono text-[#9AA0A2]">{boardInfo.architecture} • {boardInfo.clockSpeed}</p>
                </div>
              </div>
              <span className="text-[9px] font-mono font-medium bg-[#073D2D] text-[#25D366] border border-[#25D366]/40 px-2.5 py-0.5 rounded-full">
                {boardInfo.voltage} Core
              </span>
            </div>

            {/* Microcontroller Pin Headers */}
            <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
              {filteredRows.map((row, idx) => {
                const wireMeta = getWireColor(row);
                const isSelected = selectedWire === idx;
                return (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => setSelectedWire(isSelected ? null : idx)}
                    className={`p-2.5 rounded-2xl flex items-center justify-between transition-colors cursor-pointer border text-xs font-mono ${
                      isSelected
                        ? "bg-[#073D2D] border-[#25D366] text-[#F1F3F4] shadow-xs"
                        : "bg-[#202628] border-[#202728] hover:border-[#25D366]/40 text-[#F1F3F4]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${wireMeta.bg} ${isSimulating ? "animate-pulse" : ""}`} />
                      <span className="font-medium text-[#25D366]">{row.mcuPin}</span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="text-[#9AA0A2] truncate max-w-[120px] font-sans font-normal">{row.module}</span>
                      <span
                        className="px-2 py-0.5 rounded-full text-[9px] font-medium"
                        style={{ color: wireMeta.stroke, backgroundColor: `${wireMeta.stroke}20` }}
                      >
                        {row.signalType || "GPIO"}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* MIDDLE: Signal Bus Bridge Graphic (2 cols on md) */}
          <div className="hidden md:flex md:col-span-2 flex-col items-center justify-center gap-2 py-4">
            <div className="w-full flex items-center justify-center">
              <svg className="w-full h-40" viewBox="0 0 100 120">
                <defs>
                  <linearGradient id="busGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#25D366" />
                    <stop offset="50%" stopColor="#25D366" />
                    <stop offset="100%" stopColor="#25D366" />
                  </linearGradient>
                </defs>
                {/* Visual Interconnect Traces */}
                <path d="M 10 30 Q 50 30, 90 30" fill="none" stroke="#25D366" strokeWidth="2" strokeDasharray={isSimulating ? "4 4" : undefined}>
                  {isSimulating && <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="1s" repeatCount="indefinite" />}
                </path>
                <path d="M 10 60 Q 50 60, 90 60" fill="none" stroke="#25D366" strokeWidth="2" strokeDasharray={isSimulating ? "4 4" : undefined}>
                  {isSimulating && <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="0.8s" repeatCount="indefinite" />}
                </path>
                <path d="M 10 90 Q 50 90, 90 90" fill="none" stroke="#25D366" strokeWidth="2" strokeDasharray={isSimulating ? "4 4" : undefined}>
                  {isSimulating && <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="1.2s" repeatCount="indefinite" />}
                </path>
              </svg>
            </div>
            <span className="text-[10px] font-mono text-[#6F7779] uppercase tracking-widest text-center">
              Direct Pin Map
            </span>
          </div>

          {/* RIGHT: Interfaced Sensor & Peripheral Modules (5 cols) */}
          <div className="md:col-span-5 space-y-3">
            {Object.keys(modulesMap)
              .filter((m) => !selectedModule || m === selectedModule)
              .map((modName, mIdx) => {
                const rows = modulesMap[modName];
                return (
                  <div
                    key={mIdx}
                    className="bg-[#111719] border border-[#202728] hover:border-[#25D366]/40 rounded-3xl p-4 shadow-lg transition-colors space-y-2.5"
                  >
                    <div className="flex items-center justify-between border-b border-[#202728] pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#25D366]" />
                        <h5 className="text-xs font-medium text-[#F1F3F4]">{modName}</h5>
                      </div>
                      <span className="text-[9px] font-mono bg-[#202628] border border-[#202728] text-[#9AA0A2] px-2.5 py-0.5 rounded-full">
                        {rows.length} Pin Headers
                      </span>
                    </div>

                    {/* Module Pin Rows */}
                    <div className="space-y-1.5">
                      {rows.map((r, rIdx) => {
                        const wireMeta = getWireColor(r);
                        const globalIdx = pinoutRows.indexOf(r);
                        const isWireSelected = selectedWire === globalIdx;

                        return (
                          <div
                            key={rIdx}
                            onClick={() => setSelectedWire(isWireSelected ? null : globalIdx)}
                            className={`p-2.5 rounded-2xl flex items-center justify-between text-xs font-mono cursor-pointer transition-colors border ${
                              isWireSelected
                                ? "bg-[#073D2D] border-[#25D366] text-[#F1F3F4] font-medium"
                                : "bg-[#202628] border-[#202728] hover:bg-[#111719] text-[#F1F3F4]"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-[#9AA0A2] text-[11px]">{r.modulePin}</span>
                              <span className="text-[#6F7779] text-xs">➔</span>
                              <span className="text-[#25D366] font-medium">{r.mcuPin}</span>
                            </div>

                            <span
                              className="text-[9px] font-medium px-2 py-0.5 rounded-full"
                              style={{ color: wireMeta.stroke, backgroundColor: `${wireMeta.stroke}20` }}
                            >
                              {r.voltageLogic}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Selected Wire Inspector Detail Card */}
        <AnimatePresence>
          {selectedWire !== null && pinoutRows[selectedWire] && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-5 p-4 bg-[#111719] border border-[#25D366]/40 rounded-3xl text-xs space-y-2 shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-[#202728] pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🔍</span>
                  <span className="font-medium text-[#F1F3F4]">
                    Pin Connection Detail:{" "}
                    <span className="text-[#25D366] font-mono">
                      {pinoutRows[selectedWire].modulePin} ({pinoutRows[selectedWire].module}) ➔ {pinoutRows[selectedWire].mcuPin}
                    </span>
                  </span>
                </div>
                <button
                  onClick={() => setSelectedWire(null)}
                  className="text-[#9AA0A2] hover:text-[#F1F3F4] text-xs font-mono px-3 py-1 rounded-full bg-[#202628] cursor-pointer"
                >
                  Close ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                <div className="p-3 bg-[#202628] rounded-2xl border border-[#202728]">
                  <span className="text-[#9AA0A2] block text-[10px] uppercase font-medium">Signal Classification</span>
                  <span className="font-medium text-[#25D366]">{pinoutRows[selectedWire].signalType}</span>
                </div>
                <div className="p-3 bg-[#202628] rounded-2xl border border-[#202728]">
                  <span className="text-[#9AA0A2] block text-[10px] uppercase font-medium">Logic Level</span>
                  <span className="font-medium text-[#25D366] font-mono">{pinoutRows[selectedWire].voltageLogic}</span>
                </div>
                <div className="p-3 bg-[#202628] rounded-2xl border border-[#202728]">
                  <span className="text-[#9AA0A2] block text-[10px] uppercase font-medium">Wiring / Pull-up Notice</span>
                  <span className="text-[#F1F3F4]">
                    {pinoutRows[selectedWire].wiringNotes || "Direct jumper wire connection (≤15cm suggested)"}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Pin-by-Pin Hardware Connection Checklist */}
      <div className="bg-[#202628] border border-[#202728] rounded-3xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-[#202728] pb-2.5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#25D366]" />
            <h4 className="text-xs font-medium text-[#F1F3F4]">
              Pin-by-Pin Physical Assembly Checklist
            </h4>
          </div>
          <span className="text-xs text-[#9AA0A2]">Step-by-step breadboard verification</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
          {pinoutRows.map((row, idx) => {
            const wireMeta = getWireColor(row);
            return (
              <div
                key={idx}
                className="p-3 bg-[#111719] border border-[#202728] hover:border-[#25D366]/30 rounded-2xl flex items-start gap-2.5 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-[#202628] border border-[#202728] flex items-center justify-center text-[10px] font-mono font-medium text-[#25D366] shrink-0">
                  {idx + 1}
                </div>
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[#F1F3F4] truncate text-xs">{row.module}</span>
                    <span className="font-mono text-[9px] font-medium" style={{ color: wireMeta.stroke }}>
                      {row.voltageLogic}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#9AA0A2] font-mono flex items-center gap-1.5">
                    <span className="text-[#F1F3F4]">{row.modulePin}</span>
                    <span>➔</span>
                    <span className="font-medium text-[#25D366]">{row.mcuPin}</span>
                  </div>
                  {row.wiringNotes && (
                    <div className="text-[10px] text-[#9AA0A2] truncate">{row.wiringNotes}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
