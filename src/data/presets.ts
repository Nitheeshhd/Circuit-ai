import { ProjectPreset } from "../types";

export const PROJECT_PRESETS: ProjectPreset[] = [
  {
    id: "smart-plant-watering",
    title: "IoT Smart Plant Irrigation & Soil Moisture System",
    category: "IoT",
    description: "Monitors soil moisture percentage and ambient temperature/humidity, automatically activates 5V submersible water pump via relay, and sends telemetry to Blynk Cloud.",
    prompt: "I need a smart plant watering system using ESP32. It should read soil moisture with a capacitive sensor, temperature and humidity with DHT22, display stats on a 0.96 inch I2C OLED, and trigger a 5V relay pump when soil moisture falls below 35%. Include Wi-Fi telemetry.",
    targetBoard: "ESP32 (WROOM-32)",
    tags: ["Capacitive Soil Sensor", "DHT22", "0.96 I2C OLED", "5V Relay", "Mini Water Pump"],
  },
  {
    id: "obstacle-avoidance-robot",
    title: "Autonomous Obstacle-Avoiding 4WD Robot Car",
    category: "Robotics",
    description: "4-wheel differential drive robotic rover using ultrasonic radar mounted on SG90 servo to scan 180 degrees and steer away from walls.",
    prompt: "Build an autonomous obstacle avoiding robot car with Arduino Uno, L298N motor driver, 4 DC gear motors, HC-SR04 ultrasonic sensor, and SG90 servo motor for panning. Include distance threshold logic and reverse steering.",
    targetBoard: "Arduino Uno / Nano",
    tags: ["HC-SR04", "SG90 Servo", "L298N Motor Driver", "4x BO Gear Motors", "18650 Battery Pack"],
  },
  {
    id: "smart-dustbin",
    title: "Touchless Automatic Smart Dustbin with Servo Lid",
    category: "Automation",
    description: "Hygienic hands-free dustbin lid that detects approaching hands within 20cm using ultrasonic sensor and opens lid for 5 seconds.",
    prompt: "Make a touchless smart dustbin using Arduino Nano, HC-SR04 ultrasonic sensor, SG90 micro servo motor, and a buzzer beep feedback when opening and closing.",
    targetBoard: "Arduino Uno / Nano",
    tags: ["HC-SR04", "SG90 Servo", "Active Buzzer", "LED Indicator"],
  },
  {
    id: "air-quality-monitor",
    title: "Industrial Air Quality & Toxic Gas Safety Alarm",
    category: "IoT",
    description: "Detects LPG, Smoke, CO (MQ-2/MQ-135) with buzzer alarm, RGB status indicator, and emergency relay cut-off.",
    prompt: "Create an air quality and smoke detection station using NodeMCU ESP8266, MQ-2 gas sensor, MQ-135 air quality sensor, 16x2 I2C LCD display, active buzzer, and relay to cut off gas valve upon high PPM.",
    targetBoard: "ESP8266 (NodeMCU)",
    tags: ["MQ-2 Gas Sensor", "MQ-135", "16x2 I2C LCD", "Active Buzzer", "Relay Module"],
  },
  {
    id: "pulse-oximeter-stm32",
    title: "Digital Heart Rate & SpO2 Blood Oxygen Monitor",
    category: "Healthcare",
    description: "Non-invasive PPG pulse oximeter using MAX30102 optical sensor with real-time waveform display and BPM calculation.",
    prompt: "Design a portable pulse oximeter with STM32 Blue Pill (STM32F103C8T6), MAX30102 optical heart rate/SpO2 sensor over I2C, and SSD1306 OLED display showing heart rate (BPM) and blood oxygen percentage.",
    targetBoard: "STM32 (Blue Pill)",
    tags: ["MAX30102 Sensor", "0.96 I2C OLED", "Push Button", "LiPo Battery"],
  },
  {
    id: "traffic-light-8051",
    title: "Classical 4-Way Traffic Light Controller with Pedestrian Override",
    category: "Academic 8051",
    description: "University lab staple: 4-way intersection traffic sequencing using Timer interrupts and emergency pedestrian push button interrupt on INT0.",
    prompt: "Write an 8051 (AT89S52) project for a 4-way traffic light controller with Red, Yellow, and Green LEDs connected to Port 1 and Port 2. Include a pedestrian push button on external interrupt 0 (P3.2) to give safe crossing time. Explain Keil C and hardware reset circuit.",
    targetBoard: "8051 Microcontroller",
    tags: ["Red/Yellow/Green LEDs", "Push Button", "10k Resistor Pack", "11.0592MHz Crystal"],
  },
  {
    id: "lora-weather-station",
    title: "Long-Range (5km) Off-Grid LoRa Agro Weather Node",
    category: "IoT",
    description: "Solar-powered remote agricultural node transmitting atmospheric pressure, temp, humidity, and rainfall data via SX1278 LoRa 433/868MHz.",
    prompt: "Build an off-grid long range agricultural weather station using Raspberry Pi Pico, SX1278 LoRa transceiver module (SPI), BME280 sensor for barometric pressure/humidity/temperature, and deep sleep low-power cycling.",
    targetBoard: "Raspberry Pi Pico",
    tags: ["SX1278 LoRa Module", "BME280 Sensor", "Rain Sensor", "TP4056 Solar Charger"],
  },
  {
    id: "rfid-smart-door-lock",
    title: "RFID & Keypad Smart Security Access Door Lock",
    category: "Automation",
    description: "Secure door lock using RC522 13.56MHz RFID cards, 4x4 matrix keypad for PIN fallback, and 12V solenoid door strike with optocoupler relay.",
    prompt: "Design a smart RFID door lock with RC522 RFID reader (SPI), 4x4 matrix keypad, 16x2 I2C LCD, 12V solenoid lock triggered by relay, and master card registration in EEPROM on Arduino Uno.",
    targetBoard: "Arduino Uno / Nano",
    tags: ["RC522 RFID Reader", "4x4 Matrix Keypad", "16x2 I2C LCD", "12V Solenoid Lock", "5V Relay"],
  },
];

