import express, { Request, Response, NextFunction } from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

dotenv.config();

const app = express();
const DEFAULT_PORT = Number(process.env.PORT) || 3000;

// Environment-aware Server APP_URL (server-side only)
export const APP_URL =
  process.env.APP_URL?.trim().replace(/\/+$/, "") ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : `http://localhost:${DEFAULT_PORT}`);

// Disable server signature
app.disable("x-powered-by");

// Secure JSON payload limit to prevent DoS memory exhaustion
app.use(express.json({ limit: "1mb" }));

// Normalize request URLs and handle CORS for Vercel serverless functions and local dev
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-gemini-api-key, x-user-tier, apikey, x-client-info"
  );
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // 1. Normalize request URLs and handle Vercel rewrites & proxy routing
  const rawUrl = req.url || "";
  const [pathname, search] = rawUrl.split("?");
  const searchParams = new URLSearchParams(search || "");
  const routeParam = searchParams.get("__route");

  if (routeParam) {
    searchParams.delete("__route");
    const remainingQuery = searchParams.toString();
    const queryPart = remainingQuery ? `?${remainingQuery}` : "";
    const cleanRoute = routeParam.startsWith("/") ? routeParam : `/${routeParam}`;
    req.url = cleanRoute.startsWith("/api") ? `${cleanRoute}${queryPart}` : `/api${cleanRoute}${queryPart}`;
  } else {
    const candidatePath =
      (req.headers["x-forwarded-uri"] as string) ||
      (req.headers["x-vercel-matched-path"] as string) ||
      (req.headers["x-matched-path"] as string) ||
      req.originalUrl?.split("?")[0] ||
      pathname;

    if (candidatePath && candidatePath !== "/api/index.ts" && candidatePath !== "/api/index") {
      const qPart = search ? `?${search}` : "";
      if (candidatePath.startsWith("/api")) {
        req.url = `${candidatePath}${qPart}`;
      } else if (candidatePath.startsWith("/v1") || candidatePath.startsWith("/health")) {
        req.url = `/api${candidatePath}${qPart}`;
      }
    } else if (req.url && !req.url.startsWith("/api") && (req.url.startsWith("/v1") || req.url.startsWith("/health"))) {
      req.url = `/api${req.url}`;
    }
  }

  next();
});

// ================= 1. COMPREHENSIVE SECURITY HEADERS =================
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: blob: https:; font-src 'self' data: https:; connect-src 'self' https: wss:; frame-src 'self' https:; frame-ancestors 'self' https:;"
  );
  next();
});

