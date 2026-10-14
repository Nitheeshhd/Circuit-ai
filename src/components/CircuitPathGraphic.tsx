import React from "react";
import { motion } from "motion/react";

interface CircuitPathGraphicProps {
  className?: string;
  isPulsing?: boolean;
}

export const CircuitPathGraphic: React.FC<CircuitPathGraphicProps> = ({
  className = "",
  isPulsing = true,
}) => {
  return (
    <div className={`relative w-full overflow-hidden flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 720 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto max-h-[210px] select-none"
      >
        <defs>
          {/* Enhanced Neon Glow Filters */}
          <filter id="circuitGlowCyan" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="circuitGlowEmerald" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="circuitGlowIndigo" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3.8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="coreGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Linear Gradients for Traces */}
          <linearGradient id="traceGradCyan" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="1" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.2" />
          </linearGradient>

          <linearGradient id="traceGradEmerald" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#059669" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#34d399" stopOpacity="1" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.2" />
          </linearGradient>

          <linearGradient id="traceGradIndigo" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#818cf8" stopOpacity="1" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.2" />
          </linearGradient>

          <linearGradient id="chipGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0b0f19" />
            <stop offset="50%" stopColor="#111827" />
            <stop offset="100%" stopColor="#090d16" />
          </linearGradient>

          <linearGradient id="dieGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#131d33" />
            <stop offset="100%" stopColor="#0a0f1d" />
          </linearGradient>
        </defs>

        {/* Ambient Grid Reference Lines */}
        <g stroke="#161f33" strokeWidth="1" strokeLinecap="round" opacity="0.6">
          <line x1="20" y1="35" x2="700" y2="35" strokeDasharray="3 10" />
          <line x1="20" y1="110" x2="700" y2="110" strokeDasharray="3 10" />
          <line x1="20" y1="185" x2="700" y2="185" strokeDasharray="3 10" />
          <line x1="180" y1="10" x2="180" y2="210" strokeDasharray="3 10" />
          <line x1="540" y1="10" x2="540" y2="210" strokeDasharray="3 10" />
        </g>

        {/* ================= LEFT CIRCUIT BUS NETWORK ================= */}
        <g>
          {/* Path 1: Top High-Speed Serial / I2C Bus */}
          <path
            d="M 25 45 L 125 45 L 175 80 L 290 80"
            stroke="#1c253b"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <motion.path
            d="M 25 45 L 125 45 L 175 80 L 290 80"
            stroke="#38bdf8"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#circuitGlowCyan)"
            strokeDasharray="24 140"
            animate={{ strokeDashoffset: [0, -328] }}
            transition={{ repeat: Infinity, duration: 2.4, ease: "linear" }}
          />

          {/* Path 2: Center Primary GPIO / SPI Data Line */}
          <path
            d="M 15 110 L 140 110 L 180 110 L 280 110"
            stroke="#1c253b"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <motion.path
            d="M 15 110 L 140 110 L 180 110 L 280 110"
            stroke="#34d399"
            strokeWidth="2.4"
            strokeLinecap="round"
            filter="url(#circuitGlowEmerald)"
            strokeDasharray="32 100"
            animate={{ strokeDashoffset: [0, -265] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
          />

          {/* Path 3: Lower ADC / Sensor Input Line */}
          <path
            d="M 35 175 L 130 175 L 185 140 L 290 140"
            stroke="#1c253b"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <motion.path
            d="M 35 175 L 130 175 L 185 140 L 290 140"
            stroke="#818cf8"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#circuitGlowIndigo)"
            strokeDasharray="26 150"
            animate={{ strokeDashoffset: [0, -352] }}
            transition={{ repeat: Infinity, duration: 2.6, ease: "linear" }}
          />

          {/* Sub Branch 1A */}
          <path
            d="M 75 45 L 105 75 L 150 75"
            stroke="#162035"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <motion.path
            d="M 75 45 L 105 75 L 150 75"
            stroke="#38bdf8"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="14 90"
            animate={{ strokeDashoffset: [0, -180] }}
            transition={{ repeat: Infinity, duration: 2.1, ease: "linear" }}
          />

          {/* Sub Branch 1B */}
          <path
            d="M 85 175 L 115 145 L 155 145"
            stroke="#162035"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <motion.path
            d="M 85 175 L 115 145 L 155 145"
            stroke="#818cf8"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="14 90"
            animate={{ strokeDashoffset: [0, -180] }}
            transition={{ repeat: Infinity, duration: 2.3, ease: "linear", delay: 0.3 }}
          />

          {/* Left Solder Vias / Terminals */}
          <circle cx="25" cy="45" r="5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
          <circle cx="15" cy="110" r="5.5" fill="#f97316" stroke="#ffffff" strokeWidth="1.5" />
          <circle cx="35" cy="175" r="5" fill="#818cf8" stroke="#ffffff" strokeWidth="1.5" />

          {/* Via Solder Rings */}
          <circle cx="150" cy="75" r="3" fill="#0b0f19" stroke="#38bdf8" strokeWidth="1.2" />
          <circle cx="155" cy="145" r="3" fill="#0b0f19" stroke="#818cf8" strokeWidth="1.2" />
        </g>

        {/* ================= CENTER MCU CORE PROCESSOR ================= */}
        <g transform="translate(300, 50)">
          {/* Outer PCB Copper Guard Boundary */}
          <rect
            x="-4"
            y="-4"
            width="128"
            height="128"
            rx="16"
            fill="none"
            stroke="#202c44"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />

          {/* IC Package Body */}
          <rect
            x="0"
            y="0"
            width="120"
            height="120"
            rx="14"
            fill="url(#chipGradient)"
            stroke="#2e3c59"
            strokeWidth="2"
            filter="url(#coreGlow)"
          />

          {/* Silicon Die Cavity */}
          <rect
            x="12"
            y="12"
            width="96"
            height="96"
            rx="8"
            fill="url(#dieGradient)"
            stroke="#1e293b"
            strokeWidth="1.5"
          />

          {/* Core Silicon Crosshair Traces */}
          <line x1="20" y1="60" x2="100" y2="60" stroke="#1e293b" strokeWidth="1" />
          <line x1="60" y1="20" x2="60" y2="100" stroke="#1e293b" strokeWidth="1" />

          {/* Central Oscillator Dynamic Ring 1 */}
          <circle cx="60" cy="60" r="26" fill="#0e1526" stroke="#3b82f6" strokeWidth="1.5" />
          
          {/* Rotating Silicon Clock Ring */}
          <motion.circle
            cx="60"
            cy="60"
            r="32"
            stroke="#10b981"
            strokeWidth="1.5"
            strokeDasharray="12 16"
            fill="none"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 6.5, ease: "linear" }}
            style={{ transformOrigin: "60px 60px" }}
          />

          {/* Counter Rotating Ring */}
          <motion.circle
            cx="60"
            cy="60"
            r="20"
            stroke="#38bdf8"
            strokeWidth="1.2"
            strokeDasharray="8 12"
            fill="none"
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 4.8, ease: "linear" }}
            style={{ transformOrigin: "60px 60px" }}
          />

          {/* Central Active Core Heartbeat */}
          <motion.circle
            cx="60"
            cy="60"
            r="7"
            fill="#38bdf8"
            animate={{ scale: [1, 1.45, 1], opacity: [0.75, 1, 0.75] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
          />

          {/* Top IC Leads */}
          {[-30, -10, 10, 30].map((offset, i) => (
            <rect
              key={`top-pin-${i}`}
              x={60 + offset - 3.5}
              y="-7"
              width="7"
              height="8"
              rx="1.5"
              fill="#334155"
              stroke="#64748b"
              strokeWidth="0.6"
            />
          ))}

          {/* Bottom IC Leads */}
          {[-30, -10, 10, 30].map((offset, i) => (
            <rect
              key={`bot-pin-${i}`}
              x={60 + offset - 3.5}
              y="119"
              width="7"
              height="8"
              rx="1.5"
              fill="#334155"
              stroke="#64748b"
              strokeWidth="0.6"
            />
          ))}

          {/* Left IC Leads */}
          {[-30, 0, 30].map((offset, i) => (
            <rect
              key={`left-pin-${i}`}
              x="-7"
              y={60 + offset - 3.5}
              width="8"
              height="7"
              rx="1.5"
              fill="#334155"
              stroke="#64748b"
              strokeWidth="0.6"
            />
          ))}

          {/* Right IC Leads */}
          {[-30, 0, 30].map((offset, i) => (
            <rect
              key={`right-pin-${i}`}
              x="119"
              y={60 + offset - 3.5}
              width="8"
              height="7"
              rx="1.5"
              fill="#334155"
              stroke="#64748b"
              strokeWidth="0.6"
            />
          ))}
        </g>

        {/* ================= RIGHT CIRCUIT BUS NETWORK ================= */}
        <g>
          {/* Path 4: Top Fast UART / Display Peripheral */}
          <path
            d="M 430 80 L 545 80 L 595 45 L 695 45"
            stroke="#1c253b"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <motion.path
            d="M 430 80 L 545 80 L 595 45 L 695 45"
            stroke="#38bdf8"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#circuitGlowCyan)"
            strokeDasharray="24 140"
            animate={{ strokeDashoffset: [0, -328] }}
            transition={{ repeat: Infinity, duration: 2.3, ease: "linear", delay: 0.2 }}
          />

          {/* Path 5: Center Actuator / PWM Control Stream */}
          <path
            d="M 440 110 L 540 110 L 580 110 L 705 110"
            stroke="#1c253b"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <motion.path
            d="M 440 110 L 540 110 L 580 110 L 705 110"
            stroke="#34d399"
            strokeWidth="2.4"
            strokeLinecap="round"
            filter="url(#circuitGlowEmerald)"
            strokeDasharray="32 100"
            animate={{ strokeDashoffset: [0, -265] }}
            transition={{ repeat: Infinity, duration: 1.7, ease: "linear", delay: 0.4 }}
          />

          {/* Path 6: Lower Wireless BLE / IoT Telemetry Line */}
          <path
            d="M 430 140 L 535 140 L 585 175 L 685 175"
            stroke="#1c253b"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <motion.path
            d="M 430 140 L 535 140 L 585 175 L 685 175"
            stroke="#c084fc"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#circuitGlowIndigo)"
            strokeDasharray="26 150"
            animate={{ strokeDashoffset: [0, -352] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "linear", delay: 0.1 }}
          />

          {/* Sub Branch 2A */}
          <path
            d="M 570 75 L 610 75 L 645 45"
            stroke="#162035"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <motion.path
            d="M 570 75 L 610 75 L 645 45"
            stroke="#38bdf8"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="14 90"
            animate={{ strokeDashoffset: [0, -180] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: "linear", delay: 0.3 }}
          />

          {/* Sub Branch 2B */}
          <path
            d="M 565 145 L 605 145 L 645 175"
            stroke="#162035"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <motion.path
            d="M 565 145 L 605 145 L 645 175"
            stroke="#c084fc"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="14 90"
            animate={{ strokeDashoffset: [0, -180] }}
            transition={{ repeat: Infinity, duration: 2.4, ease: "linear", delay: 0.5 }}
          />

          {/* Right Solder Vias / Terminals */}
          <circle cx="695" cy="45" r="5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
          <circle cx="705" cy="110" r="5.5" fill="#f97316" stroke="#ffffff" strokeWidth="1.5" />
          <circle cx="685" cy="175" r="5" fill="#c084fc" stroke="#ffffff" strokeWidth="1.5" />

          {/* Via Solder Rings */}
          <circle cx="570" cy="75" r="3" fill="#0b0f19" stroke="#38bdf8" strokeWidth="1.2" />
          <circle cx="565" cy="145" r="3" fill="#0b0f19" stroke="#c084fc" strokeWidth="1.2" />
        </g>
      </svg>
    </div>
  );
};
