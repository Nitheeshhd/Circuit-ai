/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "motion/react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { LeftPanel } from "./components/LeftPanel";
import { RightPanel } from "./components/RightPanel";
import { ApiKeyModal } from "./components/ApiKeyModal";
import { AiHardwareCalculatorModal, CalculatorTab } from "./components/AiHardwareCalculatorModal";
import { CircuitDiagnosticsModal } from "./components/CircuitDiagnosticsModal";
import { HardwareChatDrawer } from "./components/HardwareChatDrawer";
import { CircuitLoadingOverlay } from "./components/CircuitLoadingOverlay";
import { CloudProjectsModal } from "./components/CloudProjectsModal";
import { NewProjectModal } from "./components/NewProjectModal";
import { DocumentationModal } from "./components/DocumentationModal";
import { LoginPage } from "./components/LoginPage";
import { SubscriptionPlansModal } from "./components/SubscriptionPlansModal";
import { CheckoutModal } from "./components/CheckoutModal";
import { Cpu, Loader2, CheckCircle2, X } from "lucide-react";
import {
  TargetBoard,
  FirmwareLanguage,
  ProjectComplexity,
  ParsedBlueprint,
  ProjectPreset,
  SavedCircuitProject,
  SubscriptionTier,
  SubscriptionStatus,
} from "./types";
import { parseBlueprintMarkdown } from "./utils/parser";
import {
  hasRemainingMonthlyQuota,
  incrementMonthlyUsage,
  getMonthlyQuotaInfo,
} from "./utils/entitlements";
import {
  onAuthStateChanged,
  AppUser as User,
  subscribeToUserProjects,
  getUserProfileFromSupabase,
  updateUserSubscriptionInSupabase,
  saveProjectToSupabase,
} from "./services/supabase";
import { VerificationResult } from "./services/payment";
import { getEffectiveTier } from "./utils/entitlements";