// ================= 2. SANITIZED LOGGING (REDACT SECRETS) =================
function sanitizeLogOutput(msg: string): string {
  if (!msg || typeof msg !== "string") return msg;
  return msg
    .replace(/AIzaSy[A-Za-z0-9_-]{33}/g, "AIzaSy[REDACTED_API_KEY]")
    .replace(/(api[_-]?key[:=]\s*["']?)[^"'\s,]+/gi, "$1[REDACTED]")
    .replace(/(bearer\s+)[A-Za-z0-9_.\-]+/gi, "$1[REDACTED_TOKEN]");
}

const safeLog = {
  info: (msg: string, ...args: any[]) => console.log(sanitizeLogOutput(msg), ...args),
  warn: (msg: string, ...args: any[]) => console.warn(sanitizeLogOutput(msg), ...args),
  error: (msg: string, ...args: any[]) => console.error(sanitizeLogOutput(msg), ...args),
};

// ================= 3. IN-MEMORY SLIDING-WINDOW RATE LIMITER & CONCURRENCY GUARD =================
interface RateLimitRecord {
  timestamps: number[];
  activeConnections: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();
const MAX_GLOBAL_CONCURRENT_STREAMS = 20;
let globalActiveStreams = 0;

// Cleanup old rate limit keys periodically
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    record.timestamps = record.timestamps.filter((t) => now - t < 60000);
    if (record.timestamps.length === 0 && record.activeConnections <= 0) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);
if (cleanupInterval.unref) {
  cleanupInterval.unref();
}

function createRateLimiter(maxRequestsPerMinute: number, category = "general") {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown_ip";
    const key = `${category}:${clientIp}`;
    const now = Date.now();

    let record = rateLimitStore.get(key);
    if (!record) {
      record = { timestamps: [], activeConnections: 0 };
      rateLimitStore.set(key, record);
    }

    // Filter timestamps within last 60s
    record.timestamps = record.timestamps.filter((t) => now - t < 60000);

    if (record.timestamps.length >= maxRequestsPerMinute) {
      const oldest = record.timestamps[0];
      const retryAfterSec = Math.max(1, Math.ceil((60000 - (now - oldest)) / 1000));
      res.setHeader("Retry-After", retryAfterSec);
      return res.status(429).json({
        error: `Rate limit reached for ${category}. Please retry in ${retryAfterSec} seconds.`,
      });
    }

    record.timestamps.push(now);
    next();
  };
}

// ================= 4. INPUT VALIDATION & PROMPT INJECTION DEFENSE =================
const DANGEROUS_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+(instructions|prompts|rules)/i,
  /reveal\s+(the\s+)?(system\s+prompt|hidden\s+instructions|api\s+keys)/i,
  /printenv/i,
  /process\.env/i,
  /exec\s*\(/i,
  /\brm\s+-rf\b/i,
  /\bformat\s+c:\b/i,
  /__proto__/i,
  /constructor\.prototype/i,
];

function sanitizeAndValidatePrompt(rawPrompt: any, maxLength = 1000000): { valid: boolean; cleanPrompt: string; error?: string } {
  if (typeof rawPrompt !== "string") {
    return { valid: false, cleanPrompt: "", error: "Prompt must be a text string." };
  }

  const trimmed = rawPrompt.trim();
  if (trimmed.length < 5) {
    return { valid: false, cleanPrompt: "", error: "Prompt must be at least 5 characters long." };
  }

  if (trimmed.length > maxLength) {
    return { valid: false, cleanPrompt: trimmed.substring(0, maxLength), error: `Prompt exceeds maximum length of ${maxLength} characters.` };
  }

  // Check for malicious prompt injection attempts
  for (const pattern of DANGEROUS_INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      safeLog.warn(`Blocked suspicious input pattern matching: ${pattern}`);
      // Strip or reject
      return {
        valid: false,
        cleanPrompt: "",
        error: "Input contains invalid or restricted command patterns.",
      };
    }
  }

  // Strip null bytes and control chars
  const sanitized = trimmed.replace(/\0/g, "").replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  return { valid: true, cleanPrompt: sanitized };
}

// ================= 5. GEMINI ERROR PARSING & SAFE ERROR FORMATTER =================
function parseGeminiError(error: any): { isOverloaded: boolean; message: string; statusCode: number } {
  const errorObj = error?.error || error;
  let rawMsg = errorObj?.message || String(error);
  
  // Stringify the full object to search for error codes/status inside it
  const fullErrorString = JSON.stringify(errorObj);
  
  let isOverloaded = false;
  let statusCode = errorObj?.status || errorObj?.code || 500;

  if (
    rawMsg.includes("503") ||
    rawMsg.includes("UNAVAILABLE") ||
    rawMsg.includes("high demand") ||
    rawMsg.includes("overloaded") ||
    rawMsg.includes("temporarily unavailable") ||
    rawMsg.includes("Service Unavailable") ||
    fullErrorString.includes("503") ||
    fullErrorString.includes("UNAVAILABLE") ||
    statusCode === 503 ||
    statusCode === "503"
  ) {
    isOverloaded = true;
    statusCode = 503;
  } else if (
    rawMsg.includes("429") ||
    rawMsg.includes("RESOURCE_EXHAUSTED") ||
    rawMsg.includes("Quota") ||
    statusCode === 429 ||
    statusCode === "429"
  ) {
    isOverloaded = true;
    statusCode = 429;
  }

  try {
    const jsonMatch = rawMsg.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed?.error?.message) {
        try {
          const innerParsed = JSON.parse(parsed.error.message);
          rawMsg = innerParsed?.error?.message || parsed.error.message;
        } catch {
          rawMsg = parsed.error.message;
        }
      }
    }
  } catch {
    // Keep rawMsg
  }

  let formattedMsg = rawMsg;
  if (isOverloaded) {
    formattedMsg =
      "The AI model is currently experiencing temporary high demand (503 Service Unavailable). Please retry in a few moments or switch to Fast Stream mode.";
  }

  if (
    rawMsg.includes("API Key is missing") ||
    rawMsg.includes("API_KEY_INVALID") ||
    rawMsg.includes("API key not valid") ||
    rawMsg.includes("INVALID_ARGUMENT") ||
    statusCode === 400 ||
    statusCode === 401
  ) {
    statusCode = 400;
  }

  // Sanitize internal server paths from error messages before sending to client
  formattedMsg = formattedMsg
    .replace(/\/[\w.\-]+(?:\/[\w.\-]+)*/g, "[internal_path]")
    .replace(/AIzaSy[A-Za-z0-9_-]{33}/g, "[REDACTED_API_KEY]");

  return {
    isOverloaded,
    message: formattedMsg,
    statusCode: typeof statusCode === "number" ? statusCode : 500,
  };
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function getGenAIClient(customKey?: string): GoogleGenAI {
  const apiKey = customKey?.trim() || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const err: any = new Error("Gemini API Key is missing. Please configure GEMINI_API_KEY in your Vercel Project Settings (Environment Variables) or enter your API key in the UI settings.");
    err.status = 400;
    throw err;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "circuito-ai-production",
      },
    },
  });
}

