import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Cpu, Sparkles, PlusCircle } from "lucide-react";
import { TargetBoard } from "../types";

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (title: string, targetBoard: TargetBoard, initialPrompt: string) => void;
}

const BOARD_OPTIONS: TargetBoard[] = [
  "Auto-Select",
  "Arduino Uno / Nano",
  "ESP32 (WROOM-32)",
  "ESP8266 (NodeMCU)",
  "STM32 (Blue Pill)",
  "Raspberry Pi Pico",
  "8051 Microcontroller",
  "Arduino Mega 2560",
];

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onCreateProject,
}) => {
  const [projectTitle, setProjectTitle] = useState("IoT Sensor Node");
  const [selectedBoard, setSelectedBoard] = useState<TargetBoard>("ESP32 (WROOM-32)");
  const [initialPrompt, setInitialPrompt] = useState(
    "I want to build a smart environmental monitoring station with DHT22 temperature/humidity sensor, OLED display, and MQTT telemetry reporting."
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectTitle.trim()) return;
    onCreateProject(projectTitle.trim(), selectedBoard, initialPrompt.trim());
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-lg bg-[#0e1318] border border-[#222c33] rounded-3xl shadow-2xl overflow-hidden text-slate-200"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#1c262c] flex items-center justify-between bg-[#131b20]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Create New Hardware Project</h3>
                <p className="text-xs text-slate-400">Set up your target microcontroller and project specifications.</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#1b252b] hover:bg-[#233038] flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Project Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Project Name
              </label>
              <input
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="e.g. Smart Plant Monitor"
                className="w-full bg-[#141d22] border border-[#233139] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
                required
              />
            </div>

            {/* Target Board Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Target Microcontroller / Board
              </label>
              <select
                value={selectedBoard}
                onChange={(e) => setSelectedBoard(e.target.value as TargetBoard)}
                className="w-full bg-[#141d22] border border-[#233139] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors cursor-pointer"
              >
                {BOARD_OPTIONS.map((board) => (
                  <option key={board} value={board}>
                    {board}
                  </option>
                ))}
              </select>
            </div>

            {/* Initial Hardware Prompt / Idea */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Hardware Prompt & Description</span>
                <span className="text-[10px] text-orange-400 font-normal flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> AI Generator Ready
                </span>
              </label>
              <textarea
                rows={4}
                value={initialPrompt}
                onChange={(e) => setInitialPrompt(e.target.value)}
                placeholder="Describe your circuit sensors, actuators, and connectivity..."
                className="w-full bg-[#141d22] border border-[#233139] rounded-xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors resize-none"
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#1c262c]">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-xs font-medium bg-[#162026] hover:bg-[#1e2a32] text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-slate-950 transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-orange-500/20"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Initialize Project</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
