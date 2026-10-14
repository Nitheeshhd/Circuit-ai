import React, { useState } from "react";
import { motion } from "motion/react";
import { Stethoscope, CheckCircle2, AlertTriangle, AlertCircle, Play, ShieldAlert, Sparkles, X } from "lucide-react";
import { TargetBoard, DiagnosticResult } from "../types";
import { lintFirmwareCode } from "../utils/firmwareLinter";

interface CircuitDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetBoard: TargetBoard;
  currentCode: string;
  apiKey: string;
}

export const CircuitDiagnosticsModal: React.FC<CircuitDiagnosticsModalProps> = ({
  isOpen,
  onClose,
  targetBoard,
  currentCode,
  apiKey,
}) => {
  const [code, setCode] = useState(currentCode || "");
  const [wiring, setWiring] = useState("");
  const [board, setBoard] = useState<TargetBoard>(targetBoard || "ESP32 (WROOM-32)");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<DiagnosticResult | null>(null);

  // Sync if currentCode updates
  React.useEffect(() => {
    if (currentCode) {
      setCode(currentCode);
    }
  }, [currentCode]);

  React.useEffect(() => {
    if (targetBoard && targetBoard !== "Auto-Select") {
      setBoard(targetBoard);
    }
  }, [targetBoard]);

  if (!isOpen) return null;

  const runDiagnostic = async () => {
    setRunning(true);
    setResult(null);

    try {
      const res = await fetch("/api/v1/diagnose-circuit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { "x-gemini-api-key": apiKey } : {}),
        },
        body: JSON.stringify({
          code: code,
          board: board,
          wiringDescription: wiring,
        }),
      });

      if (!res.ok) {
        throw new Error(`Diagnostic failed with status ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      // Deterministic fallback using robust firmware static auditor
      const localAudit = lintFirmwareCode(code, board);
      const mappedIssues = localAudit.issues.map((iss) => ({
        type: iss.category === "hardware_safety" ? "pin_conflict" as const : "code_bug" as const,
        severity: iss.severity as "low" | "medium" | "high",
        message: `${iss.rule}: ${iss.message}`,
        solution: iss.solution,
      }));

      setResult({
        status: localAudit.passed ? "PASS" : mappedIssues.some((i) => i.severity === "high") ? "CRITICAL" : "WARNING",
        score: localAudit.score,
        issues: mappedIssues,
        summary: localAudit.summary,
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 6 }}
        transition={{ duration: 0.15 }}
        className="w-full max-w-2xl bg-[#121819] rounded-3xl shadow-2xl border border-[#202728] overflow-hidden max-h-[90vh] flex flex-col text-[#F1F3F4]"
      >
        {/* Header */}
        <div className="bg-[#111719] px-6 py-4 flex items-center justify-between border-b border-[#202728] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#073D2D] text-[#25D366] flex items-center justify-center border border-[#25D366]/30">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-[#F1F3F4]">Circuit Diagnostics & Code Linter</h3>
              <p className="text-xs text-[#9AA0A2]">Checks strapping pins, blocking delays & ADC2 WiFi conflicts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#9AA0A2] hover:text-[#F1F3F4] p-2 rounded-full transition-colors hover:bg-[#202628] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Board Selector */}
          <div>
            <label className="block text-xs font-medium uppercase text-[#9AA0A2] mb-1">
              Target Microcontroller:
            </label>
            <select
              value={board}
              onChange={(e) => setBoard(e.target.value as TargetBoard)}
              className="w-full bg-[#202628] border border-[#202728] rounded-2xl p-2.5 text-xs text-[#F1F3F4] focus:border-[#25D366] focus:outline-none cursor-pointer"
            >
              <option value="ESP32 (WROOM-32)">ESP32 DevKit V1 (3.3V Logic)</option>
              <option value="Arduino Uno / Nano">Arduino Uno / Nano (5.0V Logic)</option>
              <option value="ESP8266 (NodeMCU)">ESP8266 NodeMCU (3.3V Logic)</option>
              <option value="STM32 (Blue Pill)">STM32 Blue Pill (3.3V Logic)</option>
              <option value="Raspberry Pi Pico">Raspberry Pi Pico (3.3V Logic)</option>
              <option value="8051 Microcontroller">8051 Microcontroller (5.0V Logic)</option>
            </select>
          </div>

          {/* Code Input */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-medium uppercase text-[#9AA0A2]">
                Firmware Source Code:
              </label>
              <span className="text-[10px] font-mono text-[#6F7779]">{code.length} characters</span>
            </div>
            <textarea
              rows={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="// Paste your Arduino C++ or MicroPython code here..."
              className="w-full bg-[#202628] border border-[#202728] rounded-2xl p-3 font-mono text-xs text-[#F1F3F4] focus:border-[#25D366] focus:outline-none leading-relaxed resize-none"
            />
          </div>

          {/* Run Button */}
          <div>
            <button
              onClick={runDiagnostic}
              disabled={running || !code.trim()}
              className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-[#071011] font-medium py-2.5 rounded-full shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
            >
              {running ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-[#071011]" />
                  <span>Analyzing Circuit & Timing Vulnerabilities...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-[#071011] text-[#071011]" />
                  <span>Run Circuit Safety Analysis</span>
                </>
              )}
            </button>
          </div>

          {/* Results Display */}
          {result && (
            <div className="space-y-3 pt-3 border-t border-[#202728]">
              {/* Status Header */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between ${
                  result.status === "PASS"
                    ? "bg-[#073D2D] border-[#25D366]/40 text-[#25D366]"
                    : result.status === "WARNING"
                    ? "bg-[#332a15] border-[#f59e0b]/40 text-[#f59e0b]"
                    : "bg-[#381617] border-[#f87171]/40 text-[#f87171]"
                }`}
              >
                <div className="flex items-center gap-3">
                  {result.status === "PASS" ? (
                    <CheckCircle2 className="w-6 h-6 text-[#25D366]" />
                  ) : result.status === "WARNING" ? (
                    <AlertTriangle className="w-6 h-6 text-[#f59e0b]" />
                  ) : (
                    <ShieldAlert className="w-6 h-6 text-[#f87171]" />
                  )}
                  <div>
                    <div className="font-medium text-sm">
                      {result.status === "PASS"
                        ? "Diagnostic Passed (Clean Bill of Health)"
                        : result.status === "WARNING"
                        ? "Warnings Detected (Optimization Needed)"
                        : "Critical Vulnerabilities Detected"}
                    </div>
                    <div className="text-xs opacity-90 mt-0.5">{result.summary}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] uppercase opacity-75 font-medium">Safety Score</div>
                  <div className="text-xl font-medium font-mono">{result.score}/100</div>
                </div>
              </div>

              {/* Issues List */}
              {result.issues && result.issues.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-medium uppercase text-[#9AA0A2]">
                    Detected Observations ({result.issues.length}):
                  </div>
                  {result.issues.map((issue, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-[#202628] border border-[#202728] rounded-2xl space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-[#F1F3F4] flex items-center gap-1.5 text-xs">
                          {issue.severity === "high" ? (
                            <span className="text-[#f87171]">🔴 High Risk</span>
                          ) : (
                            <span className="text-[#f59e0b]">🟡 Advisory</span>
                          )}
                          <span>- {issue.message}</span>
                        </span>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#111719] text-[#9AA0A2] border border-[#202728]">
                          {issue.type}
                        </span>
                      </div>
                      <div className="text-xs text-[#F1F3F4] bg-[#111719] p-2.5 rounded-xl border border-[#202728] leading-relaxed">
                        <strong className="text-[#25D366]">Recommended Fix: </strong>
                        {issue.solution}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#111719] px-6 py-3 border-t border-[#202728] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-[#071011] font-medium text-xs rounded-full transition-colors cursor-pointer shadow-xs"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