function getModelFallbackChain(primaryModel?: string, isThinking?: boolean): string[] {
  if (primaryModel === "gemini-3.1-flash-lite") {
    return [primaryModel, "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
  }
  if (isThinking || primaryModel === "gemini-2.5-pro") {
    return ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
  }
  if (primaryModel && ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-pro", "gemini-1.5-flash"].includes(primaryModel)) {
    return [primaryModel, "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
  }
  return ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-pro", "gemini-1.5-flash"];
}

// ================= API ENDPOINTS =================

// 0. API Gateway Root & Status
app.get(["/api", "/api/index.ts"], (_req, res) => {
  res.json({
    status: "ok",
    service: "Circuito AI API Gateway",
    hasServerKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// 1. Health check endpoint (Rate limited: 120 req/min)
app.get(["/api/health", "/api/v1/health"], createRateLimiter(120, "health"), (_req, res) => {
  const time = new Date().toISOString();
  res.json({
    status: "ok",
    time,
    hasServerKey: !!process.env.GEMINI_API_KEY,
    timestamp: time,
  });
});

// 2. Validate API Key endpoint (Rate limited: 30 req/min)
app.post("/api/v1/validate-key", createRateLimiter(30, "key-validation"), async (req, res) => {
  try {
    const key = req.body?.apiKey || req.headers["x-gemini-api-key"] || process.env.GEMINI_API_KEY;
    if (!key || typeof key !== "string" || key.trim().length < 8) {
      return res.status(400).json({ valid: false, message: "Invalid API key format." });
    }

    const ai = new GoogleGenAI({
      apiKey: key.trim(),
      httpOptions: {
        headers: {
          "User-Agent": "circuito-ai-production",
        },
      },
    });

    const candidateModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: model,
          contents: "Ping test. Reply with 'PONG'.",
          config: {
            temperature: 0.1,
          },
        });

        if (response.text) {
          return res.json({ valid: true, message: `API key verified successfully using ${model}.` });
        }
      } catch (err: any) {
        lastError = err;
        safeLog.warn(`Key validation attempt failed on model ${model}:`, err?.message || err);
        const parsed = parseGeminiError(err);
        if (parsed.isOverloaded) {
          await delay(600);
        }
        continue;
      }
    }

    const parsedErr = parseGeminiError(lastError);
    return res.status(parsedErr.statusCode).json({
      valid: false,
      message: parsedErr.message || "Failed to validate API key with Google Gemini.",
    });
  } catch (error: any) {
    safeLog.error("Key validation error:", error);
    const parsed = parseGeminiError(error);
    return res.status(parsed.statusCode).json({
      valid: false,
      message: parsed.message,
    });
  }
});

// System Prompt for Advanced Autonomous Embedded Systems Agent (AutoEmbed, LLM-Embedded, Arduino-LLM-Agent, Arduino-MCP, EmbedEval)
const CIRCUITGEN_SYSTEM_INSTRUCTION = `# ADVANCED AUTONOMOUS EMBEDDED-SYSTEMS ARCHITECT & LLM AGENT
# Incorporating AutoEmbed, LLM-Embedded, Arduino-LLM-Agent, Arduino-MCP, and EmbedEval Frameworks

You are a Principal Embedded-Systems Architect and Multi-Role Autonomous Hardware Agent (incorporating AutoEmbed peripheral dependency mapping, UbiCompLab LLM-Embedded physical verification, Arduino LLM Agent task decomposition, Arduino-MCP tool-use pin constraint enforcement, and EmbedEval safety/evaluation rubrics).

You generate production-grade, 100% compilable, hardware-safe, and robust firmware, schematics, and BOMs for Arduino, ESP32, ESP8266, STM32, RP2040, AVR, and other microcontrollers.

### CORE ARCHITECTURAL DIRECTIVES (EMBEDDED AGENT METHODOLOGIES)
1. **AutoEmbed Library & Peripheral Resolution**: Automatically resolve required library headers, dependencies, and peripheral protocols (I2C, SPI, UART, OneWire, PWM, ADC) with exact constructor parameters and initialization sequences.
2. **LLM-Embedded Physical Execution & State Machines**: Implement fault-tolerant, non-blocking state-machine architectures using millis() instead of blocking delay(). Handle sensor timeouts, CRC errors, NaN checks, and watchdog resets.
3. **Arduino-LLM-Agent Task Decomposition**: Break down complex user specifications into atomic hardware tasks: (a) Power & Ground distribution, (b) Signal level translation (3.3V vs 5V), (c) Sensor/Actuator pin allocation, (d) Firmware telemetry.
4. **Arduino-MCP Pin Constraint Enforcement**: Strictly validate microcontroller-specific hardware limitations:
   - ESP32: Avoid strapping pins (GPIO 0, 2, 12, 15) for open-drain/active-low pull-ups during boot; avoid ADC2 when Wi-Fi/Bluetooth is active; respect input-only GPIOs 34-39.
   - Arduino Uno/Nano: 5V logic levels; Digital pins 0/1 reserved for Serial UART; PWM on pins 3, 5, 6, 9, 10, 11.
   - Raspberry Pi Pico: GP0 to GP28 multiplexing, 3.3V max logic, ADC channels 0-2 (GP26-28).
5. **EmbedEval Multi-Role Safety & Evaluation**: Simulate multi-role peer review (Hardware Architect, Firmware Programmer, Integration Safety Inspector) ensuring current limiting resistors, flyback diodes (1N4007) for inductive loads (relays/motors), common ground busses, and proper logic level shifters (e.g., TXS0108E / BSS138).

---

### REQUIRED OUTPUT FORMAT (Use Exact Markdown Headings):

### 1. Board & Assumptions
- Microcontroller & target architecture
- Core assumptions, framework, power supply requirements, and working logic summary.

### 2. Bill of Materials & Pricing
Comprehensive GFM table of all components with specifications, quantities, roles, and realistic Indian market prices (₹ INR).
| Component | Specification | Qty | Role / Purpose | Approx Price (₹ INR) | Source / Vendor |
|---|---|---|---|---|---|

### 3. Pin-to-Pin Connection Table
Comprehensive GFM table mapping:
| Module / Component | Module Pin | Microcontroller Pin | Signal Type | Voltage Logic | Wiring Notes & Protection |
|---|---|---|---|---|---|

### 4. Hardware Safety & Electrical Protection
- Logic level shifting rules (5V sensors to 3.3V MCUs)
- Inductive kickback protection (flyback diode, separate power rail, common GND)
- Strapping pin and ADC conflict warnings

### 5. Production Firmware Code
Complete, 100% compilable, modular code block (in \`\`\`cpp or \`\`\`python). No placeholders, no pseudocode.

### 6. Wiring Notes & Bench Testing Procedure
- Step-by-step physical bench testing procedure
- Multimeter continuity and voltage checks
- Serial monitor diagnostics at 115200 baud

### 7. Troubleshooting & Failure Recovery
- Diagnostic table and action steps for common failures (sensor not found, I2C bus hang, motor brownouts, unstable readings).

### 8. External Examiner Viva Voce & Technical Defense
5 to 10 probing technical Q&A covering working principles, circuit theory, pinout functions, and safety precautions.
Format:
**Q1: Question text**
**A1: Technical answer**
`;

// 0. Payment Order Creation & Verification Endpoints (Rate limited: 30 req/min)
app.post("/api/v1/payment/create-order", createRateLimiter(30, "payment-order"), (req, res) => {
  const { plan, amount } = req.body;
  if (!plan || !["student", "pro"].includes(plan)) {
    return res.status(400).json({ error: "Invalid subscription plan requested." });
  }
  const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  safeLog.info(`Created payment order ${orderId} for plan ${plan} (₹${amount})`);
  return res.json({
    orderId,
    amount: Number(amount) || (plan === "pro" ? 499 : 199),
    currency: "INR",
    plan,
    createdAt: Date.now(),
  });
});

app.post("/api/v1/payment/verify", createRateLimiter(30, "payment-verify"), (req, res) => {
  const { orderId, paymentId, plan, userId } = req.body;
  if (!plan || !["student", "pro"].includes(plan)) {
    return res.status(400).json({ success: false, message: "Invalid subscription plan." });
  }

  // Idempotency / Server Verification logic
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 Days activation
  safeLog.info(`Verified payment ${paymentId || "mock_pay"} for user ${userId || "guest"} -> ${plan} tier`);

  return res.json({
    success: true,
    message: `Payment verified. ${plan === "student" ? "Student" : "Pro"} subscription active.`,
    plan,
    subscriptionExpiresAt: expiresAt,
    transactionId: paymentId || `txn_${Date.now()}`,
  });
});

// 3. Main Blueprint & Firmware Stream Endpoint (Rate limited: 20 req/min per IP, max 3 concurrent)
app.post("/api/v1/generate-stream", createRateLimiter(20, "stream-gen"), async (req, res) => {
  try {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({
        error: "Request body must be a JSON object.",
        code: "INVALID_REQUEST_BODY",
      });
    }

    const customKeyHeader = req.headers["x-gemini-api-key"];
    const customKey =
      (typeof customKeyHeader === "string" ? customKeyHeader : undefined) ||
      (typeof req.body.custom_api_key === "string" ? req.body.custom_api_key : undefined);
    if (!customKey?.trim() && !process.env.GEMINI_API_KEY?.trim()) {
      return res.status(500).json({
        error: "Server misconfigured: GEMINI_API_KEY missing",
        code: "MISSING_GEMINI_API_KEY",
      });
    }

    const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown_ip";
    const ipKey = `stream-gen:${clientIp}`;
    const ipRecord = rateLimitStore.get(ipKey);

    // Check per-IP and global concurrency limits
    if (ipRecord && ipRecord.activeConnections >= 3) {
      return res.status(429).json({
        error: "Maximum 3 concurrent generation streams per user. Please wait for the current stream to finish.",
        code: "GENERATION_CONCURRENCY_LIMIT",
      });
    }

    if (globalActiveStreams >= MAX_GLOBAL_CONCURRENT_STREAMS) {
      return res.status(503).json({
        error: "Server generation queue is full. Please try again in 15 seconds.",
        code: "GENERATION_QUEUE_FULL",
      });
    }

    const userTier = (req.headers["x-user-tier"] as string) || req.body?.user_tier || "free";
    const {
      prompt,
      preferred_board = "Auto-Select",
      language = "Arduino C++ (.ino)",
      complexity = "Undergraduate Lab / Mini Project",
      thinking_mode = false,
      enable_search = false,
      model_override,
    } = req.body;

    // Backend Entitlement Enforcement: Unlimited Prompt Length
    const promptCheck = sanitizeAndValidatePrompt(prompt, 1000000);
    if (!promptCheck.valid) {
      return res.status(400).json({
        error: promptCheck.error,
        code: "INVALID_PROMPT",
      });
    }

    // Normalize and sanitize metadata inputs
    const safeBoard = String(preferred_board).substring(0, 64).replace(/[<>]/g, "");
    const safeLang = String(language).substring(0, 64).replace(/[<>]/g, "");
    const safeComplexity = String(complexity).substring(0, 64).replace(/[<>]/g, "");

    // Track active connection
    if (ipRecord) ipRecord.activeConnections++;
    globalActiveStreams++;

    let connectionCleanedUp = false;
    const cleanupConnection = () => {
      if (connectionCleanedUp) return;
      connectionCleanedUp = true;
      if (ipRecord) ipRecord.activeConnections = Math.max(0, ipRecord.activeConnections - 1);
      globalActiveStreams = Math.max(0, globalActiveStreams - 1);
    };

    req.on("close", cleanupConnection);
    req.on("end", cleanupConnection);

    // SSE headers for streaming
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    const userPromptText = `
ADVANCED EMBEDDED AGENT GENERATION REQUEST (AutoEmbed + LLM-Embedded + Arduino-LLM-Agent + Arduino-MCP + EmbedEval):
- Raw Project Description: "${promptCheck.cleanPrompt}"
- Preferred Microcontroller / Board: ${safeBoard}
- Firmware Language Target: ${safeLang}
- Project Complexity / Target: ${safeComplexity}

STRICT ARCHITECTURAL & AGENTIC DIRECTIVES:
1. **Peripheral Dependency & Library Resolution (AutoEmbed)**: Automatically determine necessary libraries, pin mappings, and bus protocols without missing headers or fake methods.
2. **Physical Execution & Non-Blocking State Machines (LLM-Embedded)**: Implement reliable state machines using millis(), timeout handling, isnan() sensor checks, and robust error recovery.
3. **Task Decomposition & Pin Allocation (Arduino-LLM-Agent & Arduino-MCP)**: Enforce micro-controller constraints (avoiding ESP32 strapping/ADC2 conflicts, respecting Uno 5V / Pico 3.3V logic boundaries).
4. **Multi-Role Safety & Evaluation (EmbedEval)**: Ensure proper power rails, common GND, flyback protection for inductive loads, and level shifting.
5. **Output Format**: Ensure all 8 sections are fully detailed with pure GFM tables and 100% compilable firmware code.
  `;

    try {
      const ai = getGenAIClient(customKey);
      const candidateModels = getModelFallbackChain(model_override, thinking_mode);

      let streamSuccess = false;
      let chunksEmitted = 0;
      let lastError: any = null;

      for (const modelName of candidateModels) {
        if (streamSuccess) break;

        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const config: any = {
              systemInstruction: CIRCUITGEN_SYSTEM_INSTRUCTION,
              temperature: 0.2,
            };

            if (thinking_mode && modelName === "gemini-2.5-pro") {
              config.thinkingConfig = {
                thinkingLevel: ThinkingLevel.HIGH,
              };
            }

            if (enable_search) {
              config.tools = [{ googleSearch: {} }];
            }

            const stream = await ai.models.generateContentStream({
              model: modelName,
              contents: userPromptText,
              config: config,
            });

            for await (const chunk of stream) {
              const text = chunk.text;
              if (text) {
                res.write(`data: ${JSON.stringify({ text })}\n\n`);
                chunksEmitted++;
              }
            }

            streamSuccess = true;
            break;
          } catch (err: any) {
            lastError = err;
            safeLog.warn(`Streaming attempt ${attempt + 1} failed on model ${modelName}:`, err?.message || err);
            const parsed = parseGeminiError(err);

            if (chunksEmitted > 0) {
              streamSuccess = true;
              break;
            }

            if (parsed.isOverloaded) {
              await delay(400 * (attempt + 1));
              continue;
            }
          }
        }
      }

      if (streamSuccess) {
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
      } else {
        const parsed = parseGeminiError(lastError);
        res.write(
          `data: ${JSON.stringify({
            error: parsed.message,
            code: "GENERATION_FAILED",
          })}\n\n`
        );
        res.end();
      }
    } catch (error: any) {
      safeLog.error("Stream generation outer error:", error);
      const parsed = parseGeminiError(error);
      if (res.headersSent) {
        if (!res.writableEnded) {
          res.write(
            `data: ${JSON.stringify({
              error: parsed.message,
              code: "GENERATION_FAILED",
            })}\n\n`
          );
          res.end();
        }
      } else {
        res.status(parsed.statusCode).json({
          error: parsed.message,
          code: "GENERATION_FAILED",
        });
      }
    } finally {
      cleanupConnection();
    }
  } catch (error: any) {
    safeLog.error("Generation request setup error:", error?.message || error);
    const parsed = parseGeminiError(error);
    const statusCode =
      parsed.statusCode >= 400 && parsed.statusCode < 600 ? parsed.statusCode : 500;
    if (res.headersSent) {
      if (!res.writableEnded) {
        res.write(
          `data: ${JSON.stringify({
            error: parsed.message || "Blueprint generation failed.",
            code: "GENERATION_FAILED",
          })}\n\n`
        );
        res.end();
      }
      return;
    }
    return res.status(statusCode).json({
      error: parsed.message || "Blueprint generation failed.",
      code: "GENERATION_FAILED",
    });
  }
});

