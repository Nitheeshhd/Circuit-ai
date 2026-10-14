import React, { useState } from "react";
import { motion } from "motion/react";
import { PinoutRow, TargetBoard } from "../types";
import { BOARDS_CATALOG } from "../data/boards";
import { Cpu, Zap, AlertTriangle, ShieldCheck, Info } from "lucide-react";

interface PinoutVisualizerProps {
  pinoutRows: PinoutRow[];
  targetBoard: TargetBoard;
  detectedBoard: string;
}

export const PinoutVisualizer: React.FC<PinoutVisualizerProps> = ({
  pinoutRows,
  targetBoard,
  detectedBoard,
}) => {
  const [selectedPin, setSelectedPin] = useState<string | null>(null);

  const boardKey = targetBoard === "Auto-Select" ? (detectedBoard.includes("ESP") ? "ESP32 (WROOM-32)" : "Arduino Uno / Nano") : targetBoard;
  const boardInfo = BOARDS_CATALOG[boardKey] || BOARDS_CATALOG["ESP32 (WROOM-32)"];

  // Group connections by module
  const modulesMap: Record<string, PinoutRow[]> = {};
  pinoutRows.forEach((row) => {
    if (!modulesMap[row.module]) modulesMap[row.module] = [];
    modulesMap[row.module].push(row);
  });

  return (
    <div className="space-y-5">
      {/* Board Summary Header */}
      <div className="bg-[#202628] text-[#F1F3F4] p-5 rounded-3xl border border-[#202728] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#073D2D] text-[#25D366] border border-[#25D366]/30 flex items-center justify-center font-medium">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-[#F1F3F4]">{boardInfo.name}</h3>
              <span className="text-[10px] font-medium bg-[#073D2D] text-[#25D366] border border-[#25D366]/30 px-2.5 py-0.5 rounded-full font-mono">
                {boardInfo.voltage}
              </span>
            </div>
            <p className="text-xs text-[#9AA0A2] mt-0.5">{boardInfo.architecture} • {boardInfo.clockSpeed}</p>
          </div>
        </div>

        <div className="flex items-center gap-5 text-xs">
          <div>
            <div className="text-[10px] uppercase font-medium text-[#9AA0A2]">Connected Pins</div>
            <div className="font-medium text-[#F1F3F4] mt-0.5">{pinoutRows.length} Active Lines</div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-medium text-[#9AA0A2]">Retail Board Price</div>
            <div className="font-medium text-[#25D366] font-mono mt-0.5">{boardInfo.priceEstimateINR}</div>
          </div>
        </div>
      </div>

      {/* Safety Alert if Strapping or Level Shifter */}
      {boardInfo.strappingPins.length > 0 && (
        <div className="p-4 bg-[#332a15] border border-[#f59e0b]/30 rounded-2xl text-xs text-[#f59e0b] flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-[#f59e0b] shrink-0 mt-0.5" />
          <div>
            <strong className="font-medium text-[#f59e0b]">Strapping Pin Guardrails for {boardInfo.name}:</strong>
            <p className="mt-0.5 text-[#9AA0A2] leading-relaxed text-xs">
              Reserved boot strapping pins: <code className="font-mono bg-[#111719] px-2 py-0.5 rounded-full border border-[#202728] text-[#f59e0b]">{boardInfo.strappingPins.join(", ")}</code>. Circuito has validated that these are safely isolated from external sensor pull-ups.
            </p>
          </div>
        </div>
      )}

      {/* Interactive Interconnection Diagram */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Connected Modules List (Left 5 Cols) */}
        <div className="lg:col-span-5 space-y-2.5">
          <div className="text-xs font-medium uppercase tracking-wider text-[#9AA0A2] flex items-center justify-between">
            <span>Interfaced Peripherals ({Object.keys(modulesMap).length})</span>
            <span className="text-[10px] text-[#6F7779]">Click to inspect</span>
          </div>

          <div className="space-y-2">
            {Object.keys(modulesMap).map((modName, idx) => {
              const rows = modulesMap[modName];
              return (
                <div
                  key={idx}
                  className="bg-[#202628] border border-[#202728] rounded-2xl p-4 hover:border-[#25D366]/40 transition-colors space-y-2.5"
                >
                  <div className="flex items-center justify-between border-b border-[#202728] pb-2">
                    <span className="font-medium text-xs text-[#F1F3F4] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#25D366]" />
                      {modName}
                    </span>
                    <span className="text-[10px] bg-[#111719] border border-[#202728] text-[#9AA0A2] px-2 py-0.5 rounded-full font-mono">
                      {rows.length} Pins
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {rows.map((row, rIdx) => (
                      <div
                        key={rIdx}
                        onClick={() => setSelectedPin(row.mcuPin)}
                        className={`text-xs p-2 rounded-xl flex items-center justify-between cursor-pointer transition-colors font-mono ${
                          selectedPin === row.mcuPin
                            ? "bg-[#073D2D] border border-[#25D366]/40 text-[#25D366] font-medium"
                            : "hover:bg-[#111719] text-[#F1F3F4]"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-[#9AA0A2]">{row.modulePin}</span>
                          <span className="text-[#6F7779] text-xs">➔</span>
                          <span className="font-medium text-[#25D366]">{row.mcuPin}</span>
                        </div>
                        <span
                          className={`text-[9px] font-medium uppercase px-2 py-0.5 rounded-full ${
                            row.voltageLogic === "5V"
                              ? "bg-[#381617] border border-[#f87171]/40 text-[#f87171]"
                              : row.voltageLogic === "3.3V"
                              ? "bg-[#073D2D] border border-[#25D366]/40 text-[#25D366]"
                              : "bg-[#111719] border border-[#202728] text-[#9AA0A2]"
                          }`}
                        >
                          {row.voltageLogic}
                        </span>
                      </div>
                    ))}
                  </div>

                  {rows.some((r) => r.wiringNotes) && (
                    <div className="text-xs text-[#9AA0A2] pt-2 border-t border-[#202728]">
                      {rows.find((r) => r.wiringNotes)?.wiringNotes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Board IC Pin Header Graphic (Right 7 Cols) */}
        <div className="lg:col-span-7 bg-[#202628] p-5 rounded-3xl border border-[#202728] text-[#F1F3F4] space-y-4">
          <div className="flex items-center justify-between border-b border-[#202728] pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#25D366]" />
              <span className="text-xs font-medium text-[#F1F3F4] uppercase tracking-wider">MCU Pinout Map</span>
            </div>
            <div className="flex gap-2.5 text-[10px] font-mono font-medium">
              <span className="text-[#f87171]">■ 5V</span>
              <span className="text-[#25D366]">■ 3.3V</span>
              <span className="text-[#9AA0A2]">■ GND</span>
              <span className="text-[#25D366]">■ Signal</span>
            </div>
          </div>

          {/* Interactive Wire Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[#9AA0A2] border-b border-[#202728] text-[11px] font-medium uppercase">
                  <th className="py-2.5 text-left font-mono">MCU PIN</th>
                  <th className="py-2.5 text-left">CONNECTED MODULE</th>
                  <th className="py-2.5 text-left font-mono">SIGNAL / LOGIC</th>
                  <th className="py-2.5 text-left">NOTES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#202728]">
                {pinoutRows.map((row, idx) => {
                  const isSelected = selectedPin === row.mcuPin;
                  return (
                    <tr
                      key={idx}
                      onClick={() => setSelectedPin(row.mcuPin)}
                      className={`hover:bg-[#111719] cursor-pointer transition-colors ${
                        isSelected ? "bg-[#073D2D]/60 text-[#25D366]" : "text-[#F1F3F4]"
                      }`}
                    >
                      <td className="py-2.5 font-medium text-[#25D366] font-mono">
                        <span className="bg-[#111719] px-2.5 py-0.5 rounded-full border border-[#202728]">
                          {row.mcuPin}
                        </span>
                      </td>
                      <td className="py-2.5 font-medium text-[#F1F3F4]">
                        {row.module} <span className="text-[#9AA0A2] font-normal">({row.modulePin})</span>
                      </td>
                      <td className="py-2.5 font-mono">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                            row.voltageLogic === "5V"
                              ? "bg-[#381617] text-[#f87171] border border-[#f87171]/30"
                              : row.voltageLogic === "3.3V"
                              ? "bg-[#073D2D] text-[#25D366] border border-[#25D366]/30"
                              : "bg-[#111719] text-[#9AA0A2] border border-[#202728]"
                          }`}
                        >
                          {row.signalType} ({row.voltageLogic})
                        </span>
                      </td>
                      <td className="py-2.5 text-xs text-[#9AA0A2]">
                        {row.isStrappingWarning && (
                          <span className="text-[#f59e0b] font-medium mr-1">⚠️ Strapping:</span>
                        )}
                        {row.wiringNotes || "Direct jumper"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="pt-2 text-xs text-[#9AA0A2] flex items-center justify-between border-t border-[#202728]">
            <span>Standard Wire Coding: Red = VCC (5V/3.3V), Black = GND, Green/Yellow = Data</span>
          </div>
        </div>
      </div>
    </div>
  );
};
