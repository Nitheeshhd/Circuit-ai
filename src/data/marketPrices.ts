export interface MarketItemData {
  keywords: string[];
  name: string;
  category: "MCU / Board" | "Sensors" | "Actuators & Relays" | "Displays" | "Power & Battery" | "Passives & Connectors" | "Wireless & Modules";
  robuPrice: number;
  electronicsCompPrice: number;
  amazonPrice: number;
  averagePrice: number;
  unit: string;
  stockAvailability: "High" | "Medium" | "Available";
  standardSpecs: string;
}

export const SIMULATED_MARKET_DATABASE: MarketItemData[] = [
  // MCUs & Boards
  {
    keywords: ["esp32", "wroom", "devkit", "esp-32", "esp32-s3", "esp32-c3"],
    name: "ESP32 DevKit V1 (30/38 Pin)",
    category: "MCU / Board",
    robuPrice: 265,
    electronicsCompPrice: 250,
    amazonPrice: 375,
    averagePrice: 295,
    unit: "pcs",
    stockAvailability: "High",
    standardSpecs: "Xtensa Dual-Core 240MHz, Wi-Fi+BLE, 3.3V Logic",
  },
  {
    keywords: ["arduino uno", "atmega328p", "uno r3", "uno"],
    name: "Arduino Uno R3 Compatible Board",
    category: "MCU / Board",
    robuPrice: 235,
    electronicsCompPrice: 220,
    amazonPrice: 349,
    averagePrice: 265,
    unit: "pcs",
    stockAvailability: "High",
    standardSpecs: "ATmega328P DIP/SMD, 16MHz, 5V Logic, USB Type-B/CH340",
  },
  {
    keywords: ["arduino nano", "nano v3", "nano"],
    name: "Arduino Nano V3 (CH340)",
    category: "MCU / Board",
    robuPrice: 135,
    electronicsCompPrice: 125,
    amazonPrice: 220,
    averagePrice: 160,
    unit: "pcs",
    stockAvailability: "High",
    standardSpecs: "ATmega328P, Mini-USB/Type-C, 5V Logic",
  },
  {
    keywords: ["nodemcu", "esp8266", "esp12e", "esp-12e", "wemos"],
    name: "NodeMCU ESP8266 V3 / V2",
    category: "MCU / Board",
    robuPrice: 145,
    electronicsCompPrice: 135,
    amazonPrice: 240,
    averagePrice: 175,
    unit: "pcs",
    stockAvailability: "High",
    standardSpecs: "Tensilica 32-bit 80MHz, Wi-Fi 802.11 b/g/n, 3.3V",
  },
  {
    keywords: ["stm32", "blue pill", "stm32f103c8t6"],
    name: "STM32F103C8T6 Blue Pill Board",
    category: "MCU / Board",
    robuPrice: 165,
    electronicsCompPrice: 155,
    amazonPrice: 260,
    averagePrice: 195,
    unit: "pcs",
    stockAvailability: "Medium",
    standardSpecs: "ARM Cortex-M3 72MHz, 64KB Flash, 20KB SRAM",
  },
  {
    keywords: ["raspberry pi pico", "rp2040", "pico w", "pico"],
    name: "Raspberry Pi Pico (RP2040)",
    category: "MCU / Board",
    robuPrice: 295,
    electronicsCompPrice: 280,
    amazonPrice: 390,
    averagePrice: 320,
    unit: "pcs",
    stockAvailability: "High",
    standardSpecs: "Dual-Core ARM Cortex-M0+ 133MHz, 2MB Flash",
  },
  {
    keywords: ["8051", "at89s52", "at89c51", "stc89c52"],
    name: "AT89S52 8051 Microcontroller IC / Dev Board",
    category: "MCU / Board",
    robuPrice: 75,
    electronicsCompPrice: 68,
    amazonPrice: 160,
    averagePrice: 100,
    unit: "pcs",
    stockAvailability: "Medium",
    standardSpecs: "8-bit CISC MCS-51, 8KB ISP Flash, 40-Pin DIP",
  },
  {
    keywords: ["arduino mega", "mega 2560", "atmega2560"],
    name: "Arduino Mega 2560 R3 Board",
    category: "MCU / Board",
    robuPrice: 580,
    electronicsCompPrice: 550,
    amazonPrice: 799,
    averagePrice: 640,
    unit: "pcs",
    stockAvailability: "High",
    standardSpecs: "ATmega2560 16MHz, 54 Digital I/O, 16 Analog Inputs",
  },

  // Sensors
  {
    keywords: ["hc-sr04", "ultrasonic", "sonar", "distance sensor"],
    name: "HC-SR04 Ultrasonic Distance Sensor",
    category: "Sensors",
    robuPrice: 55,
    electronicsCompPrice: 48,
    amazonPrice: 110,
    averagePrice: 65,
    unit: "pcs",
    stockAvailability: "High",
    standardSpecs: "2cm - 400cm, 5V, 15mA, 40kHz Transducer",
  },
  {
    keywords: ["dht22", "am2302", "dht-22"],
    name: "DHT22 / AM2302 Digital Temp & Humidity",
    category: "Sensors",
    robuPrice: 185,
    electronicsCompPrice: 172,
    amazonPrice: 275,
    averagePrice: 210,
    unit: "pcs",
    stockAvailability: "High",
    standardSpecs: "-40 to 80°C (±0.5°C), 0-100% RH (±2%), 3.3V-5V",
  },
  {
    keywords: ["dht11", "dht-11"],
    name: "DHT11 Digital Temp & Humidity Sensor",
    category: "Sensors",
    robuPrice: 52,
    electronicsCompPrice: 45,
    amazonPrice: 99,
    averagePrice: 62,
    unit: "pcs",
    stockAvailability: "High",
    standardSpecs: "0 to 50°C (±2°C), 20-90% RH (±5%), 3.3V-5V",
  },
  {
    keywords: ["capacitive soil", "soil moisture", "capacitive moisture"],
    name: "Capacitive Soil Moisture Sensor v1.2",
    category: "Sensors",
    robuPrice: 55,
    electronicsCompPrice: 48,
    amazonPrice: 115,
    averagePrice: 68,
    unit: "pcs",
    stockAvailability: "High",
    standardSpecs: "Corrosion-resistant analog output, 3.3V - 5.5V",
  },
  {
    keywords: ["mq-2", "mq2", "smoke sensor", "lpg sensor"],
    name: "MQ-2 Gas / Smoke / LPG Sensor Module",
    category: "Sensors",
    robuPrice: 75,
    electronicsCompPrice: 68,
    amazonPrice: 140,
    averagePrice: 88,
    unit: "pcs",
    stockAvailability: "High",
    standardSpecs: "300 - 10000 ppm Combustible Gas/Smoke, 5V Heater",
  },
  {
    keywords: ["mq-135", "mq135", "air quality sensor"],
    name: "MQ-135 Hazardous Air Quality Sensor",
    category: "Sensors",
    robuPrice: 85,
    electronicsCompPrice: 78,
    amazonPrice: 150,
    averagePrice: 98,
    unit: "pcs",
    stockAvailability: "High",
    standardSpecs: "NH3, NOx, Alcohol, Benzene, Smoke, CO2 Detection",
  },
  {
    keywords: ["pir", "hc-sr501", "motion sensor", "human presence"],
    name: "HC-SR501 PIR Motion Sensor Module",
    category: "Sensors",
    robuPrice: 55,
    electronicsCompPrice: 48,
    amazonPrice: 110,
    averagePrice: 65,
    unit: "pcs",
    stockAvailability: "High",
    standardSpecs: "Pyroelectric infrared detection up to 7m, 120° angle",
  },
  {
    keywords: ["mpu-6050", "mpu6050", "gyro", "accelerometer", "imu"],
    name: "MPU-6050 6-DOF Gyro & Accelerometer (I2C)",
    category: "Sensors",
    robuPrice: 95,
    electronicsCompPrice: 88,
    amazonPrice: 160,
    averagePrice: 110,
    unit: "pcs",
    stockAvailability: "High",
    standardSpecs: "3-axis gyro + 3-axis accel, 16-bit ADC, I2C 0x68",
  },
  {
    keywords: ["max30102", "max30100", "pulse oximeter", "heart rate", "spo2"],
    name: "MAX30102 Heart Rate & SpO2 Sensor Module",
    category: "Sensors",
    robuPrice: 160,
    electronicsCompPrice: 150,
    amazonPrice: 260,
    averagePrice: 185,
    unit: "pcs",
    stockAvailability: "Medium",
    standardSpecs: "Optical PPG biometric sensor, Red & IR LED, I2C",
  },
  {
    keywords: ["bmp280", "bme280", "barometer", "pressure sensor"],
    name: "BMP280 / BME280 Atmospheric Pressure Sensor",
    category: "Sensors",
    robuPrice: 85,
    electronicsCompPrice: 78,
    amazonPrice: 150,
    averagePrice: 98,
    unit: "pcs",
    stockAvailability: "High",
    standardSpecs: "300 to 1100 hPa Barometric Pressure, I2C/SPI 3.3V",
  },
  {
    keywords: ["ldr", "light sensor", "photoresistor"],
    name: "LDR Photoresistor Sensor Module (with LM393)",
    category: "Sensors",
    robuPrice: 25,
    electronicsCompPrice: 22,
    amazonPrice: 65,
    averagePrice: 32,
    unit: "pcs",
    stockAvailability: "High",
    standardSpecs: "Analog & Digital output, Sensitivity potentiometer",
  },
  {
    keywords: ["ds18b20", "waterproof temp", "thermal probe"],
    name: "DS18B20 Waterproof Temperature Sensor Probe",
    category: "Sensors",
    robuPrice: 85,
    electronicsCompPrice: 78,
    amazonPrice: 150,
    averagePrice: 98,
    unit: "pcs",
    stockAvailability: "High",
    standardSpecs: "1-Wire Digital Interface, -55°C to +125°C probe",
  },

  // Actuators & Relays
  {
    keywords: ["sg90", "servo", "micro servo", "towerpro"],
    name: "TowerPro SG90 9g Micro Servo Motor",
    category: "Actuators & Relays",
    robuPrice: 48,
    electronicsCompPrice: 44,
    amazonPrice: 95,
    averagePrice: 58,
    unit: "pcs",
    stockAvailability: "High",
    standardSpecs: "1.8 kg-cm stall torque, 0.1s/60°, 4.8V-6V PWM",
  },
  {
    keywords: ["mg995", "mg996r", "metal gear servo"],
    name: "MG995 / MG996R High-Torque Metal Gear Servo",
    category: "Actuators & Relays",
    robuPrice: 195,
    electronicsCompPrice: 185,
    amazonPrice: 290,
    averagePrice: 220,
    unit: "pcs",
    stockAvailability: "High",
    standardSpecs: "10-12 kg-cm metal gears, 4.8V-7.2V PWM",
  },
  {
    keywords: ["relay", "5v relay", "1 channel relay", "relay module"],
    name: "1-Channel 5V Relay Module (Optocoupler Isolated)",
    category: "Actuators & Relays",
    robuPrice: 32,
    electronicsCompPrice: 28,
    amazonPrice: 75,
    averagePrice: 38,
    unit: "pcs",
    stockAvailability: "High",
    standardSpecs: "10A 250VAC / 30VDC, Active-LOW trigger, Opto-isolated",
  },
  {
    keywords: ["4 channel relay", "4-channel relay", "4 relay"],
    name: "4-Channel 5V Relay Module Board",
    category: "Actuators & Relays",
    robuPrice: 115,
    electronicsCompPrice: 105,
    amazonPrice: 199,
    averagePrice: 130,
    unit: "pcs",
    stockAvailability: "High",
    standardSpecs: "4x 10A 250VAC isolated channels, status LEDs",
  },
  {
    keywords: ["l298n", "motor driver", "h-bridge", "dual motor driver"],
    name: "L298N Dual H-Bridge DC Motor Driver Module",
    category: "Actuators & Relays",
    robuPrice: 95,
    electronicsCompPrice: 88,
    amazonPrice: 175,
    averagePrice: 110,
    unit: "pcs",
    stockAvailability: "High",
    standardSpecs: "Dual 2A channels, 5V-35V input, heatsink included",
  },
  {
    keywords: ["water pump", "mini pump", "submersible pump"],
    name: "Mini 5V/6V Submersible DC Water Pump",
    category: "Actuators & Relays",
    robuPrice: 65,
    electronicsCompPrice: 58,
    amazonPrice: 125,
    averagePrice: 78,
    unit: "pcs",
    stockAvailability: "High",
    standardSpecs: "80-120 L/H flow rate, 3V-6V DC, 150mA",
  },
  {
    keywords: ["buzzer", "active buzzer", "piezo buzzer"],
    name: "5V Active Buzzer Alarm Module",
    category: "Actuators & Relays",
    robuPrice: 14,
    electronicsCompPrice: 12,
    amazonPrice: 45,
    averagePrice: 18,
    unit: "pcs",
    stockAvailability: "High",
    standardSpecs: "2.3kHz continuous acoustic tone, 5V DC 30mA",
  },
  {
    keywords: ["bo motor", "dc motor", "gear motor", "wheel"],
    name: "BO Dual-Shaft Gear Motor (100-300 RPM) + Wheel",
    category: "Actuators & Relays",
    robuPrice: 32,
    electronicsCompPrice: 28,
    amazonPrice: 70,
    averagePrice: 38,
    unit: "pcs",
    stockAvailability: "High",
    standardSpecs: "3V-6V DC 150mA, Rubber traction tire included",
  },
  {
    keywords: ["solenoid", "door lock", "12v lock"],
    name: "12V Electric Solenoid Door Lock Strike",
    category: "Actuators & Relays",
    robuPrice: 175,
    electronicsCompPrice: 165,
    amazonPrice: 290,
    averagePrice: 200,
    unit: "pcs",
    stockAvailability: "Medium",
    standardSpecs: "12V DC 0.6A pulse trigger, spring latch mechanism",
  },

  // Displays
  {
    keywords: ["oled", "ssd1306", "0.96", "0.96 inch"],
    name: "0.96-inch I2C OLED Display (128x64 SSD1306)",
    category: "Displays",
    robuPrice: 125,
    electronicsCompPrice: 115,
    amazonPrice: 199,
    averagePrice: 140,
    unit: "pcs",
    stockAvailability: "High",
    standardSpecs: "128x64 Monochrome Blue/White, I2C 0x3C, 3.3V-5V",
  },
  {
    keywords: ["16x2 lcd", "i2c lcd", "lcd display", "hd44780", "1602"],
    name: "16x2 Character LCD with I2C Backpack (PCF8574)",
    category: "Displays",
    robuPrice: 135,
    electronicsCompPrice: 125,
    amazonPrice: 220,
    averagePrice: 150,
    unit: "pcs",
    stockAvailability: "High",
    standardSpecs: "16 characters x 2 lines, Blue/Yellow backlight, I2C 0x27",
  },
  {
    keywords: ["7-segment", "tm1637", "4-digit display"],
    name: "TM1637 4-Digit 7-Segment LED Display Module",
    category: "Displays",
    robuPrice: 55,
    electronicsCompPrice: 48,
    amazonPrice: 110,
    averagePrice: 68,
    unit: "pcs",
    stockAvailability: "High",
    standardSpecs: "0.36-inch Red LED, 2-wire serial clock/data interface",
  },
  {
    keywords: ["ws2812b", "neopixel", "rgb ring", "addressable led"],
    name: "WS2812B NeoPixel 8/12/16 RGB LED Ring",
    category: "Displays",
    robuPrice: 115,
    electronicsCompPrice: 105,
    amazonPrice: 190,
    averagePrice: 130,
    unit: "pcs",
    stockAvailability: "High",
    standardSpecs: "Individually addressable 24-bit RGB 5050 SMD LEDs, 5V",
  },

  // Power & Battery
  {
    keywords: ["tp4056", "battery charger", "lipo charger"],
    name: "TP4056 1A Li-Ion Battery Charger with Protection",
    category: "Power & Battery",
    robuPrice: 22,
    electronicsCompPrice: 18,
    amazonPrice: 65,
    averagePrice: 28,
    unit: "pcs",
    stockAvailability: "High",
    standardSpecs: "Type-C / Micro-USB input, 4.2V CC/CV charging, DW01 chip",
  },
  {
    keywords: ["lm2596", "buck converter", "step down"],
    name: "LM2596 DC-DC Buck Step-Down Voltage Regulator",
    category: "Power & Battery",
    robuPrice: 55,
    electronicsCompPrice: 48,
    amazonPrice: 110,
    averagePrice: 68,
    unit: "pcs",
    stockAvailability: "High",
    standardSpecs: "4.5V-40V in, 1.25V-35V out, 2A-3A max output",
  },
  {
    keywords: ["18650", "li-ion battery", "battery pack"],
    name: "18650 3.7V 2000-2600mAh Li-Ion Rechargeable Cell",
    category: "Power & Battery",
    robuPrice: 75,
    electronicsCompPrice: 68,
    amazonPrice: 160,
    averagePrice: 95,
    unit: "pcs",
    stockAvailability: "High",
    standardSpecs: "Grade A rechargeable cylindrical cell, 3.7V nominal",
  },
  {
    keywords: ["9v battery", "power adapter", "12v adapter", "power supply"],
    name: "9V / 12V 1A DC Power Supply Adapter with Barrel Jack",
    category: "Power & Battery",
    robuPrice: 95,
    electronicsCompPrice: 85,
    amazonPrice: 180,
    averagePrice: 115,
    unit: "pcs",
    stockAvailability: "High",
    standardSpecs: "AC 100-240V to DC 9V/12V 1A, 5.5x2.1mm center-positive",
  },

  // Wireless & Modules
  {
    keywords: ["rc522", "rfid", "mfrc522", "rfid reader", "rfid card"],
    name: "RC522 13.56MHz RFID Reader + Key Fob + Card",
    category: "Wireless & Modules",
    robuPrice: 115,
    electronicsCompPrice: 105,
    amazonPrice: 195,
    averagePrice: 130,
    unit: "pcs",
    stockAvailability: "High",
    standardSpecs: "SPI interface, ISO14443A standard, 3.3V power",
  },
  {
    keywords: ["hc-05", "hc05", "bluetooth module"],
    name: "HC-05 Wireless Bluetooth UART Serial Module",
    category: "Wireless & Modules",
    robuPrice: 195,
    electronicsCompPrice: 180,
    amazonPrice: 290,
    averagePrice: 220,
    unit: "pcs",
    stockAvailability: "High",
    standardSpecs: "Master/Slave Bluetooth SPP v2.0+EDR, 9600-38400 baud",
  },
  {
    keywords: ["nrf24l01", "nrf24", "rf transceiver"],
    name: "nRF24L01+ 2.4GHz RF Wireless Transceiver Module",
    category: "Wireless & Modules",
    robuPrice: 65,
    electronicsCompPrice: 58,
    amazonPrice: 125,
    averagePrice: 78,
    unit: "pcs",
    stockAvailability: "High",
    standardSpecs: "2Mbps speed, 100m range (SMA antenna optional), 3.3V",
  },
  {
    keywords: ["lora", "sx1278", "ra-02", "433mhz"],
    name: "SX1278 Ra-02 433MHz Long Range LoRa Module",
    category: "Wireless & Modules",
    robuPrice: 240,
    electronicsCompPrice: 225,
    amazonPrice: 380,
    averagePrice: 275,
    unit: "pcs",
    stockAvailability: "Medium",
    standardSpecs: "Spread spectrum SPI module, up to 5-10km range, 3.3V",
  },
  {
    keywords: ["keypad", "4x4 keypad", "matrix keypad"],
    name: "4x4 Matrix Membrane Keypad (16-Button)",
    category: "Wireless & Modules",
    robuPrice: 38,
    electronicsCompPrice: 32,
    amazonPrice: 85,
    averagePrice: 48,
    unit: "pcs",
    stockAvailability: "High",
    standardSpecs: "8-pin pitch connector, adhesive back, tactile switches",
  },

  // Passives & Connectors
  {
    keywords: ["jumper wires", "dupont cables", "breadboard wires"],
    name: "40-Pin Male-to-Female / Male-to-Male Jumper Wires",
    category: "Passives & Connectors",
    robuPrice: 38,
    electronicsCompPrice: 32,
    amazonPrice: 85,
    averagePrice: 45,
    unit: "set",
    stockAvailability: "High",
    standardSpecs: "20cm length, multi-color ribbon with 2.54mm headers",
  },
  {
    keywords: ["breadboard", "solderless breadboard", "830 tie"],
    name: "MB-102 830-Point Solderless Breadboard",
    category: "Passives & Connectors",
    robuPrice: 58,
    electronicsCompPrice: 50,
    amazonPrice: 120,
    averagePrice: 70,
    unit: "pcs",
    stockAvailability: "High",
    standardSpecs: "Dual power rails, interlocking clips, 0.3-0.8mm wire",
  },
  {
    keywords: ["resistor", "resistors", "resistor pack", "1k", "2k", "10k", "220"],
    name: "Quarter-Watt Carbon Film Resistor Assortment",
    category: "Passives & Connectors",
    robuPrice: 15,
    electronicsCompPrice: 10,
    amazonPrice: 50,
    averagePrice: 20,
    unit: "pack",
    stockAvailability: "High",
    standardSpecs: "1/4W 5% tolerance (220Ω, 1kΩ, 2kΩ, 4.7kΩ, 10kΩ)",
  },
  {
    keywords: ["led", "leds", "indicator led"],
    name: "5mm Diffused LED Assortment (Red/Green/Yellow/Blue)",
    category: "Passives & Connectors",
    robuPrice: 10,
    electronicsCompPrice: 8,
    amazonPrice: 40,
    averagePrice: 15,
    unit: "pack",
    stockAvailability: "High",
    standardSpecs: "Standard 20mA forward current, 2.0V - 3.2V drop",
  },
];