export interface ComponentModule {
  name: string;
  category: "Sensors" | "Actuators" | "Displays" | "Comm & Wireless" | "Power & Relays";
  chip: string;
  voltage: string;
  interfaceType: "Digital" | "Analog" | "I2C" | "SPI" | "UART" | "PWM";
  approxPriceINR: number;
}

export const POPULAR_COMPONENTS: ComponentModule[] = [
  // Sensors
  { name: "Ultrasonic (HC-SR04)", category: "Sensors", chip: "HC-SR04", voltage: "5V", interfaceType: "Digital", approxPriceINR: 65 },
  { name: "Temp & Humidity (DHT22)", category: "Sensors", chip: "AM2302", voltage: "3.3V / 5V", interfaceType: "Digital", approxPriceINR: 210 },
  { name: "Temp & Humidity (DHT11)", category: "Sensors", chip: "DHT11", voltage: "3.3V / 5V", interfaceType: "Digital", approxPriceINR: 62 },
  { name: "Soil Moisture (Capacitive)", category: "Sensors", chip: "v1.2 Analog", voltage: "3.3V / 5V", interfaceType: "Analog", approxPriceINR: 68 },
  { name: "PIR Motion Sensor", category: "Sensors", chip: "HC-SR501", voltage: "5V", interfaceType: "Digital", approxPriceINR: 65 },
  { name: "Gyro & Accel (MPU6050)", category: "Sensors", chip: "MPU6050", voltage: "3.3V / 5V", interfaceType: "I2C", approxPriceINR: 110 },
  { name: "Smoke / Gas (MQ-2)", category: "Sensors", chip: "MQ-2", voltage: "5V", interfaceType: "Analog", approxPriceINR: 88 },
  { name: "Heart Rate & SpO2", category: "Sensors", chip: "MAX30102", voltage: "3.3V", interfaceType: "I2C", approxPriceINR: 185 },
  { name: "Digital Temperature (DS18B20)", category: "Sensors", chip: "DS18B20", voltage: "3.3V / 5V", interfaceType: "Digital", approxPriceINR: 98 },
  { name: "Light LDR Sensor Module", category: "Sensors", chip: "LM393 LDR", voltage: "3.3V / 5V", interfaceType: "Analog", approxPriceINR: 32 },
  { name: "Pressure & Temp (BMP280)", category: "Sensors", chip: "BMP280", voltage: "3.3V", interfaceType: "I2C", approxPriceINR: 98 },
  { name: "Raindrops Sensor Module", category: "Sensors", chip: "LM393 Plate", voltage: "3.3V / 5V", interfaceType: "Analog", approxPriceINR: 48 },

  // Actuators
  { name: "Micro Servo (SG90)", category: "Actuators", chip: "TowerPro SG90", voltage: "5V", interfaceType: "PWM", approxPriceINR: 58 },
  { name: "Metal Gear Servo (MG995)", category: "Actuators", chip: "MG995", voltage: "5V", interfaceType: "PWM", approxPriceINR: 220 },
  { name: "Motor Driver (L298N)", category: "Actuators", chip: "L298N Dual H-Bridge", voltage: "5V Logic (7-35V Drive)", interfaceType: "Digital", approxPriceINR: 110 },
  { name: "Active Buzzer 5V", category: "Actuators", chip: "Active Buzzer", voltage: "5V", interfaceType: "Digital", approxPriceINR: 18 },
  { name: "Stepper Motor + ULN2003", category: "Actuators", chip: "28BYJ-48 + ULN2003", voltage: "5V", interfaceType: "Digital", approxPriceINR: 130 },

  // Displays
  { name: "0.96 inch I2C OLED", category: "Displays", chip: "SSD1306 128x64", voltage: "3.3V / 5V", interfaceType: "I2C", approxPriceINR: 140 },
  { name: "16x2 LCD Display with I2C", category: "Displays", chip: "HD44780 + PCF8574", voltage: "5V", interfaceType: "I2C", approxPriceINR: 150 },
  { name: "4-Digit 7-Segment Display", category: "Displays", chip: "TM1637", voltage: "3.3V / 5V", interfaceType: "Digital", approxPriceINR: 68 },
  { name: "NeoPixel RGB Ring (8/12/16)", category: "Displays", chip: "WS2812B", voltage: "5V", interfaceType: "Digital", approxPriceINR: 130 },

  // Power & Relays
  { name: "1-Channel 5V Relay Module", category: "Power & Relays", chip: "Optocoupler Isolated", voltage: "5V", interfaceType: "Digital", approxPriceINR: 38 },
  { name: "4-Channel 5V Relay Module", category: "Power & Relays", chip: "Songle 10A Relay", voltage: "5V", interfaceType: "Digital", approxPriceINR: 130 },
  { name: "Buck Converter LM2596 (Step-Down)", category: "Power & Relays", chip: "LM2596 DC-DC", voltage: "3-40V In, 1.5-35V Out", interfaceType: "Analog", approxPriceINR: 68 },
  { name: "TP4056 Li-Ion Charger", category: "Power & Relays", chip: "TP4056 with Protection", voltage: "5V USB In", interfaceType: "Analog", approxPriceINR: 28 },

  // Comm & Wireless
  { name: "Bluetooth Serial (HC-05)", category: "Comm & Wireless", chip: "HC-05 (Master/Slave)", voltage: "3.3V UART (5V VCC)", interfaceType: "UART", approxPriceINR: 220 },
  { name: "RFID RC522 Reader + Card", category: "Comm & Wireless", chip: "MFRC522 13.56MHz", voltage: "3.3V", interfaceType: "SPI", approxPriceINR: 130 },
  { name: "nRF24L01+ 2.4GHz RF Module", category: "Comm & Wireless", chip: "nRF24L01+", voltage: "3.3V (5V Tolerant SPI)", interfaceType: "SPI", approxPriceINR: 78 },
  { name: "SX1278 LoRa Module (433MHz)", category: "Comm & Wireless", chip: "Ra-02 LoRa", voltage: "3.3V", interfaceType: "SPI", approxPriceINR: 275 },
];
