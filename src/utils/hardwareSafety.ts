/**
 * Hardware Safety & Rule Engine for Circuito AI
 * Provides deterministic, zero-hallucination pinout validation,
 * electrical logic level conflict detection, power budget checks,
 * and safety guardrails across all major microcontroller platforms.
 */

import { PinoutRow, SafetyNotice, TargetBoard } from "../types";

export interface HardwareValidationIssue {
  id: string;
  type: "strapping_pin" | "voltage_mismatch" | "brownout_power" | "high_voltage_mains" | "input_only_pin" | "adc2_wifi_collision" | "pin_reuse_conflict";
  severity: "info" | "warning" | "danger";
  title: string;
  pinOrModule: string;
  description: string;
  remedy: string;
}

export interface HardwareSafetyReport {
  isSafe: boolean;
  score: number; // 0 - 100
  issues: HardwareValidationIssue[];
  guardrailCount: number;
  logicVoltage: "3.3V" | "5.0V" | "Mixed";
  detectedPeripherals: string[];
  recommendations: string[];
}

// Microcontroller specifications & pinout definitions
export const MCU_SPECS: Record<
  string,
  {
    name: string;
    logicVoltage: 3.3 | 5.0;
    strappingPins: string[];
    adc2Pins: string[];
    inputOnlyPins: string[];
    i2cPins: { sda: string; scl: string };
    spiPins: { mosi: string; miso: string; sck: string; cs: string };
    maxGpioCurrentMa: number;
    totalChipCurrentMa: number;
    strappingNotes: string;
  }
> = {
  ESP32: {
    name: "ESP32 (WROOM-32)",
    logicVoltage: 3.3,
    strappingPins: ["GPIO 0", "GPIO 2", "GPIO 12", "GPIO 15", "0", "2", "12", "15"],
    adc2Pins: ["GPIO 0", "GPIO 2", "GPIO 4", "GPIO 12", "GPIO 13", "GPIO 14", "GPIO 15", "GPIO 25", "GPIO 26", "GPIO 27", "0", "2", "4", "12", "13", "14", "15", "25", "26", "27"],
    inputOnlyPins: ["GPIO 34", "GPIO 35", "GPIO 36", "GPIO 39", "GPIO 36 (VP)", "GPIO 39 (VN)", "34", "35", "36", "39", "VP", "VN"],
    i2cPins: { sda: "GPIO 21", scl: "GPIO 22" },
    spiPins: { mosi: "GPIO 23", miso: "GPIO 19", sck: "GPIO 18", cs: "GPIO 5" },
    maxGpioCurrentMa: 12,
    totalChipCurrentMa: 250,
    strappingNotes: "GPIO 0 controls flashing mode; GPIO 12 controls flash voltage (1.8V vs 3.3V); GPIO 15 suppresses boot log. Do not connect buttons or sensors with pull-ups to these pins.",
  },
  ARDUINO_UNO: {
    name: "Arduino Uno (ATmega328P)",
    logicVoltage: 5.0,
    strappingPins: ["0", "1", "Pin 0 (RX)", "Pin 1 (TX)"],
    adc2Pins: [],
    inputOnlyPins: ["A6", "A7"], // On Nano/Mini only analog input
    i2cPins: { sda: "A4", scl: "A5" },
    spiPins: { mosi: "11", miso: "12", sck: "13", cs: "10" },
    maxGpioCurrentMa: 20,
    totalChipCurrentMa: 200,
    strappingNotes: "Pins 0 (RX) and 1 (TX) are shared with the USB-to-Serial converter. Using them for sensors will corrupt code flashing.",
  },
  ESP8266: {
    name: "ESP8266 (NodeMCU)",
    logicVoltage: 3.3,
    strappingPins: ["D3 (GPIO 0)", "D4 (GPIO 2)", "D8 (GPIO 15)", "GPIO 0", "GPIO 2", "GPIO 15", "D3", "D4", "D8"],
    adc2Pins: [],
    inputOnlyPins: ["A0"],
    i2cPins: { sda: "D2 (GPIO 4)", scl: "D1 (GPIO 5)" },
    spiPins: { mosi: "D7 (GPIO 13)", miso: "D6 (GPIO 12)", sck: "D5 (GPIO 14)", cs: "D8 (GPIO 15)" },
    maxGpioCurrentMa: 12,
    totalChipCurrentMa: 170,
    strappingNotes: "D3/GPIO 0 must be HIGH during normal boot. D8/GPIO 15 must be pulled LOW. D4/GPIO 2 must be HIGH.",
  },
  RP2040: {
    name: "Raspberry Pi Pico (RP2040)",
    logicVoltage: 3.3,
    strappingPins: [],
    adc2Pins: [],
    inputOnlyPins: [],
    i2cPins: { sda: "GP4", scl: "GP5" },
    spiPins: { mosi: "GP19", miso: "GP16", sck: "GP18", cs: "GP17" },
    maxGpioCurrentMa: 12,
    totalChipCurrentMa: 300,
    strappingNotes: "RP2040 has no sensitive strapping pins, but 3.3V logic must be strictly maintained.",
  },
  STM32: {
    name: "STM32 (Blue Pill)",
    logicVoltage: 3.3,
    strappingPins: ["BOOT0", "BOOT1"],
    adc2Pins: [],
    inputOnlyPins: [],
    i2cPins: { sda: "PB7", scl: "PB6" },
    spiPins: { mosi: "PA7", miso: "PA6", sck: "PA5", cs: "PA4" },
    maxGpioCurrentMa: 20,
    totalChipCurrentMa: 150,
    strappingNotes: "BOOT0 jumper must be set to 0 for flash boot execution and 1 for DFU/UART bootloader.",
  },
};