/**
 * Fuzzy matches a parsed component name or spec to the simulated market database.
 */
export function matchMarketItem(compName: string, spec: string = ""): MarketItemData | null {
  const query = `${compName} ${spec}`.toLowerCase().replace(/[^a-z0-9\s-]/g, " ");

  // Direct keyword matching with score
  let bestMatch: MarketItemData | null = null;
  let highestScore = 0;

  for (const item of SIMULATED_MARKET_DATABASE) {
    let score = 0;
    for (const kw of item.keywords) {
      if (query.includes(kw.toLowerCase())) {
        score += kw.length * 2; // longer exact keyword match has higher priority
      }
    }

    // Name substring bonus
    if (query.includes(item.name.toLowerCase())) {
      score += 15;
    }

    if (score > highestScore && score >= 4) {
      highestScore = score;
      bestMatch = item;
    }
  }

  return bestMatch;
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

/**
 * Calculates total estimated cost and pulls simulated market pricing for parsed BOM items.
 */
export function calculateBOMCostSummary(
  items: Array<{
    component: string;
    specification: string;
    quantity: string | number;
    approxPriceINR: number;
  }>,
  explicitParsedTotal: number = 0
): BOMCostSummary {
  let totalEstimated = 0;
  let budgetTotal = 0;
  let fastDeliveryTotal = 0;
  let totalQty = 0;

  const categoryTotals: Record<string, { count: number; totalINR: number }> = {
    "MCU / Board": { count: 0, totalINR: 0 },
    Sensors: { count: 0, totalINR: 0 },
    "Actuators & Relays": { count: 0, totalINR: 0 },
    Displays: { count: 0, totalINR: 0 },
    "Power & Battery": { count: 0, totalINR: 0 },
    "Wireless & Modules": { count: 0, totalINR: 0 },
    "Passives & Connectors": { count: 0, totalINR: 0 },
  };

  items.forEach((item) => {
    // Parse quantity
    const qtyMatch = String(item.quantity).match(/\d+/);
    const qty = qtyMatch ? parseInt(qtyMatch[0], 10) || 1 : 1;
    totalQty += qty;

    // Match with simulated market item
    const market = matchMarketItem(item.component, item.specification);

    const unitPrice =
      item.approxPriceINR > 0
        ? item.approxPriceINR
        : market
          ? market.averagePrice
          : 65;

    const itemTotal = unitPrice * qty;
    totalEstimated += itemTotal;

    const budgetUnitPrice = market ? Math.min(market.robuPrice, market.electronicsCompPrice) : Math.round(unitPrice * 0.9);
    const fastUnitPrice = market ? market.amazonPrice : Math.round(unitPrice * 1.35);

    budgetTotal += budgetUnitPrice * qty;
    fastDeliveryTotal += fastUnitPrice * qty;

    const category = market ? market.category : inferCategory(item.component, item.specification);
    if (!categoryTotals[category]) {
      categoryTotals[category] = { count: 0, totalINR: 0 };
    }
    categoryTotals[category].count += qty;
    categoryTotals[category].totalINR += itemTotal;
  });

  // If explicit total exists in markdown and totalEstimated was 0, use it
  if (totalEstimated === 0 && explicitParsedTotal > 0) {
    totalEstimated = explicitParsedTotal;
    budgetTotal = Math.round(explicitParsedTotal * 0.9);
    fastDeliveryTotal = Math.round(explicitParsedTotal * 1.35);
  }

  // Build category breakdown array
  const categoryColors: Record<string, string> = {
    "MCU / Board": "#6366f1", // Indigo
    Sensors: "#0ea5e9", // Sky
    "Actuators & Relays": "#f59e0b", // Amber
    Displays: "#8b5cf6", // Purple
    "Power & Battery": "#10b981", // Emerald
    "Wireless & Modules": "#ec4899", // Pink
    "Passives & Connectors": "#64748b", // Slate
  };

  const categoryBreakdown = Object.entries(categoryTotals)
    .filter(([_, data]) => data.count > 0)
    .map(([cat, data]) => ({
      category: cat,
      count: data.count,
      totalINR: data.totalINR,
      percentage: totalEstimated > 0 ? Math.round((data.totalINR / totalEstimated) * 100) : 0,
      color: categoryColors[cat] || "#6366f1",
    }))
    .sort((a, b) => b.totalINR - a.totalINR);

  // Generate budget saving tip
  let savingTip = "Order bundled passive kits (jumper wires + breadboard) to reduce per-item shipping charges.";
  let potentialSavings = 80;

  if (items.some((i) => i.component.toLowerCase().includes("mega"))) {
    savingTip = "Switch from Arduino Mega to Arduino Uno/Nano if 14 GPIOs are sufficient to save ~₹500.";
    potentialSavings = 500;
  } else if (items.some((i) => i.component.toLowerCase().includes("dht22"))) {
    savingTip = "For standard classroom lab testing, DHT11 works identically to DHT22 and saves ~₹180.";
    potentialSavings = 180;
  } else if (totalEstimated > 1200) {
    savingTip = "Sourcing combined parts from Robu.in or ElectronicsComp gives bulk discounts compared to single retail Amazon orders.";
    potentialSavings = Math.round(totalEstimated * 0.18);
  }

  return {
    totalEstimatedINR: totalEstimated || explicitParsedTotal || 450,
    totalParsedINR: explicitParsedTotal || totalEstimated,
    budgetStoreTotalINR: budgetTotal || Math.round(totalEstimated * 0.88),
    fastDeliveryTotalINR: fastDeliveryTotal || Math.round(totalEstimated * 1.32),
    totalItemCount: items.length,
    totalQuantity: totalQty || items.length,
    categoryBreakdown,
    primaryVendorEstimate: {
      vendor: "Robu.in / ElectronicsComp",
      subtotalINR: budgetTotal || totalEstimated,
      deliveryTimeDays: "2 - 4 Business Days",
      shippingEstimateINR: totalEstimated > 999 ? 0 : 60,
    },
    savingsAlternative: {
      tip: savingTip,
      potentialSavingsINR: potentialSavings,
    },
  };
}

function inferCategory(
  comp: string,
  spec: string
): "MCU / Board" | "Sensors" | "Actuators & Relays" | "Displays" | "Power & Battery" | "Passives & Connectors" | "Wireless & Modules" {
  const text = `${comp} ${spec}`.toLowerCase();
  if (text.includes("arduino") || text.includes("esp32") || text.includes("esp8266") || text.includes("stm32") || text.includes("pico") || text.includes("8051") || text.includes("mcu") || text.includes("microcontroller")) {
    return "MCU / Board";
  }
  if (text.includes("sensor") || text.includes("dht") || text.includes("sonar") || text.includes("ultrasonic") || text.includes("pir") || text.includes("gas") || text.includes("mq") || text.includes("ldr") || text.includes("temp") || text.includes("moisture")) {
    return "Sensors";
  }
  if (text.includes("servo") || text.includes("motor") || text.includes("relay") || text.includes("pump") || text.includes("buzzer") || text.includes("driver") || text.includes("solenoid") || text.includes("l298n")) {
    return "Actuators & Relays";
  }
  if (text.includes("oled") || text.includes("lcd") || text.includes("display") || text.includes("screen") || text.includes("7-segment") || text.includes("neopixel")) {
    return "Displays";
  }
  if (text.includes("battery") || text.includes("power") || text.includes("charger") || text.includes("tp4056") || text.includes("buck") || text.includes("adapter") || text.includes("regulator")) {
    return "Power & Battery";
  }
  if (text.includes("rfid") || text.includes("bluetooth") || text.includes("lora") || text.includes("nrf") || text.includes("keypad") || text.includes("wifi") || text.includes("wireless")) {
    return "Wireless & Modules";
  }
  return "Passives & Connectors";
}
