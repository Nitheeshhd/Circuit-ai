export type TargetBoard =
  | "Auto-Select"
  | "Arduino Uno / Nano"
  | "ESP32 (WROOM-32)"
  | "ESP8266 (NodeMCU)"
  | "STM32 (Blue Pill)"
  | "Raspberry Pi Pico"
  | "8051 Microcontroller"
  | "Arduino Mega 2560";

export type FirmwareLanguage =
  | "Arduino C++ (.ino)"
  | "MicroPython (.py)"
  | "Embedded C (Keil/AVR)"
  | "CircuitPython (.py)";

export type ProjectComplexity =
  | "Undergraduate Lab / Mini Project"
  | "Final Year / Capstone IoT Project"
  | "Hobbyist / Maker Quick Build"
  | "Commercial / Industrial Prototype";

export interface BOMItem {
  component: string;
  specification: string;
  quantity: string | number;
  role: string;
  approxPriceINR: number;
  sourceNote?: string;
  unitPriceINR?: number;
  totalLinePriceINR?: number;
  category?: string;
  marketConfidence?: "High" | "Medium" | "Estimated";
  inventoryStatus?: "needs_purchasing" | "in_inventory";
  simulatedVendors?: {
    robuINR: number;
    electronicsCompINR: number;
    amazonINR: number;
  };
}

export interface BOMCostSummary {
  totalEstimatedINR: number;
  totalParsedINR: number;
  budgetStoreTotalINR: number;
  fastDeliveryTotalINR: number;
  totalItemCount: number;
  totalQuantity: number;
  categoryBreakdown: {
    category: string;
    count: number;
    totalINR: number;
    percentage: number;
    color: string;
  }[];
  primaryVendorEstimate: {
    vendor: string;
    subtotalINR: number;
    deliveryTimeDays: string;
    shippingEstimateINR: number;
  };
  savingsAlternative: {
    tip: string;
    potentialSavingsINR: number;
  };
}

export interface PinoutRow {
  module: string;
  modulePin: string;
  mcuPin: string;
  signalType: string;
  voltageLogic: "3.3V" | "5V" | "Analog" | "Power/GND";
  wiringNotes: string;
  isStrappingWarning?: boolean;
  needsLevelShifter?: boolean;
}

export interface SafetyNotice {
  type: "strapping_pin" | "voltage_mismatch" | "brownout_power" | "high_voltage_mains" | "thermal";
  title: string;
  description: string;
  severity: "info" | "warning" | "danger";
  remedy: string;
}

export interface VivaQuestion {
  question: string;
  answer: string;
  category: "Working Principle" | "Interfacing & Protocols" | "Power & Logic" | "Code Logic" | "Troubleshooting";
}

export interface ParsedBlueprint {
  rawMarkdown: string;
  executiveSummary: string;
  bomItems: BOMItem[];
  totalCostINR: number;
  bomCostSummary?: BOMCostSummary;
  pinoutRows: PinoutRow[];
  safetyNotices: SafetyNotice[];
  codeBlock: {
    language: string;
    code: string;
    libraries: string[];
  };
  workingLogic?: string;
  wiringNotes?: string;
  testingSteps: string[];
  troubleshootingSteps?: string[];
  vivaQuestions: VivaQuestion[];
  detectedBoard: string;
}

export interface ProjectPreset {
  id: string;
  title: string;
  category: "IoT" | "Robotics" | "Automation" | "Healthcare" | "Academic 8051" | "Power Electronics";
  description: string;
  prompt: string;
  targetBoard: TargetBoard;
  tags: string[];
}

export type ChatRolePreset =
  | "builder"
  | "advisor"
  | "debugger"
  | "firmware"
  | "iot"
  | "viva"
  | "power"
  | "resistor";

export type ChatModelOption =
  | "gemini-2.5-pro"
  | "gemini-2.5-flash"
  | "gemini-2.0-flash";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  modelUsed?: string;
  roleUsed?: ChatRolePreset;
}

export interface DiagnosticIssue {
  type: "pin_conflict" | "voltage_mismatch" | "brownout" | "code_bug" | "optimization";
  severity: "low" | "medium" | "high";
  message: string;
  solution: string;
}

export interface DiagnosticResult {
  status: "PASS" | "WARNING" | "CRITICAL";
  score: number;
  issues: DiagnosticIssue[];
  summary: string;
}

export type SubscriptionTier = "free" | "student" | "pro";
export type SubscriptionStatus = "active" | "inactive" | "expired" | "pending";

export type FeatureKey =
  | "basicGeneration"
  | "unlimitedPrompt"
  | "firmware"
  | "pinout"
  | "viva"
  | "diagnostics"
  | "priorityStreaming"
  | "cloudSync";

export interface UserProfile {
  userId: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: any;
  lastLoginAt: any;
  subscriptionTier?: SubscriptionTier;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionExpiresAt?: number | null;
}

export interface SavedCircuitProject {
  id: string;
  ownerId: string;
  title: string;
  description?: string;
  targetBoard: string;
  systemArchitecture?: string;
  componentsJson?: string;
  pinMappingsJson?: string;
  firmwareCode?: string;
  schematicAscii?: string;
  verificationChecklistJson?: string;
  starred?: boolean;
  createdAt: any;
  updatedAt: any;
}
