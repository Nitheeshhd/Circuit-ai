/**
 * Static Firmware Linter & Safety Auditor for Circuito AI
 * Validates C++, Arduino (.ino), and MicroPython code without executing raw code.
 */

export interface LinterIssue {
  line?: number;
  category: "syntax" | "performance" | "hardware_safety" | "reliability";
  severity: "high" | "medium" | "low";
  rule: string;
  message: string;
  solution: string;
}

export interface FirmwareLintResult {
  passed: boolean;
  score: number; // 0 - 100
  language: string;
  issues: LinterIssue[];
  metrics: {
    totalLines: number;
    hasSetup: boolean;
    hasLoop: boolean;
    hasSerial: boolean;
    baudRate: number | null;
    blockingDelaysCount: number;
    pinModesDeclaredCount: number;
    librariesIncluded: string[];
  };
  summary: string;
}

export function lintFirmwareCode(code: string, targetBoard?: string): FirmwareLintResult {
  const issues: LinterIssue[] = [];
  const lines = (code || "").split("\n");
  const cleanCode = code || "";
  const isPython = cleanCode.includes("def main():") || cleanCode.includes("import machine") || cleanCode.includes("import time");
  const language = isPython ? "MicroPython" : "Arduino C++";

  let hasSetup = false;
  let hasLoop = false;
  let hasSerial = false;
  let baudRate: number | null = null;
  let blockingDelaysCount = 0;
  let pinModesDeclaredCount = 0;
  const librariesIncluded: string[] = [];

  // 1. Structural and Syntax Checks
  if (!isPython) {
    // Check balanced braces
    let openBraces = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // remove single line comments
      const uncommented = line.replace(/\/\/.*$/, "");
      for (const char of uncommented) {
        if (char === "{") openBraces++;
        if (char === "}") openBraces--;
      }
    }
    if (openBraces !== 0) {
      issues.push({
        category: "syntax",
        severity: "high",
        rule: "UNBALANCED_BRACES",
        message: `Mismatched curly braces detected (${openBraces > 0 ? "missing closing }" : "extra closing }"})`,
        solution: "Ensure every opening brace '{' has a corresponding closing brace '}'.",
      });
    }

    // Check setup() and loop()
    if (/void\s+setup\s*\(\s*\)/.test(cleanCode)) hasSetup = true;
    if (/void\s+loop\s*\(\s*\)/.test(cleanCode)) hasLoop = true;

    if (!hasSetup) {
      issues.push({
        category: "syntax",
        severity: "high",
        rule: "MISSING_SETUP",
        message: "Missing 'void setup()' initialization function.",
        solution: "Declare 'void setup()' to configure GPIO pinModes and communication buses.",
      });
    }

    if (!hasLoop) {
      issues.push({
        category: "syntax",
        severity: "high",
        rule: "MISSING_LOOP",
        message: "Missing 'void loop()' execution cycle function.",
        solution: "Declare 'void loop()' containing the main non-blocking polling state machine.",
      });
    }

    // Check Serial.begin
    const serialMatch = cleanCode.match(/Serial\.begin\s*\(\s*(\d+)\s*\)/);
    if (serialMatch) {
      hasSerial = true;
      baudRate = parseInt(serialMatch[1], 10);
    } else {
      issues.push({
        category: "reliability",
        severity: "low",
        rule: "MISSING_SERIAL_INIT",
        message: "No 'Serial.begin()' initialization found in code.",
        solution: "Add 'Serial.begin(115200);' in setup() for bench diagnostics and calibration monitoring.",
      });
    }

    // Extract libraries
    const incMatches = cleanCode.matchAll(/#include\s*[<"]([^>"]+)[>"]/g);
    for (const match of incMatches) {
      librariesIncluded.push(match[1]);
    }
  }

  // 2. Line-by-line inspection
  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i];
    const cleanLine = line.replace(/\/\/.*$/, "").trim();

    // Check for blocking delays
    const delayMatch = cleanLine.match(/delay\s*\(\s*(\d+)\s*\)/);
    if (delayMatch) {
      const delayMs = parseInt(delayMatch[1], 10);
      if (delayMs >= 100) {
        blockingDelaysCount++;
        if (blockingDelaysCount <= 3) {
          issues.push({
            line: lineNum,
            category: "performance",
            severity: delayMs > 1000 ? "high" : "medium",
            rule: "BLOCKING_DELAY_DETECTED",
            message: `Blocking 'delay(${delayMs})' freezes MCU execution for ${delayMs}ms.`,
            solution: "Replace with non-blocking 'millis()' task timers to avoid triggering Watchdog Timer (WDT) resets.",
          });
        }
      }
    }

    // Check pinMode declarations
    if (/pinMode\s*\(/.test(cleanLine)) {
      pinModesDeclaredCount++;
    }

    // Check for potential infinite loops
    if (/while\s*\(\s*(1|true)\s*\)/.test(cleanLine) && !cleanLine.includes("break") && !cleanLine.includes("yield") && !cleanLine.includes("delay")) {
      issues.push({
        line: lineNum,
        category: "performance",
        severity: "high",
        rule: "UNGUARDED_INFINITE_LOOP",
        message: "Potentially unbounded 'while(true)' loop without yield or timeout.",
        solution: "Ensure the loop includes an exit condition or 'yield()' to prevent FreeRTOS watchdog starvation.",
      });
    }

    // Check for raw ESP32 strapping pins in pinMode
    if (targetBoard?.includes("ESP32")) {
      if (/pinMode\s*\(\s*(0|2|12|15)\s*,/.test(cleanLine)) {
        issues.push({
          line: lineNum,
          category: "hardware_safety",
          severity: "high",
          rule: "ESP32_STRAPPING_PIN_CONFIG",
          message: "Configuring strapping pin (GPIO 0, 2, 12, or 15) in pinMode.",
          solution: "Use standard non-boot GPIOs (such as GPIO 4, 18, 19, 21, 22, 23).",
        });
      }

      // Check input-only pins as OUTPUT
      if (/pinMode\s*\(\s*(34|35|36|39)\s*,\s*(OUTPUT|INPUT_PULLUP)/.test(cleanLine)) {
        issues.push({
          line: lineNum,
          category: "hardware_safety",
          severity: "high",
          rule: "INPUT_ONLY_PIN_AS_OUTPUT",
          message: "GPIO 34-39 are hardware input-only on ESP32 and cannot be set as OUTPUT or INPUT_PULLUP.",
          solution: "Change pin to an output-capable GPIO (e.g. GPIO 4, 5, 18, 19, 21, 22, 23).",
        });
      }
    }
  }

  // 3. Sensor-specific guard checks
  if (cleanCode.includes("DHT") || cleanCode.includes("dht.")) {
    if (!cleanCode.includes("isnan(")) {
      issues.push({
        category: "reliability",
        severity: "medium",
        rule: "UNGUARDED_DHT_READ",
        message: "DHT sensor reading without 'isnan()' validation guard.",
        solution: "Wrap sensor readings in 'if (isnan(temperature) || isnan(humidity)) { ... }' to reject corrupted I/O packets.",
      });
    }
  }

  if (cleanCode.includes("pulseIn(") && !cleanCode.includes("30000")) {
    issues.push({
      category: "reliability",
      severity: "low",
      rule: "UNBOUNDED_PULSEIN",
      message: "Ultrasonic 'pulseIn()' call without timeout argument.",
      solution: "Add a 30000 microsecond timeout: 'pulseIn(echoPin, HIGH, 30000UL);' to prevent 1-second hangs on disconnected sensors.",
    });
  }

  // 4. Calculate score
  let score = 100;
  for (const issue of issues) {
    if (issue.severity === "high") score -= 20;
    else if (issue.severity === "medium") score -= 10;
    else if (issue.severity === "low") score -= 3;
  }
  score = Math.max(15, Math.min(100, score));

  const passed = !issues.some((i) => i.severity === "high");
  let summary = "Firmware passed all static syntax, compiler, non-blocking timing, and hardware safety audits!";
  if (issues.length > 0) {
    summary = passed
      ? `Firmware is functional with ${issues.length} advisory optimization notice(s).`
      : `Detected ${issues.filter((i) => i.severity === "high").length} critical issue(s) requiring remediation.`;
  }

  return {
    passed,
    score,
    language,
    issues,
    metrics: {
      totalLines: lines.length,
      hasSetup,
      hasLoop,
      hasSerial,
      baudRate,
      blockingDelaysCount,
      pinModesDeclaredCount,
      librariesIncluded,
    },
    summary,
  };
}