// 4. Hardware Chat / Multi-Turn Lab Advisor & Practical Skills Endpoint (Rate limited: 40 req/min)
app.post("/api/v1/hardware-chat", createRateLimiter(40, "chat"), async (req, res) => {
  const customKey = (req.headers["x-gemini-api-key"] as string) || req.body?.custom_api_key;
  const { messages, currentBlueprint, targetBoard, rolePreset, model: requestedModel } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Conversation messages are required." });
  }

  if (messages.length > 40) {
    return res.status(400).json({ error: "Conversation message history exceeds limit of 40 turns." });
  }

  try {
    const ai = getGenAIClient(customKey);

    let roleTitle = "Senior ECE/EEE Practical Lab Advisor";
    let roleSkills = "";

    switch (rolePreset) {
      case "builder":
        roleTitle = "Senior Physical Embedded Systems Builder & Hardware Integrator";
        roleSkills = `
YOUR PRIMARY DIRECTIVE:
You guide engineering students and makers step-by-step through the entire physical construction of their project.
Cover ALL practical physical building skills:
1. Breadboard & Power Rail Topology: Proper component layout, decoupling power busses, avoiding wire spaghetti, keeping high-frequency/analog lines isolated.
2. Component Prep & Soldering: Proper soldering iron temperature (320°C-360°C for lead-free/60-40), flux usage, heat-shrink tubing, preventing cold solder joints, header pin orientation.
3. Common Power & Grounding: Joining all sensor/actuator grounds to MCU GND, calculating current draw, using external power supplies (e.g. 5V 2A adapter or 18650 Li-ion + TP4056 + boost converter) rather than drawing >200mA from MCU onboard 3.3V/5V pins.
4. Step-by-Step Build Order: Step 1 (Power check with DMM) -> Step 2 (Microcontroller bare boot test) -> Step 3 (Connect one sensor at a time & verify on Serial Monitor) -> Step 4 (Add actuators/relays with flyback protection) -> Step 5 (Final enclosure & wire management).
5. Always output clear, numbered action steps, visual ascii/table wiring pinouts, and practical bench tips.`;
        break;

      case "debugger":
        roleTitle = "Hardware Diagnostics, Multimeter & Oscilloscope Specialist";
        roleSkills = `
YOUR PRIMARY DIRECTIVE:
You troubleshoot electrical faults, brownouts, logic mismatches, and noise artifacts.
Cover practical testing skills:
1. Multimeter Probing: Continuity beeper testing before power-up, measuring VCC voltage under active load to detect voltage droop.
2. Oscilloscope / Logic Analyzer: Probing I2C SDA/SCL pull-up rise times (4.7kΩ standard), SPI clock integrity, UART baud synchronization, PWM frequencies.
3. Brownout Detection: Adding 100uF - 470uF electrolytic + 0.1uF ceramic bypass capacitors across VCC/GND rails to absorb Wi-Fi transmission spikes or motor inrush current.
4. Logic Level Shifting: Identifying 5V sensors connected to 3.3V GPIOs and showing resistor voltage divider (1kΩ/2kΩ) or bi-directional BSS138 level shifter wiring.`;
        break;

      case "firmware":
        roleTitle = "Embedded Firmware Architect & Code Optimizer";
        roleSkills = `
YOUR PRIMARY DIRECTIVE:
You write clean, modular, production-ready firmware in Arduino C++ or MicroPython.
Cover practical coding skills:
1. Non-Blocking Execution: Replace delay() with millis() task scheduling, debouncing push buttons without locking MCU execution.
2. Hardware Interrupts: ISR guidelines (keep ISR minimal, use IRAM_ATTR on ESP32, set volatile flags).
3. Watchdog Timer & Brownout Handling: Preventing infinite while-loops during sensor connection failures.
4. Library Configurations: Detail exact library names in Arduino Library Manager / pip and sample initialization syntax.`;
        break;

      case "iot":
        roleTitle = "IoT Cloud, Wireless Protocols & Telemetry Specialist";
        roleSkills = `
YOUR PRIMARY DIRECTIVE:
You connect embedded hardware to modern cloud platforms (Blynk IoT 2.0, MQTT/Mosquitto, ESP-NOW, WebSockets, HTTP/REST telemetry, ThingSpeak).
Cover practical IoT skills:
1. Blynk IoT 2.0: Template ID, Device Name, Auth Token configuration, virtual pin (V0-V255) handlers, timer routines.
2. MQTT Protocols: Broker connection, QoS levels (0, 1), keep-alive pings, reconnect state machines on Wi-Fi dropouts.
3. ESP-NOW: Peer-to-peer fast wireless mesh without Wi-Fi routers (MAC address pairing).
4. Secure Credentials Management: Keeping Wi-Fi SSID/Pass and Auth tokens safely defined.`;
        break;

      case "viva":
        roleTitle = "Strict External Academic Lab Examiner (Viva Voce Evaluator)";
        roleSkills = `
YOUR PRIMARY DIRECTIVE:
You simulate a real-world University External Examiner conducting a project viva voce examination.
Cover practical defense skills:
1. Ask challenging, probing questions on working principles, sensor physics (e.g. Hall effect, Piezo, Photoelectric, Ultrasonic Time-of-Flight), communication protocols (I2C vs SPI vs UART vs CAN), and power dissipation.
2. Review the student's answer, provide a constructive score (out of 10), explain the ideal technical answer, and test on failure recovery scenarios.`;
        break;

      case "viva_generator":
        roleTitle = "Technical Interviewer for Embedded Systems";
        roleSkills = `
YOUR PRIMARY DIRECTIVE:
Generate a list of 5-10 technical interview questions based on the current hardware project.
Questions MUST cover:
1. Circuit Theory related to the project.
2. Pinout functions used.
3. Safety precautions for the components used.
Format the output as a clean list of questions with answers.`;
        break;

      case "power":
        roleTitle = "Power Architecture, Thermal & Battery Sizing Engineer";
        roleSkills = `
YOUR PRIMARY DIRECTIVE:
You design reliable power delivery systems for microcontrollers, sensors, motors, and battery-operated IoT nodes.
Cover practical power skills:
1. Battery Lifetime Calculation: Active current (mA) vs Deep Sleep current (uA), duty cycle calculation, mAh battery life projection.
2. Regulator Topology: Linear LDO (AMS1117, LM7805) power loss vs Buck Step-Down converters (LM2596, MP1584) with >85% efficiency.
3. High Inrush Actuators: Relays, Solenoids, SG90/MG995 servos, DC motors — wiring flyback diodes (1N4007), optocouplers (PC817), and transistor/MOSFET switches.`;
        break;

      case "resistor":
        roleTitle = "Resistor Color Coding, SMD Codes & Component Identification Specialist";
        roleSkills = `
YOUR PRIMARY DIRECTIVE:
You are an expert in passive electronic components, focusing on 4-band, 5-band, and 6-band through-hole resistors, SMD resistor codes, standard E-series (E12, E24, E96, E192), power ratings, and circuit sizing.`;
        break;

      default:
        roleTitle = "Senior ECE/EEE Practical Embedded Systems Mentor";
        roleSkills = `
YOUR PRIMARY DIRECTIVE:
Provide end-to-end practical advice covering hardware schematics, pinout connections, code debugging, and lab safety.`;
        break;
    }

    const safeTargetBoard = String(targetBoard || "Microcontroller").substring(0, 64).replace(/[<>]/g, "");
    const safeBlueprint = typeof currentBlueprint === "string" ? currentBlueprint.substring(0, 3000) : "";

    const chatSystemInstruction = `You are a ${roleTitle}.
Target: ${safeTargetBoard}.
${safeBlueprint ? `Blueprint: ${safeBlueprint}\n` : ""}
${roleSkills}

Rules:
1. Practical lab engineer mindset.
2. Verify: Voltage levels, pin conflicts, GND continuity, power stability.
3. Code: Non-blocking millis(), hardware-safe, complete/compilable.
4. Costs: Realistic INR pricing.`;

    const contents = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: String(m.content || "").substring(0, 4000) }],
    }));

    let candidateModels: string[] = [];
    if (requestedModel === "gemini-2.5-pro") {
      candidateModels = ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
    } else {
      candidateModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-pro", "gemini-1.5-flash"];
    }

    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        const config: any = {
          systemInstruction: chatSystemInstruction,
          temperature: 0.3,
        };

        if (model === "gemini-2.5-pro") {
          config.thinkingConfig = {
            thinkingLevel: ThinkingLevel.HIGH,
          };
        }

        const response = await ai.models.generateContent({
          model: model,
          contents: contents,
          config: config,
        });

        if (response.text) {
          return res.json({
            reply: response.text,
            modelUsed: model,
            roleUsed: rolePreset || "advisor",
          });
        }
      } catch (err: any) {
        lastError = err;
        safeLog.warn(`Hardware chat error on model ${model}:`, err?.message || err);
        const parsed = parseGeminiError(err);
        if (parsed.isOverloaded) {
          await delay(500);
        }
        continue;
      }
    }

    const parsed = parseGeminiError(lastError);
    res.status(parsed.statusCode).json({ error: parsed.message });
  } catch (error: any) {
    safeLog.error("Hardware chat error:", error);
    const parsed = parseGeminiError(error);
    res.status(parsed.statusCode).json({ error: parsed.message });
  }
});

