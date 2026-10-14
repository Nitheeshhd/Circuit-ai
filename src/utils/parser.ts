import { BOMItem, PinoutRow, SafetyNotice, VivaQuestion, ParsedBlueprint } from "../types";
import { calculateBOMCostSummary, matchMarketItem } from "../data/marketPrices";

export function parseBlueprintMarkdown(markdown: string): ParsedBlueprint {
  const result: ParsedBlueprint = {
    rawMarkdown: markdown,
    executiveSummary: "",
    bomItems: [],
    totalCostINR: 0,
    pinoutRows: [],
    safetyNotices: [],
    codeBlock: {
      language: "cpp",
      code: "",
      libraries: [],
    },
    testingSteps: [],
    vivaQuestions: [],
    detectedBoard: "Microcontroller",
  };

  if (!markdown) return result;

  // 1. Detect target board from text
  if (markdown.includes("ESP32")) result.detectedBoard = "ESP32";
  else if (markdown.includes("Arduino Uno") || markdown.includes("ATmega328P")) result.detectedBoard = "Arduino Uno";
  else if (markdown.includes("Arduino Nano")) result.detectedBoard = "Arduino Nano";
  else if (markdown.includes("NodeMCU") || markdown.includes("ESP8266")) result.detectedBoard = "ESP8266 NodeMCU";
  else if (markdown.includes("STM32") || markdown.includes("Blue Pill")) result.detectedBoard = "STM32 Blue Pill";
  else if (markdown.includes("Raspberry Pi Pico") || markdown.includes("RP2040")) result.detectedBoard = "RP2040 Pico";
  else if (markdown.includes("8051") || markdown.includes("AT89S52")) result.detectedBoard = "8051 (AT89S52)";

  // 2. Extract Executive Summary / Board Assumptions (Section 1)
  const sec1Match =
    markdown.match(/###\s*1\.\s*(?:Board\s*&\s*Assumptions|Executive Summary|Summary)[\s\S]*?(?=###\s*2\.|\n\n###|$)/i) ||
    markdown.match(/###\s*1\.[^\n]*\n([\s\S]*?)(?=###\s*2\.|\n\n###|$)/i);
  if (sec1Match) {
    result.executiveSummary = sec1Match[0].replace(/###\s*1\.\s*[^\n]+\n/, "").trim();
  }

  // 3. Extract BOM items from Markdown tables
  const sec2Match =
    markdown.match(/###\s*2\.\s*(?:Bill of Materials|BOM)[\s\S]*?(?=###\s*3\.|\n\n###|$)/i) ||
    markdown.match(/###\s*.*Bill of Materials[\s\S]*?(?=###|\n\n###|$)/i);
  if (sec2Match) {
    const tableText = sec2Match[0];
    const lines = tableText.split("\n");
    let totalCalculated = 0;
    let explicitTotalFound = 0;

    for (const line of lines) {
      if (
        line.includes("|") &&
        !line.includes("---") &&
        !line.toLowerCase().includes("component") &&
        !line.toLowerCase().includes("specification")
      ) {
        const parts = line.split("|").map((p) => p.trim()).filter((p) => p.length > 0);
        if (parts.length >= 3) {
          const compName = parts[0] || "";
          const spec = parts[1] || "";
          const qty = parts[2] || "1";
          const role = parts.length >= 4 ? parts[3] : "";
          const priceRaw = parts.length >= 5 ? parts[4] : parts[3] || "";
          
          // Extract digits from price string (e.g. ₹95 or 95-120 or Rs. 150)
          const priceMatch = priceRaw.match(/(?:₹|Rs\.?|\b)(\d+(?:,\d+)?)/i) || line.match(/(?:₹|Rs\.?|\b)(\d+(?:,\d+)?)/i);
          let priceVal = 0;
          if (priceMatch) {
            priceVal = parseInt(priceMatch[1].replace(/,/g, ""), 10) || 0;
          }

          if (compName && !compName.toLowerCase().includes("total") && !compName.toLowerCase().includes("approx")) {
            // Clean names
            const cleanComp = compName.replace(/[*_`]/g, "");
            const cleanSpec = spec.replace(/[*_`]/g, "");
            const cleanQty = qty.replace(/[*_`]/g, "");
            const cleanRole = role.replace(/[*_`]/g, "");

            // Quantity parsing
            const qtyNumMatch = cleanQty.match(/\d+/);
            const qtyNum = qtyNumMatch ? parseInt(qtyNumMatch[0], 10) || 1 : 1;

            // Pull simulated market price
            const marketData = matchMarketItem(cleanComp, cleanSpec);
            const unitPrice = priceVal > 0 ? priceVal : (marketData?.averagePrice || 60);
            const lineTotal = unitPrice * qtyNum;

            result.bomItems.push({
              component: cleanComp,
              specification: cleanSpec,
              quantity: cleanQty,
              role: cleanRole,
              approxPriceINR: unitPrice,
              unitPriceINR: unitPrice,
              totalLinePriceINR: lineTotal,
              category: marketData?.category || "Passives & Connectors",
              marketConfidence: marketData ? "High" : "Estimated",
              simulatedVendors: marketData
                ? {
                    robuINR: marketData.robuPrice,
                    electronicsCompINR: marketData.electronicsCompPrice,
                    amazonINR: marketData.amazonPrice,
                  }
                : undefined,
              sourceNote: parts[5] || (marketData ? "Robu / ElectronicsComp" : "Local Retailer"),
            });
            totalCalculated += lineTotal;
          }
        }
      }

      // Check for total line
      const totalMatch = line.match(/(?:Total\s*(?:Estimated)?\s*Project\s*Cost|Total Cost)[^\d]*?(?:₹|Rs\.?|\s)(\d+(?:,\d+)?)/i);
      if (totalMatch) {
        explicitTotalFound = parseInt(totalMatch[1].replace(/,/g, ""), 10);
      }
    }

    result.totalCostINR = explicitTotalFound > 0 ? explicitTotalFound : totalCalculated;
    
    // Compute comprehensive BOM cost summary
    if (result.bomItems.length > 0) {
      result.bomCostSummary = calculateBOMCostSummary(result.bomItems, result.totalCostINR);
      // Ensure totalCostINR is synchronized with calculated estimate
      if (result.bomCostSummary.totalEstimatedINR > 0) {
        result.totalCostINR = result.bomCostSummary.totalEstimatedINR;
      }
    }
  }

  // 4. Extract Pinout Table
  const sec3Match =
    markdown.match(/###\s*3\.\s*(?:Pin-to-Pin|Pin Map|Pinout)[\s\S]*?(?=###\s*4\.|\n\n###|$)/i) ||
    markdown.match(/###\s*.*Pin[\s\S]*?(?=###|\n\n###|$)/i);
  if (sec3Match) {
    const tableText = sec3Match[0];
    const lines = tableText.split("\n");

    for (const line of lines) {
      if (
        line.includes("|") &&
        !line.includes("---") &&
        !line.toLowerCase().includes("peripheral") &&
        !line.toLowerCase().includes("module pin") &&
        !line.toLowerCase().includes("microcontroller pin")
      ) {
        const parts = line.split("|").map((p) => p.trim()).filter((p) => p.length > 0);
        if (parts.length >= 3) {
          const mod = parts[0] || "";
          const modPin = parts[1] || "";
          const mcuPin = parts[2] || "";
          const sigType = parts.length >= 4 ? parts[3] : "Digital GPIO";
          const voltLogic = parts.length >= 5 ? parts[4] : parts[3]?.includes("3.3") ? "3.3V" : "5V";
          const notes = parts.length >= 6 ? parts[5] : parts[4] || "";

          const isStrapping =
            mcuPin.includes("GPIO 0") ||
            mcuPin.includes("GPIO 2") ||
            mcuPin.includes("GPIO 12") ||
            mcuPin.includes("GPIO 15") ||
            mcuPin.includes("D0") ||
            mcuPin.includes("D1");

          const needsShifter =
            notes.toLowerCase().includes("voltage divider") ||
            notes.toLowerCase().includes("level shifter") ||
            (voltLogic.includes("5V") && result.detectedBoard.includes("ESP"));

          if (mod && modPin && mcuPin && !mod.toLowerCase().includes("module")) {
            result.pinoutRows.push({
              module: mod.replace(/[*_`]/g, ""),
              modulePin: modPin.replace(/[*_`]/g, ""),
              mcuPin: mcuPin.replace(/[*_`]/g, ""),
              signalType: sigType.replace(/[*_`]/g, ""),
              voltageLogic: voltLogic.includes("3.3") ? "3.3V" : voltLogic.includes("5") ? "5V" : "Power/GND",
              wiringNotes: notes.replace(/[*_`]/g, ""),
              isStrappingWarning: isStrapping,
              needsLevelShifter: needsShifter,
            });
          }
        }
      }
    }
  }

  // 5. Extract Code Block
  const codeBlockMatch = markdown.match(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/);
  if (codeBlockMatch) {
    result.codeBlock.language = codeBlockMatch[1] || "cpp";
    result.codeBlock.code = codeBlockMatch[2].trim();

    // Extract #include libraries or imports
    const incMatches = result.codeBlock.code.match(/#include\s*[<"]([^>"]+)[>"]/g);
    if (incMatches) {
      result.codeBlock.libraries = incMatches.map((inc) => inc.replace(/#include\s*[<"]/, "").replace(/[>"]/, ""));
    }
  }

  // 6. Extract Safety Notices
  if (markdown.toLowerCase().includes("voltage divider") || markdown.includes("5V to 3.3V") || markdown.includes("3.3V vs 5V")) {
    result.safetyNotices.push({
      type: "voltage_mismatch",
      title: "Logic Level Mismatch (5V Sensor to 3.3V MCU)",
      description: "Sensor outputs 5.0V logic which will permanently degrade or burn 3.3V microcontroller GPIO inputs without voltage attenuation.",
      severity: "warning",
      remedy: "Use a simple two-resistor voltage divider (R1 = 1kΩ, R2 = 2kΩ) to scale 5.0V down to a safe 3.33V.",
    });
  }

  if (markdown.toLowerCase().includes("strapping") || markdown.includes("GPIO 0") || markdown.includes("GPIO 12")) {
    result.safetyNotices.push({
      type: "strapping_pin",
      title: "Strapping Pin Conflict Guardrail",
      description: "ESP32 strapping pins (GPIO 0, 2, 12, 15) control boot state and flash SPI voltage during startup.",
      severity: "danger",
      remedy: "Ensure these pins are not connected to sensors with pull-ups/pull-downs that hold them in bootloader mode.",
    });
  }

  if (markdown.toLowerCase().includes("brownout") || markdown.toLowerCase().includes("relay") || markdown.toLowerCase().includes("servo")) {
    result.safetyNotices.push({
      type: "brownout_power",
      title: "High Current Inductive Kickback & Brownout Protection",
      description: "Servos, DC motors, and mechanical relays draw instantaneous stall currents up to 500mA-1A, causing MCU voltage dips and reset loops.",
      severity: "warning",
      remedy: "Power inductive loads from an independent 5V power supply with a shared common GND and a 1N4007 flyback diode across relay coils.",
    });
  }

  if (markdown.toLowerCase().includes("230v") || markdown.toLowerCase().includes("mains") || markdown.toLowerCase().includes("ac appliance")) {
    result.safetyNotices.push({
      type: "high_voltage_mains",
      title: "AC 230V Mains Isolation Warning",
      description: "High voltage AC switching poses lethal shock hazards. Ensure minimum 3mm isolation slot on PCB/breadboard.",
      severity: "danger",
      remedy: "Always use optocoupler-isolated relay boards and enclose mains terminals in an insulated safety enclosure.",
    });
  }

  // 7. Extract Testing Procedure (Section 6)
  const sec6Match = markdown.match(/###\s*6\.\s*(?:Wiring Notes\s*&\s*Bench Testing|Testing Procedure|Bench Testing)[\s\S]*?(?=###\s*7\.|\n\n###|$)/i);
  if (sec6Match) {
    const lines = sec6Match[0].split("\n").filter((l) => l.trim().startsWith("-") || /^\d+\./.test(l.trim()));
    result.testingSteps = lines.map((l) => l.replace(/^[-*\d.]+\s*/, "").replace(/[*_`]/g, "").trim()).filter(Boolean);
  }

  // 8. Extract Troubleshooting (Section 7)
  const sec7TroubleMatch = markdown.match(/###\s*7\.\s*(?:Troubleshooting|Diagnostics)[\s\S]*?(?=###\s*8\.|\n\n###|$)/i);
  if (sec7TroubleMatch) {
    const lines = sec7TroubleMatch[0].split("\n").filter((l) => l.trim().startsWith("-") || /^\d+\./.test(l.trim()) || l.includes("|"));
    result.troubleshootingSteps = lines.map((l) => l.replace(/^[-*\d.]+\s*/, "").replace(/[*_`]/g, "").trim()).filter(Boolean);
  }

  // 9. Extract Viva Voce Questions (Section 8 or Viva heading)
  const secVivaMatch = markdown.match(/###\s*(?:\d+\.\s*)?(?:External Examiner|Viva|Lab & Viva Voce|Technical Defense)[\s\S]*$/i);
  if (secVivaMatch) {
    const vivaText = secVivaMatch[0];
    // More flexible split for questions
    const qMatches = vivaText.split(/(?:\*\*Q\d+:?|\bQ\d+[:.]|\d+\.\s*\*\*Q:?|\d+\.\s*\*\*Question:?|\*\*\d+\.\s*Question:?)/i);
    
    for (let i = 1; i < qMatches.length; i++) {
      const block = qMatches[i];
      // More flexible split for answers
      const ansSplit = block.split(/(?:\*\*A\d*:?|\bA\d*[:.]|\*\*Answer:?|\bAns:?|\*\*Response:?)/i);
      if (ansSplit.length >= 2) {
        const qText = ansSplit[0].replace(/[*_`]/g, "").trim();
        const aText = ansSplit.slice(1).join(" ").replace(/[*_`]/g, "").trim();
        if (qText && aText) {
          result.vivaQuestions.push({
            question: qText,
            answer: aText,
            category: i === 1 ? "Working Principle" : i === 2 ? "Interfacing & Protocols" : i === 3 ? "Power & Logic" : i === 4 ? "Code Logic" : "Troubleshooting",
          });
        }
      }
    }
  }

  return result;
}