export default function App() {
  // State management
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem("GEMINI_API_KEY") || "");
  const [hasServerKey, setHasServerKey] = useState<boolean>(true);
  const [prompt, setPrompt] = useState<string>("");
  const [targetBoard, setTargetBoard] = useState<TargetBoard>("Auto-Select");

  // Subscription State
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>("free");
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>("active");
  const [subscriptionExpiresAt, setSubscriptionExpiresAt] = useState<number | null>(null);

  // Subscription Modals & Toast
  const [isPlansModalOpen, setIsPlansModalOpen] = useState<boolean>(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState<boolean>(false);
  const [checkoutTargetPlan, setCheckoutTargetPlan] = useState<"student" | "pro">("student");
  const [notificationToast, setNotificationToast] = useState<string | null>(null);
  const [language, setLanguage] = useState<FirmwareLanguage>("Arduino C++ (.ino)");
  const [complexity, setComplexity] = useState<ProjectComplexity>("Undergraduate Lab / Mini Project");
  const [activeNav, setActiveNav] = useState<string>("workspace");
  const [currentProjectTitle, setCurrentProjectTitle] = useState<string>("Project Alpha");


  // Advanced AI toggles
  const [thinkingMode, setThinkingMode] = useState<boolean>(false);
  const [searchGrounding, setSearchGrounding] = useState<boolean>(false);
  const [lowLatencyMode, setLowLatencyMode] = useState<boolean>(false);
  const [modelMode, setModelMode] = useState<"flash" | "thinking" | "lite" | "search">("flash");

  // Blueprint output & stream state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [streamedText, setStreamedText] = useState<string>("");
  const [blueprint, setBlueprint] = useState<ParsedBlueprint>(() => parseBlueprintMarkdown(""));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Supabase Auth & Cloud Projects
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [isGuestMode, setIsGuestMode] = useState<boolean>(false);
  const [savedProjects, setSavedProjects] = useState<SavedCircuitProject[]>(() => {
    try {
      const local = localStorage.getItem("circuito_local_projects");
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: "sample-1",
        title: "Smart IoT Weather Station",
        description: "Smart environmental monitoring station with DHT22 temperature/humidity sensor, 0.96 inch OLED display, and MQTT telemetry reporting.",
        targetBoard: "ESP32 (WROOM-32)",
        createdAt: Date.now() - 3600000 * 2,
        starred: true,
        componentsJson: JSON.stringify([
          { component: "ESP32 DevKit V1", specification: "Wi-Fi & Bluetooth MCU", quantity: 1, role: "Main Microcontroller", approxPriceINR: 295 },
          { component: "DHT22 Sensor", specification: "Temp & Humidity", quantity: 1, role: "Environmental sensing", approxPriceINR: 210 },
          { component: "0.96\" OLED Display", specification: "128x64 I2C SSD1306", quantity: 1, role: "Data Visualization", approxPriceINR: 140 }
        ]),
        pinMappingsJson: JSON.stringify([
          { module: "DHT22", modulePin: "DATA", mcuPin: "GPIO 4", signalType: "Digital / OneWire", voltageLogic: "3.3V", wiringNotes: "10K pull-up resistor required" },
          { module: "OLED", modulePin: "SDA", mcuPin: "GPIO 21", signalType: "I2C SDA", voltageLogic: "3.3V", wiringNotes: "Built-in pull-up" },
          { module: "OLED", modulePin: "SCL", mcuPin: "GPIO 22", signalType: "I2C SCL", voltageLogic: "3.3V", wiringNotes: "Built-in pull-up" }
        ]),
        firmwareCode: `#include <WiFi.h>\n#include <Wire.h>\n#include <Adafruit_GFX.h>\n#include <Adafruit_SSD1306.h>\n#include <DHT.h>\n\n#define DHTPIN 4\n#define DHTTYPE DHT22\nDHT dht(DHTPIN, DHTTYPE);\n\nvoid setup() {\n  Serial.begin(115200);\n  dht.begin();\n  Serial.println("Weather Station Initialized");\n}\n\nvoid loop() {\n  float h = dht.readHumidity();\n  float t = dht.readTemperature();\n  Serial.printf("Temp: %.1f C, Humidity: %.1f %%\\n", t, h);\n  delay(2000);\n}`,
        verificationChecklistJson: JSON.stringify([
          "Verify 3.3V power rail stability using a multimeter.",
          "Check I2C address 0x3C for OLED display.",
          "Test DHT22 sensor readings over Serial Monitor."
        ])
      },
      {
        id: "sample-2",
        title: "ESP32 BLE GPS Tracker",
        description: "Compact real-time GPS asset tracker using NEO-6M module, ESP32 Bluetooth Low Energy, and lithium battery management.",
        targetBoard: "ESP32 (WROOM-32)",
        createdAt: Date.now() - 3600000 * 24,
        starred: false,
        componentsJson: JSON.stringify([
          { component: "ESP32 NodeMCU", specification: "Tensilica Dual-Core", quantity: 1, role: "Microcontroller", approxPriceINR: 295 },
          { component: "NEO-6M GPS", specification: "UART GPS Module", quantity: 1, role: "Location Tracking", approxPriceINR: 420 },
          { component: "LiPo Battery 18650", specification: "3.7V 2200mAh with TP4056", quantity: 1, role: "Power Source", approxPriceINR: 95 }
        ]),
        pinMappingsJson: JSON.stringify([
          { module: "NEO-6M", modulePin: "TX", mcuPin: "GPIO 16 (RX2)", signalType: "UART RX", voltageLogic: "3.3V", wiringNotes: "Connect to GPS TX" },
          { module: "NEO-6M", modulePin: "RX", mcuPin: "GPIO 17 (TX2)", signalType: "UART TX", voltageLogic: "3.3V", wiringNotes: "Connect to GPS RX" }
        ]),
        firmwareCode: `#include <TinyGPSPlus.h>\n#include <HardwareSerial.h>\n\nTinyGPSPlus gps;\nHardwareSerial GPS(2);\n\nvoid setup() {\n  Serial.begin(115200);\n  GPS.begin(9600, SERIAL_8N1, 16, 17);\n  Serial.println("GPS Tracker Ready");\n}\n\nvoid loop() {\n  while (GPS.available() > 0) {\n    if (gps.encode(GPS.read())) {\n      if (gps.location.isValid()) {\n        Serial.printf("Lat: %.6f, Lon: %.6f\\n", gps.location.lat(), gps.location.lng());\n      }\n    }\n  }\n}`,
        verificationChecklistJson: JSON.stringify([
          "Ensure clear sky view for GPS lock.",
          "Check UART baud rate 9600 for NEO-6M."
        ])
      },
      {
        id: "sample-3",
        title: "Automated Plant Watering",
        description: "Smart irrigation system with capacitive soil moisture sensor, 5V relay module controlling a mini water pump, and OLED status display.",
        targetBoard: "Arduino Uno / Nano",
        createdAt: Date.now() - 3600000 * 48,
        starred: true,
        componentsJson: JSON.stringify([
          { component: "Arduino Nano", specification: "ATmega328P", quantity: 1, role: "Microcontroller", approxPriceINR: 160 },
          { component: "Soil Moisture Sensor", specification: "Capacitive v1.2", quantity: 1, role: "Moisture detection", approxPriceINR: 68 },
          { component: "5V Relay Module", specification: "Optocoupled 1-Channel", quantity: 1, role: "Pump Switch", approxPriceINR: 38 },
          { component: "Mini Water Pump 5V", specification: "Submersible DC", quantity: 1, role: "Water delivery", approxPriceINR: 78 }
        ]),
        pinMappingsJson: JSON.stringify([
          { module: "Soil Sensor", modulePin: "AOUT", mcuPin: "A0", signalType: "Analog Input", voltageLogic: "5V", wiringNotes: "Analog moisture reading" },
          { module: "Relay", modulePin: "IN", mcuPin: "Pin 7", signalType: "Digital Output", voltageLogic: "5V", wiringNotes: "Trigger relay switch" }
        ]),
        firmwareCode: `#define MOISTURE_PIN A0\n#define RELAY_PIN 7\n\nvoid setup() {\n  pinMode(RELAY_PIN, OUTPUT);\n  digitalWrite(RELAY_PIN, HIGH);\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  int val = analogRead(MOISTURE_PIN);\n  Serial.print("Moisture Value: ");\n  Serial.println(val);\n  if (val > 600) {\n    digitalWrite(RELAY_PIN, LOW);\n    delay(5000);\n    digitalWrite(RELAY_PIN, HIGH);\n  }\n  delay(10000);\n}`,
        verificationChecklistJson: JSON.stringify([
          "Verify external 5V power supply for water pump.",
          "Calibrate dry and wet threshold values."
        ])
      }
    ];
  });
  const [isLoadingProjects, setIsLoadingProjects] = useState<boolean>(false);
  const [isCloudProjectsOpen, setIsCloudProjectsOpen] = useState<boolean>(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState<boolean>(false);
  const [isDocumentationOpen, setIsDocumentationOpen] = useState<boolean>(false);

  // Modals & Drawers
  const [isKeyModalOpen, setIsKeyModalOpen] = useState<boolean>(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState<boolean>(false);
  const [calculatorInitialTab, setCalculatorInitialTab] = useState<CalculatorTab>("ai_solver");
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Listen to Supabase Auth state & sync subscription profile
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      setIsLoadingAuth(false);
      if (!currentUser) {
        setIsGuestMode(false);
        setSubscriptionTier("free");
        setSubscriptionStatus("active");
        setSubscriptionExpiresAt(null);
      } else {
        const profile = await getUserProfileFromSupabase(currentUser.uid);
        if (profile) {
          const effective = getEffectiveTier(profile.subscriptionTier, profile.subscriptionExpiresAt);
          setSubscriptionTier(effective);
          setSubscriptionStatus(profile.subscriptionStatus || "active");
          setSubscriptionExpiresAt(profile.subscriptionExpiresAt || null);
        }
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Handle successful subscription activation
  const handlePaymentSuccess = async (result: VerificationResult) => {
    setIsCheckoutModalOpen(false);
    setIsPlansModalOpen(false);

    const planTier = result.plan || checkoutTargetPlan;
    const expiresAt = result.subscriptionExpiresAt || Date.now() + 30 * 24 * 60 * 60 * 1000;

    setSubscriptionTier(planTier);
    setSubscriptionStatus("active");
    setSubscriptionExpiresAt(expiresAt);

    if (user) {
      await updateUserSubscriptionInSupabase(user.uid, planTier, "active", expiresAt);
    }

    const toastMsg = `🎉 ${planTier === "student" ? "Student Plan" : "Pro Plan"} Activated! All premium features and unlimited prompt generation are now unlocked.`;
    setNotificationToast(toastMsg);
    setTimeout(() => setNotificationToast(null), 8000);

    try {
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch {}
  };

  // Persist local projects to localStorage only when user is unauthenticated
  useEffect(() => {
    if (!user) {
      try {
        localStorage.setItem("circuito_local_projects", JSON.stringify(savedProjects));
      } catch {}
    }
  }, [user, savedProjects]);

  // Subscribe to user Supabase circuit projects when authenticated
  useEffect(() => {
    if (!user) return;

    setIsLoadingProjects(true);
    const unsubscribeProjects = subscribeToUserProjects(
      user.uid,
      (projects) => {
        setSavedProjects(projects || []);
        setIsLoadingProjects(false);
      },
      (error) => {
        console.error("Failed to load user projects:", error);
        setIsLoadingProjects(false);
      }
    );

    return () => unsubscribeProjects();
  }, [user?.uid]);

  const handleSaveLocalProject = (newProj: SavedCircuitProject) => {
    setSavedProjects((prev) => [newProj, ...prev]);
  };

  const handleDeleteLocalProject = (projectId: string) => {
    setSavedProjects((prev) => prev.filter((p) => p.id !== projectId));
  };

  const handleToggleStarLocal = (projectId: string) => {
    setSavedProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, starred: !p.starred } : p))
    );
  };

  const handleOpenCalculator = (tab: CalculatorTab = "ai_solver") => {
    setCalculatorInitialTab(tab);
    setIsCalculatorOpen(true);
  };

  // Initial check for server key
  useEffect(() => {
    fetch("/api/v1/health")
      .then(async (res) => {
        let data: { hasServerKey?: boolean; error?: string };
        try {
          data = await res.json();
        } catch {
          throw new Error(`Health check returned a non-JSON response (HTTP ${res.status}).`);
        }
        if (!res.ok) {
          throw new Error(data.error || `Health check failed with status ${res.status}.`);
        }
        return data;
      })
      .then((data) => {
        if (data && typeof data.hasServerKey === "boolean") {
          setHasServerKey(data.hasServerKey);
        }
      })
      .catch((err) => console.error("Health check error:", err));
  }, []);

  // Update parsed blueprint whenever streamed text updates
  useEffect(() => {
    if (streamedText) {
      const parsed = parseBlueprintMarkdown(streamedText);
      setBlueprint(parsed);
    }
  }, [streamedText]);

  // Handle saving API key
  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    if (key) {
      localStorage.setItem("GEMINI_API_KEY", key);
    } else {
      localStorage.removeItem("GEMINI_API_KEY");
    }
  };

  // Handle appending hardware calculation results to the project prompt
  const handleApplyCalculatorSnippet = (snippet: string) => {
    setPrompt((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed}\n\n[Hardware Calculation: ${snippet}]` : snippet;
    });
  };

  // Handle preset selection
  const handleSelectPreset = (preset: ProjectPreset) => {
    setPrompt(preset.prompt);
    setTargetBoard(preset.targetBoard);
    setErrorMsg(null);
  };

  // Handle loading saved circuit project from Supabase
  const handleLoadSavedProject = (project: SavedCircuitProject) => {
    setPrompt(project.description || project.title);
    if (project.targetBoard) {
      setTargetBoard(project.targetBoard as TargetBoard);
    }

    // Reconstruct markdown representation to populate all tabs and pin visualizers
    let rawMd = `# ${project.title}\n\n## 1. Executive Summary & System Architecture\n${
      project.systemArchitecture || project.description || ""
    }\n\n`;

    if (project.componentsJson) {
      try {
        const bomItems = JSON.parse(project.componentsJson);
        rawMd += `## 2. Hardware Bill of Materials (BOM)\n| Component | Specification | Quantity | Role / Function | Approx. Market Price (INR) |\n| :--- | :--- | :--- | :--- | :--- |\n`;
        bomItems.forEach((b: any) => {
          rawMd += `| ${b.component} | ${b.specification} | ${b.quantity} | ${b.role} | ₹${
            b.approxPriceINR || b.unitPriceINR || 0
          } |\n`;
        });
        rawMd += `\n`;
      } catch (e) {}
    }

    if (project.pinMappingsJson) {
      try {
        const pinRows = JSON.parse(project.pinMappingsJson);
        rawMd += `## 3. Circuit Wiring & Microcontroller Pinout Table\n| Module / Sensor Pin | Target MCU Pin | Signal Type | Voltage Logic Level | Wiring Notes & Warnings |\n| :--- | :--- | :--- | :--- | :--- |\n`;
        pinRows.forEach((p: any) => {
          rawMd += `| ${p.module || ""} ${p.modulePin || ""} | ${p.mcuPin} | ${p.signalType || ""} | ${
            p.voltageLogic || "3.3V"
          } | ${p.wiringNotes || ""} |\n`;
        });
        rawMd += `\n`;
      } catch (e) {}
    }

    if (project.firmwareCode) {
      rawMd += `## 4. Production-Ready Embedded Firmware\n\`\`\`cpp\n${project.firmwareCode}\n\`\`\`\n\n`;
    }

    if (project.verificationChecklistJson) {
      try {
        const steps = JSON.parse(project.verificationChecklistJson);
        rawMd += `## 6. Step-by-Step Hardware Testing & Validation Procedure\n`;
        steps.forEach((s: string, idx: number) => {
          rawMd += `${idx + 1}. ${s}\n`;
        });
        rawMd += `\n`;
      } catch (e) {}
    }

    setStreamedText(rawMd);
    const parsed = parseBlueprintMarkdown(rawMd);
    setBlueprint(parsed);

    try {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.7 },
      });
    } catch {}
  };

  // Stop generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    setShowLoadingOverlay(false);
  };

  // Generate Stream
  const handleGenerate = async (requestedModel?: string) => {
    if (!prompt.trim()) return;

    // Verify monthly generation quota (9 free projects per month per account)
    const userId = user?.uid || "guest";
    if (!hasRemainingMonthlyQuota(userId)) {
      const q = getMonthlyQuotaInfo(userId);
      setErrorMsg(
        `Monthly project generation limit reached (${q.used}/${q.max} projects generated this month). All tools are 100% free for 9 projects per month per account. Your quota will reset on ${q.resetDate}.`
      );
      return;
    }

    // Check if key is available
    if (!apiKey && !hasServerKey) {
      setIsKeyModalOpen(true);
      return;
    }

    setIsGenerating(true);
    setShowLoadingOverlay(true);
    setErrorMsg(null);
    setStreamedText("");
    setBlueprint(parseBlueprintMarkdown(""));

    abortControllerRef.current = new AbortController();

    try {
      let modelOverride: string | undefined = requestedModel;
      if (!modelOverride && lowLatencyMode) {
        modelOverride = "gemini-3.1-flash-lite";
      } else if (!modelOverride && thinkingMode) {
        modelOverride = "gemini-3.1-pro-preview";
      } else if (!modelOverride && searchGrounding) {
        modelOverride = "gemini-3.5-flash";
      }

      const res = await fetch("/api/v1/generate-stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { "x-gemini-api-key": apiKey } : {}),
        },
        body: JSON.stringify({
          prompt: prompt,
          preferred_board: targetBoard,
          language: language,
          complexity: complexity,
          thinking_mode: thinkingMode,
          enable_search: searchGrounding,
          model_override: modelOverride,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        let errorMessage = `Server responded with status ${res.status}`;
        try {
          const errJson = await res.json();
          if (typeof errJson.error === "string") {
            errorMessage = errJson.error;
          }
        } catch {
          errorMessage = `Server returned a non-JSON error response (HTTP ${res.status}).`;
        }
        throw new Error(errorMessage);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      let accumulated = "";

      if (!reader) throw new Error("ReadableStream not supported by browser.");

      let receivedError: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        const lines = chunkText.split("\n\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text) {
                accumulated += data.text;
                setStreamedText(accumulated);
                // Once substantial markdown content arrives, smoothly dismiss overlay to reveal live rendering
                if (accumulated.length > 250) {
                  setShowLoadingOverlay(false);
                }
              }
              if (data.error) {
                receivedError = data.error;
              }
            } catch (e) {
              // Ignore partial JSON parse errors during chunk boundary
            }
          }
        }
      }

      if (receivedError) {
        throw new Error(receivedError);
      }

      // Increment monthly project counter on successful generation
      if (accumulated.trim().length > 100) {
        incrementMonthlyUsage(userId);
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 },
          });
        } catch (e) {
          // Safe fallback
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Generation aborted by user.");
      } else {
        console.error("Stream generation error:", err);
        setErrorMsg(err.message || "Failed to generate blueprint. Please check your API key or connection.");
      }
    } finally {
      setIsGenerating(false);
      setShowLoadingOverlay(false);
      abortControllerRef.current = null;
    }
  };

  const handleUpdateBOMItemStatus = (index: number, status: "needs_purchasing" | "in_inventory") => {
    setBlueprint((prev) => {
      const updatedItems = [...prev.bomItems];
      if (updatedItems[index]) {
        updatedItems[index] = { ...updatedItems[index], inventoryStatus: status };
      }
      return { ...prev, bomItems: updatedItems };
    });
  };

  const handleUpdateAllBOMItemStatuses = (status: "needs_purchasing" | "in_inventory") => {
    setBlueprint((prev) => {
      const updatedItems = prev.bomItems.map(item => ({ ...item, inventoryStatus: status }));
      return { ...prev, bomItems: updatedItems };
    });
  };

  // Check if loading auth state on initial boot
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#07090e] text-white">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00c853] to-[#10b981] flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-baseline gap-1 font-display">
            <span className="text-2xl font-black text-white">Circuito</span>
            <span className="text-2xl font-black text-[#00c853]">AI</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
          <Loader2 className="w-4 h-4 animate-spin text-[#00c853]" />
          <span>Initializing Circuito AI...</span>
        </div>
      </div>
    );
  }

  // Gate app behind LoginPage at startup if not authenticated
  if (!user && !isGuestMode) {
    return (
      <LoginPage
        onLoginSuccess={(loggedInUser) => {
          setUser(loggedInUser);
          setIsGuestMode(false);
          try {
            confetti({
              particleCount: 60,
              spread: 70,
              origin: { y: 0.6 },
            });
          } catch {}
        }}
        onContinueAsGuest={() => setIsGuestMode(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#07090e] bg-grid-subtle text-slate-300 flex flex-col font-sans antialiased selection:bg-indigo-900/60 selection:text-indigo-200 relative">
      {/* Subtle Background Glow Auras */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Top Navigation & API Key Holder Bar */}
      <Header
        apiKey={apiKey}
        hasServerKey={hasServerKey}
        onOpenKeyModal={() => setIsKeyModalOpen(true)}
        onOpenCalculator={() => handleOpenCalculator("ai_solver")}
        onOpenResistorTool={() => handleOpenCalculator("resistor_color")}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        isChatOpen={isChatOpen}
        onSelectPreset={handleSelectPreset}
        activeModelMode={modelMode}
        onChangeModelMode={(m) => {
          setModelMode(m);
          setThinkingMode(m === "thinking");
          setLowLatencyMode(m === "lite");
          setSearchGrounding(m === "search");
        }}
        user={user}
        isLoadingAuth={isLoadingAuth}
        onOpenCloudProjects={() => setIsCloudProjectsOpen(true)}
        onSaveCurrentToCloud={() => setIsCloudProjectsOpen(true)}
        onOpenLogin={() => setIsGuestMode(false)}
        hasActiveBlueprint={Boolean(blueprint?.bomItems?.length || blueprint?.codeBlock?.code)}
        savedProjectsCount={savedProjects.length}
        subscriptionTier={subscriptionTier}
        onOpenUpgradeModal={() => setIsPlansModalOpen(true)}
      />

      {/* Notification Toast for Subscription Activation */}
      <AnimatePresence>
        {notificationToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-6 z-50 max-w-md bg-[#0e172a] border border-emerald-500/50 text-white p-4 rounded-2xl shadow-2xl shadow-emerald-500/20 flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-emerald-400">Subscription Notice</p>
              <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">{notificationToast}</p>
            </div>
            <button
              onClick={() => setNotificationToast(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container with Sidebar and Content */}
      <div className="flex flex-1 flex-row">
        <Sidebar
          currentProjectTitle={prompt ? (prompt.length > 20 ? prompt.substring(0, 20) + "..." : prompt) : currentProjectTitle}
          targetBoard={targetBoard}
          activeNav={activeNav}
          onSelectNav={(nav) => setActiveNav(nav)}
          onNewProject={() => {
            setIsNewProjectModalOpen(true);
          }}
          onOpenCloudProjects={() => setIsCloudProjectsOpen(true)}
          onOpenDocs={() => {
            setIsDocumentationOpen(true);
          }}
          onOpenSupport={() => setIsChatOpen(true)}
          recentProjects={savedProjects}
          onSelectRecentProject={(project) => {
            handleLoadSavedProject(project);
            setCurrentProjectTitle(project.title);
            setActiveNav("workspace");
          }}
        />

        {/* Main Workspace Layout (Two Column: Left 5/12, Right 7/12) */}
        <main className="max-w-[1300px] w-full mx-auto px-4 sm:px-6 py-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Panel: Input & Configuration */}
          <div className="lg:col-span-5 space-y-4">
            <LeftPanel
              prompt={prompt}
              onChangePrompt={setPrompt}
              targetBoard={targetBoard}
              onChangeTargetBoard={setTargetBoard}
              language={language}
              onChangeLanguage={setLanguage}
              complexity={complexity}
              onChangeComplexity={setComplexity}
              thinkingMode={thinkingMode}
              onToggleThinkingMode={setThinkingMode}
              searchGrounding={searchGrounding}
              onToggleSearchGrounding={setSearchGrounding}
              lowLatencyMode={lowLatencyMode}
              onToggleLowLatencyMode={setLowLatencyMode}
              isGenerating={isGenerating}
              onGenerate={handleGenerate}
              onStop={handleStopGeneration}
              subscriptionTier={subscriptionTier}
              onOpenUpgradeModal={() => setIsPlansModalOpen(true)}
              userId={user?.uid || "guest"}
            />
          </div>

          {/* Right Panel: Live Output Blueprint */}
          <div className="lg:col-span-7 space-y-4">
            <AnimatePresence>
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 bg-rose-950/30 border border-rose-500/40 rounded-2xl text-xs text-rose-200 flex items-start gap-3 shadow-lg"
                >
                  <span className="text-base shrink-0 mt-0.5">⚠️</span>
                  <div className="space-y-1.5 flex-1">
                    <p className="font-display font-bold text-rose-300">Blueprint Generation Notice</p>
                    <p className="text-rose-200/90 leading-relaxed font-sans">{errorMsg}</p>
                    <div className="pt-1 flex flex-wrap items-center gap-3 font-tech">
                      <button
                        onClick={() => handleGenerate()}
                        className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded-lg text-xs font-bold border border-rose-500/30 transition cursor-pointer"
                      >
                        ↻ Retry Blueprint
                      </button>
                      <button
                        onClick={() => {
                          setLowLatencyMode(true);
                          setThinkingMode(false);
                          setModelMode("lite");
                          setErrorMsg(null);
                          void handleGenerate("gemini-3.1-flash-lite");
                        }}
                        className="px-3 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 rounded-lg text-xs font-bold border border-indigo-500/30 transition cursor-pointer"
                      >
                        ⚡ Switch to Fast Flash-Lite Mode
                      </button>
                      <button
                        onClick={() => setIsKeyModalOpen(true)}
                        className="text-xs font-semibold text-slate-300 underline hover:text-white cursor-pointer"
                      >
                        API Key Settings ↗
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <RightPanel
              blueprint={blueprint}
              isGenerating={isGenerating}
              targetBoard={targetBoard}
              onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
              onOpenCalculator={() => setIsCalculatorOpen(true)}
              onOpenChat={() => setIsChatOpen(true)}
              onSaveToCloud={() => setIsCloudProjectsOpen(true)}
              onUpdateBOMItemStatus={handleUpdateBOMItemStatus}
              onUpdateAllBOMItemStatuses={handleUpdateAllBOMItemStatuses}
              selectedTab={activeNav}
              subscriptionTier={subscriptionTier}
              onOpenUpgradeModal={() => setIsPlansModalOpen(true)}
            />
          </div>
        </main>
      </div>

      {/* App Footer */}
      <footer className="border-t border-[#1c2234] bg-[#090c14]/95 py-5 px-4 sm:px-6 text-xs font-tech text-slate-400 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            <div className="flex items-center gap-1.5 font-display font-bold text-slate-200 text-sm">
              <span>Circuito</span>
              <span className="text-orange-500 font-extrabold">AI</span>
            </div>
            <span className="text-slate-600 font-bold hidden sm:inline">•</span>
            <span className="text-slate-400 text-[10.5px] font-tech font-semibold tracking-widest uppercase">DESIGN • GENERATE • INNOVATE</span>
          </div>

          {/* Central Professional Creator Credit */}
          <div className="flex items-center gap-2 bg-[#121626] border border-[#20273a] px-3.5 py-1.5 rounded-full shadow-xs text-[11px]">
            <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.5)]" />
            <span className="text-slate-400">Engineered & Developed by</span>
            <span className="font-display font-bold text-white tracking-wide">Shreyas</span>
            <span className="text-slate-600">•</span>
            <span className="text-orange-300 font-mono font-semibold">Moodlakatte Institute of Technology, Kundapura (MITK)</span>
            <span className="text-slate-500">| © 2026 Circuito AI</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>Embedded Systems & Hardware Workbench</span>
            <span className="text-slate-600">•</span>
            <span className="font-mono text-orange-400">v2.6 LTS</span>
          </div>
        </div>
      </footer>

      {/* Floating Modals and Drawers */}
      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        apiKey={apiKey}
        onSaveKey={handleSaveApiKey}
        hasServerKey={hasServerKey}
      />

      <CloudProjectsModal
        isOpen={isCloudProjectsOpen}
        onClose={() => {
          setIsCloudProjectsOpen(false);
          setActiveNav("workspace");
        }}
        user={user}
        projects={savedProjects}
        isLoadingProjects={isLoadingProjects}
        currentPrompt={prompt}
        currentTargetBoard={targetBoard}
        currentBlueprint={blueprint}
        onLoadProject={handleLoadSavedProject}
        onSaveLocalProject={handleSaveLocalProject}
        onDeleteLocalProject={handleDeleteLocalProject}
        onToggleStarLocal={handleToggleStarLocal}
      />

      <AiHardwareCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        targetBoard={targetBoard}
        currentProjectIdea={prompt}
        onApplyToProject={handleApplyCalculatorSnippet}
        apiKey={apiKey}
        initialTab={calculatorInitialTab}
      />

      <CircuitDiagnosticsModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
        targetBoard={targetBoard}
        currentCode={blueprint.codeBlock.code}
        apiKey={apiKey}
      />

      <HardwareChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        targetBoard={targetBoard}
        currentBlueprint={blueprint.rawMarkdown}
        apiKey={apiKey}
      />

      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreateProject={(title, board, initialIdea) => {
          setCurrentProjectTitle(title);
          setTargetBoard(board);
          setPrompt(initialIdea);
          setStreamedText("");
          setBlueprint(parseBlueprintMarkdown(""));
          setActiveNav("workspace");
        }}
      />

      <DocumentationModal
        isOpen={isDocumentationOpen}
        onClose={() => setIsDocumentationOpen(false)}
      />

      <CircuitLoadingOverlay
        isOpen={isGenerating && showLoadingOverlay}
        onStop={handleStopGeneration}
        targetBoard={targetBoard}
        streamedLength={streamedText.length}
        complexity={complexity}
      />

      <SubscriptionPlansModal
        isOpen={isPlansModalOpen}
        onClose={() => setIsPlansModalOpen(false)}
        currentTier={subscriptionTier}
        onSelectPlan={(plan) => {
          setCheckoutTargetPlan(plan);
          setIsPlansModalOpen(false);
          setIsCheckoutModalOpen(true);
        }}
        isGuest={!user}
        onOpenLogin={() => setIsGuestMode(false)}
      />

      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        targetPlan={checkoutTargetPlan}
        userId={user?.uid || "guest"}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