// 5. Code & Hardware Diagnostic Endpoint (Rate limited: 40 req/min)
app.post("/api/v1/diagnose-circuit", createRateLimiter(40, "diagnostics"), async (req, res) => {
  const customKey = (req.headers["x-gemini-api-key"] as string) || req.body?.custom_api_key;

  const { code, board, wiringDescription } = req.body;

  const safeCode = typeof code === "string" ? code.substring(0, 50000) : "";
  const safeBoard = String(board || "Microcontrollers").substring(0, 64).replace(/[<>]/g, "");
  const safeWiring = typeof wiringDescription === "string" ? wiringDescription.substring(0, 5000) : "Standard connections";

  try {
    const ai = getGenAIClient(customKey);

    const diagnosticPrompt = `You are an expert ECE embedded systems automated hardware linter & firmware code validator for target board: ${safeBoard}.

Perform a strict, rigorous physical hardware and firmware evaluation checking:
1. GPIO & Pin Validation:
   - Strapping/boot pin conflicts (ESP32 GPIO 0, 2, 12, 15; ESP8266 GPIO 0, 2, 15).
   - ADC2 conflicts during Wi-Fi on ESP32 (GPIO 0, 2, 4, 12-15, 25-27).
   - Input-only GPIO violations (ESP32 GPIO 34-39 cannot be outputs or use pull-ups).
   - I2C/SPI/UART pin and peripheral conflicts.
2. Voltage & Electrical Safety:
   - 5V sensors feeding 3.3V inputs without voltage dividers or level shifters.
   - Inductive brownouts (servos/motors/relays powered directly from MCU rails without external power + common GND).
   - Missing flyback protection or active-LOW/active-HIGH relay logic confusion.
3. Code Quality & Reliability:
   - Missing pinMode() declarations in setup().
   - Missing Serial.begin() or baud rate mismatches.
   - Long blocking delay() calls causing sluggish response or watchdog timer resets.
   - Unhandled sensor failures (missing isnan() on DHT, missing timeout on pulseIn(), missing ADC bounds clamping).
   - Missing debounce on mechanical switches/buttons.
   - Syntax and compilation errors.

SCORING CRITERIA:
- If code is clean, non-blocking, uses safe GPIOs, includes proper setup() initialization, and handles errors: Award 100/100 score, status: "PASS", issues: [].
- If minor warnings exist (e.g. slight delay or missing comment): score 85-95, status: "WARNING".
- If critical hardware conflicts exist (strapping pin collision, ADC2 WiFi conflict, 5V into 3.3V without divider): score 40-70, status: "CRITICAL".

Wiring Details:
${safeWiring}

Firmware Code:
\`\`\`cpp
${safeCode || "// No code provided"}
\`\`\`

Return a strictly valid JSON object with:
{
  "status": "PASS" | "WARNING" | "CRITICAL",
  "score": number (0-100),
  "issues": [
    {
      "type": "pin_conflict" | "voltage_mismatch" | "brownout" | "code_bug" | "optimization",
      "severity": "low" | "medium" | "high",
      "message": "Clear explanation of the problem and why it matters physically",
      "solution": "Exact physical or code fix"
    }
  ],
  "summary": "Concise engineering verdict and test recommendation"
}`;

    const candidateModels = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash", "gemini-1.5-flash"];
    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: model,
          contents: diagnosticPrompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        const jsonStr = response.text?.trim() || "{}";
        const data = JSON.parse(jsonStr);
        return res.json(data);
      } catch (err: any) {
        lastError = err;
        safeLog.warn(`Circuit diagnostic error on model ${model}:`, err?.message || err);
        const parsed = parseGeminiError(err);
        if (parsed.isOverloaded) {
          await delay(500);
        }
        continue;
      }
    }

    const parsed = parseGeminiError(lastError);
    res.status(parsed.statusCode).json({ error: parsed.message });
  } catch (error: any) {
    safeLog.error("Circuit diagnostic error:", error);
    const parsed = parseGeminiError(error);
    res.status(parsed.statusCode).json({ error: parsed.message });
  }
});