/**
 * Identify MCU family from targetBoard string or detectedBoard string
 */
export function getMcuFamily(boardStr: string): string {
  const s = (boardStr || "").toUpperCase();
  if (s.includes("ESP32")) return "ESP32";
  if (s.includes("ESP8266") || s.includes("NODEMCU") || s.includes("WEMOS")) return "ESP8266";
  if (s.includes("UNO") || s.includes("NANO") || s.includes("MEGA") || s.includes("AVR") || s.includes("ATMEGA")) return "ARDUINO_UNO";
  if (s.includes("PICO") || s.includes("RP2040")) return "RP2040";
  if (s.includes("STM32") || s.includes("BLUE PILL")) return "STM32";
  return "ESP32"; // Default
}

/**
 * Deterministically validate pinout table and code for hardware safety
 */
export function auditHardwareSafety(
  pinoutRows: PinoutRow[],
  targetBoard: TargetBoard | string,
  firmwareCode?: string
): HardwareSafetyReport {
  const mcuKey = getMcuFamily(targetBoard);
  const spec = MCU_SPECS[mcuKey] || MCU_SPECS.ESP32;
  const issues: HardwareValidationIssue[] = [];
  const assignedPins = new Map<string, string[]>();
  const detectedPeripherals: string[] = [];

  const code = (firmwareCode || "").toLowerCase();
  const usesWifi = code.includes("wifi.h") || code.includes("blynk") || code.includes("espnow") || code.includes("mqtt");

  // 1. Audit each pinout row
  for (const row of pinoutRows) {
    const pin = row.mcuPin.trim();
    const mod = row.module.trim();
    const sig = row.signalType.toLowerCase();
    const notes = (row.wiringNotes || "").toLowerCase();
    const volt = row.voltageLogic;

    if (mod && !detectedPeripherals.includes(mod)) {
      detectedPeripherals.push(mod);
    }

    // Skip power and ground rows from pin conflict checks
    if (pin.toUpperCase() === "GND" || pin.toUpperCase().includes("3.3V") || pin.toUpperCase().includes("5V") || pin.toUpperCase() === "VIN") {
      continue;
    }

    // Track pin reuse
    const currentAssignments = assignedPins.get(pin) || [];
    currentAssignments.push(`${mod} (${row.modulePin})`);
    assignedPins.set(pin, currentAssignments);

    // Check Strapping Pins
    const isStrapping = spec.strappingPins.some((sp) => pin.toUpperCase().includes(sp.toUpperCase()));
    if (isStrapping) {
      issues.push({
        id: `strap_${pin}_${mod}`,
        type: "strapping_pin",
        severity: "danger",
        title: `Strapping Pin Collision on ${pin}`,
        pinOrModule: `${mod} -> ${pin}`,
        description: `Pin ${pin} is a critical boot strapping pin on ${spec.name}. Connecting active sensors or buttons can hold the MCU in bootloader/reset mode during power-on.`,
        remedy: `Move ${mod} from ${pin} to a safe standard GPIO (such as GPIO 4, 18, 19, 21, 22, 23).`,
      });
    }

    // Check ADC2 + Wi-Fi collision on ESP32
    if (mcuKey === "ESP32" && usesWifi && (sig.includes("analog") || sig.includes("adc"))) {
      const isAdc2 = spec.adc2Pins.some((ap) => pin.toUpperCase().includes(ap.toUpperCase()));
      if (isAdc2) {
        issues.push({
          id: `adc2_${pin}_${mod}`,
          type: "adc2_wifi_collision",
          severity: "danger",
          title: `ADC2 Wi-Fi Conflict on ${pin}`,
          pinOrModule: `${mod} -> ${pin}`,
          description: `On ESP32, all ADC2 channels are disabled by hardware whenever Wi-Fi is active. Reading ${pin} will return 0 or garbage values.`,
          remedy: `Move analog sensor ${mod} to ADC1 channels (GPIO 32, 33, 34, 35, 36, or 39).`,
        });
      }
    }

    // Check Input-Only GPIO violations (e.g. GPIO 34-39 on ESP32)
    if (mcuKey === "ESP32" && (sig.includes("output") || sig.includes("pwm") || sig.includes("trigger") || sig.includes("relay") || sig.includes("led") || sig.includes("servo"))) {
      const isInputOnly = spec.inputOnlyPins.some((ip) => pin.toUpperCase().includes(ip.toUpperCase()));
      if (isInputOnly) {
        issues.push({
          id: `inputonly_${pin}_${mod}`,
          type: "input_only_pin",
          severity: "danger",
          title: `Input-Only Pin Output Violation on ${pin}`,
          pinOrModule: `${mod} -> ${pin}`,
          description: `GPIO 34, 35, 36 (VP), and 39 (VN) are hardware input-only lines on ESP32. They have no output driver transistors or internal pull-ups.`,
          remedy: `Assign outputs like ${mod} to GPIO 4, 5, 18, 19, 21, 22, 23, 25, 26, or 27.`,
        });
      }
    }

    // Check Voltage Level Mismatch (5V Sensor to 3.3V MCU)
    if (spec.logicVoltage === 3.3 && volt === "5V" && (sig.includes("output") || sig.includes("echo") || sig.includes("tx") || sig.includes("data"))) {
      const hasDivider = notes.includes("divider") || notes.includes("shifter") || notes.includes("1k") || notes.includes("2k");
      if (!hasDivider) {
        issues.push({
          id: `volt_${pin}_${mod}`,
          type: "voltage_mismatch",
          severity: "warning",
          title: `5V to 3.3V Logic Level Mismatch on ${pin}`,
          pinOrModule: `${mod} -> ${pin}`,
          description: `${mod} outputs 5.0V logic directly into a 3.3V GPIO on ${spec.name}. Over time this causes gate dielectric breakdown and chip destruction.`,
          remedy: `Insert a voltage divider (1kΩ series + 2kΩ to GND) or a bi-directional logic level converter (e.g. BSS138).`,
        });
      }
    }
  }

  // 2. Check for duplicate GPIO assignments (unless shared I2C or SPI bus)
  assignedPins.forEach((modules, pin) => {
    if (modules.length > 1) {
      const isI2c = pin.includes("21") || pin.includes("22") || pin.includes("A4") || pin.includes("A5") || pin.includes("SDA") || pin.includes("SCL");
      const isSpi = pin.includes("18") || pin.includes("19") || pin.includes("23") || pin.includes("SCK") || pin.includes("MOSI") || pin.includes("MISO");
      if (!isI2c && !isSpi) {
        issues.push({
          id: `reuse_${pin}`,
          type: "pin_reuse_conflict",
          severity: "warning",
          title: `Conflicting Multiple Assignments on ${pin}`,
          pinOrModule: pin,
          description: `Pin ${pin} is assigned to multiple peripherals simultaneously: ${modules.join(", ")}.`,
          remedy: `Allocate each independent sensor and actuator to a distinct, unique GPIO pin.`,
        });
      }
    }
  });

  // 3. System-wide Power & High Voltage Checks
  const fullText = (pinoutRows.map((r) => `${r.module} ${r.wiringNotes}`).join(" ") + " " + (firmwareCode || "")).toLowerCase();

  // Inductive kickback & high current check
  const hasInductive = fullText.includes("relay") || fullText.includes("servo") || fullText.includes("motor") || fullText.includes("pump") || fullText.includes("solenoid");
  if (hasInductive) {
    const hasFlyback = fullText.includes("flyback") || fullText.includes("1n4007") || fullText.includes("external power") || fullText.includes("separate power");
    issues.push({
      id: "inductive_power_guard",
      type: "brownout_power",
      severity: hasFlyback ? "info" : "warning",
      title: "Inductive Actuator & Brownout Isolation",
      pinOrModule: "Motors / Relays / Servos",
      description: "Inductive coils draw up to 500mA-1A inrush current, inducing severe voltage droop that triggers MCU brownout reset loops.",
      remedy: "Power actuators from an external 5V/12V supply with a shared common Ground (GND) and place 1N4007 flyback diodes across DC coils.",
    });
  }

  // 230V AC Mains Warning
  const hasMains = fullText.includes("230v") || fullText.includes("110v") || fullText.includes("mains") || fullText.includes("ac appliance") || fullText.includes("light bulb");
  if (hasMains) {
    issues.push({
      id: "high_voltage_mains_guard",
      type: "high_voltage_mains",
      severity: "danger",
      title: "Lethal 230V/110V AC Mains Hazard",
      pinOrModule: "AC Mains Terminals",
      description: "High voltage AC switching poses lethal electrical shock hazards and dielectric flashover risks.",
      remedy: "Use optocoupler-isolated relay boards with PCB isolation slots (>3mm creepage distance) and enclose all mains screw terminals in an insulated safety box.",
    });
  }

  // Calculate safety score
  let score = 100;
  for (const issue of issues) {
    if (issue.severity === "danger") score -= 25;
    else if (issue.severity === "warning") score -= 10;
    else if (issue.severity === "info") score -= 2;
  }
  score = Math.max(20, Math.min(100, score));

  const recommendations = [
    "Always perform a multimeter continuity test (DMM beeper) between VCC and GND before initial power-on.",
    "Verify supply voltage under active load using a voltmeter to ensure voltage does not drop below 3.1V.",
    "Ensure all sensor, actuator, and MCU grounds are connected to a single common Ground rail.",
    "Never connect or disconnect sensors while the microcontroller is powered.",
  ];

  return {
    isSafe: !issues.some((i) => i.severity === "danger"),
    score: score,
    issues: issues,
    guardrailCount: issues.length,
    logicVoltage: spec.logicVoltage === 3.3 ? "3.3V" : "5.0V",
    detectedPeripherals: detectedPeripherals,
    recommendations: recommendations,
  };
}