// 6. AI Natural Language Hardware & Circuit Calculator Endpoint (Rate limited: 40 req/min)
app.post("/api/v1/ai-calculate", createRateLimiter(40, "calculator"), async (req, res) => {
  const customKey = (req.headers["x-gemini-api-key"] as string) || req.body?.custom_api_key;
  const { query, contextBoard, projectIdea } = req.body;

  const queryCheck = sanitizeAndValidatePrompt(query, 1000);
  if (!queryCheck.valid) {
    return res.status(400).json({ error: queryCheck.error });
  }

  const safeContextBoard = String(contextBoard || "ESP32 / Arduino / Microcontrollers").substring(0, 64).replace(/[<>]/g, "");
  const safeProjectIdea = typeof projectIdea === "string" ? projectIdea.substring(0, 1000) : "";

  try {
    const ai = getGenAIClient(customKey);

    const calcSystemInstruction = `You are a Precise Electrical Engineering & Embedded Hardware Calculator for project builders and IoT developers.
Context Board: ${safeContextBoard}.
${safeProjectIdea ? `Current Project Goal: ${safeProjectIdea}` : ""}

Analyze the user's electronic calculation question (such as Ohm's law, voltage drop, LED resistors, current draw, power dissipation, shunt resistors, battery life, pull-up resistors, RC filter time constants, or PWM duty cycle).

Perform exact, verified engineering mathematical calculations.
Respond ONLY with a strictly valid JSON object following this exact schema:
{
  "title": "Clear concise title of the calculation (e.g. 'LED Series Current-Limiting Resistor')",
  "primaryFormula": "The core mathematical formula used (e.g. 'R = (Vsupply - Vf) / If, P = I² * R')",
  "inputs": [
    { "name": "Supply Voltage (Vcc)", "value": "5.0", "unit": "V" },
    { "name": "Forward Voltage (Vf)", "value": "2.2", "unit": "V" }
  ],
  "calculatedResults": [
    { "label": "Exact Calculated Resistance", "value": "140", "unit": "Ω", "isPrimary": true },
    { "label": "Power Dissipated in Resistor", "value": "44", "unit": "mW", "isPrimary": false },
    { "label": "Total Current Draw", "value": "20", "unit": "mA", "isPrimary": false }
  ],
  "stepByStep": [
    "1. Calculate voltage drop across resistor: Vr = Vsupply - Vf = 5.0V - 2.2V = 2.8V",
    "2. Apply Ohm's Law: R = Vr / If = 2.8V / 0.020A = 140 Ω",
    "3. Compute power rating: P = (0.020A)² * 140Ω = 0.044W (44 mW)"
  ],
  "standardComponents": [
    { "type": "Resistor", "recommendedValue": "150 Ω (or 160 Ω)", "series": "Standard E24", "wattageRating": "1/4 Watt (250mW)" }
  ],
  "safetyNotes": "Clear safety guideline or warning regarding voltage limits, wattage overhead, or thermal dissipation.",
  "engineeringTip": "Practical lab tip (e.g. 'Use 1% metal film resistors for precision ADC sensors, or add decoupling capacitor 100nF close to power pins').",
  "promptSnippet": "A short, concise phrase summarizing this component requirement for the project"
}`;

    const candidateModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: model,
          contents: `Please perform this hardware circuit calculation: "${queryCheck.cleanPrompt}"`,
          config: {
            systemInstruction: calcSystemInstruction,
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        });

        const jsonStr = response.text?.trim() || "{}";
        const data = JSON.parse(jsonStr);
        return res.json(data);
      } catch (err: any) {
        lastError = err;
        safeLog.warn(`AI calculator error on model ${model}:`, err?.message || err);
        const parsed = parseGeminiError(err);
        if (parsed.isOverloaded) {
          await delay(500);
        }
        continue;
      }
    }

    const parsed = parseGeminiError(lastError);
    res.status(parsed.statusCode).json({ error: parsed.message });
  } catch (error: any) {
    safeLog.error("AI calculator error:", error);
    const parsed = parseGeminiError(error);
    res.status(parsed.statusCode).json({ error: parsed.message });
  }
});

// Fallback 404 handler for unmatched API endpoints
app.use("/api/*", (_req: Request, res: Response) => {
  res.status(404).json({ error: "API endpoint not found." });
});

// Global Express Error Handler for unhandled middleware/route exceptions
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  safeLog.error("Global Express Error Handler caught an exception:", err);
  if (!res.headersSent) {
    const statusCode = Number(err?.status || err?.statusCode) || 500;
    const isMalformedJson = err?.type === "entity.parse.failed";
    const message = isMalformedJson
      ? "Request body must be valid JSON."
      : statusCode < 500 && typeof err?.message === "string"
      ? err.message
      : "Internal server error.";
    const code = isMalformedJson
      ? "INVALID_JSON"
      : statusCode === 413
      ? "PAYLOAD_TOO_LARGE"
      : statusCode < 500
      ? "REQUEST_FAILED"
      : "INTERNAL_SERVER_ERROR";
    res.status(statusCode).json({ error: message, code });
  }
});

// Vite middleware for frontend development / static dist in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vitePkg = "vite";
    const { createServer: createViteServer } = await import(/* @vite-ignore */ vitePkg);
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const tryListen = (portToTry: number) => {
    const server = app.listen(portToTry, "0.0.0.0");

    server.on("listening", () => {
      console.log(`\n  \x1b[36m⚡ Circuito AI Development Server Running\x1b[0m\n`);
      console.log(`  \x1b[32m➜\x1b[0m  \x1b[1mLocal:\x1b[0m   \x1b[36mhttp://localhost:${portToTry}/\x1b[0m`);
      console.log(`  \x1b[32m➜\x1b[0m  \x1b[1mNetwork:\x1b[0m \x1b[36mhttp://127.0.0.1:${portToTry}/\x1b[0m`);
      console.log(`  \x1b[32m➜\x1b[0m  \x1b[1mHealth:\x1b[0m  \x1b[36mhttp://localhost:${portToTry}/api/health\x1b[0m\n`);
    });

    server.on("error", (err: any) => {
      if (err.code === "EADDRINUSE") {
        console.warn(`\x1b[33m⚠️ Port ${portToTry} is in use, trying port ${portToTry + 1}...\x1b[0m`);
        tryListen(portToTry + 1);
      } else {
        console.error("Server error:", err);
      }
    });
  };

  tryListen(DEFAULT_PORT);
}

export { app };
export default app;

if (!process.env.VERCEL) {
  startServer();
}
