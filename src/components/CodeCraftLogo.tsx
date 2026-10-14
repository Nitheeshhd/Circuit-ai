import React from "react";
import { motion } from "motion/react";

export interface CircuitoLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
  showBadges?: boolean;
  className?: string;
  authorCredit?: string;
  isAnimated?: boolean;
  badgeOnly?: boolean;
  theme?: "dark" | "light";
}

export const CircuitoLogo: React.FC<CircuitoLogoProps> = ({
  size = "md",
  showTagline = false,
  showBadges = false,
  className = "",
  authorCredit,
  isAnimated = false,
  badgeOnly = false,
  theme = "dark",
}) => {
  const sizeMap = {
    xs: {
      emblemSize: 30,
      titleSize: "text-sm",
      subSize: "text-[8px]",
    },
    sm: {
      emblemSize: 42,
      titleSize: "text-base",
      subSize: "text-[9.5px]",
    },
    md: {
      emblemSize: 64,
      titleSize: "text-xl",
      subSize: "text-xs",
    },
    lg: {
      emblemSize: 110,
      titleSize: "text-2xl sm:text-3xl",
      subSize: "text-xs",
    },
    xl: {
      emblemSize: 150,
      titleSize: "text-3xl sm:text-4xl",
      subSize: "text-sm",
    },
  };

  const current = sizeMap[size];

  // The Exact 3D Isometric Hexagonal C Emblem with Circuit Traces from the uploaded artwork
  const EmblemSvg = (
    <svg
      width={current.emblemSize}
      height={current.emblemSize}
      viewBox="0 0 340 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none filter drop-shadow-[0_6px_22px_rgba(249,115,22,0.4)] transition-all duration-300 ${
        isAnimated ? "scale-105" : "group-hover:scale-105"
      }`}
    >
      <defs>
        {/* 1. Top Outer Sloped Face */}
        <linearGradient id="cgTopFace" x1="0%" y1="0%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#ffb020" />
          <stop offset="45%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>

        {/* 2. Top-Right Inner Cut Face */}
        <linearGradient id="cgTopInner" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ea580c" />
          <stop offset="100%" stopColor="#b43403" />
        </linearGradient>

        {/* 3. Left Vertical Main Face */}
        <linearGradient id="cgLeftSpine" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="35%" stopColor="#ea580c" />
          <stop offset="75%" stopColor="#9a3412" />
          <stop offset="100%" stopColor="#6c1e08" />
        </linearGradient>

        {/* 4. Inner Cavity Facet */}
        <linearGradient id="cgInnerCavity" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7c2d12" />
          <stop offset="100%" stopColor="#451a03" />
        </linearGradient>

        {/* 5. Bottom Outer Sloped Face */}
        <linearGradient id="cgBotFace" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9a3412" />
          <stop offset="60%" stopColor="#6c1e08" />
          <stop offset="100%" stopColor="#451a03" />
        </linearGradient>

        {/* 6. Bottom-Right Lower Face */}
        <linearGradient id="cgBotRight" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7c2d12" />
          <stop offset="50%" stopColor="#ea580c" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>

        {/* 7. Subtle Trace Pulse Filter */}
        <filter id="tracePulse" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <g transform="translate(18, 0)">
        {/* Top Face of Hexagon */}
        <polygon points="65,95 160,40 255,95 205,124 160,98 100,132" fill="url(#cgTopFace)" />
        
        {/* Top Right Chamfer Bevel */}
        <polygon points="255,95 205,124 235,142 285,112" fill="url(#cgTopInner)" />

        {/* Left Main Vertical Spine */}
        <polygon points="65,95 100,132 100,198 65,215" fill="url(#cgLeftSpine)" />

        {/* Inner Cavity Bevel/Slope */}
        <polygon points="100,132 160,98 205,124 185,142 145,120 100,155" fill="url(#cgInnerCavity)" />

        {/* Bottom Sloped Main Face */}
        <polygon points="65,215 100,198 145,224 175,206 215,230 160,262" fill="url(#cgBotFace)" />

        {/* Bottom Right Ascending Terminal */}
        <polygon points="175,206 215,230 255,206 215,182" fill="url(#cgBotRight)" />

        {/* Left PCB Circuit Traces & Solder Nodes (Exact 2 traces matching uploaded artwork) */}
        {/* Trace 1 (Top) */}
        <path d="M 65,166 L 46,166 L 30,152 L 20,152" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="18" cy="152" r="5" fill="#ffffff" />
        <circle cx="18" cy="152" r="2.2" fill="#ea580c" />

        {/* Trace 2 (Bottom) */}
        <path d="M 65,188 L 46,188 L 30,174 L 20,174" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="18" cy="174" r="5" fill="#ffffff" />
        <circle cx="18" cy="174" r="2.2" fill="#ea580c" />
      </g>
    </svg>
  );

  if (badgeOnly) {
    return <div className={`inline-flex items-center justify-center ${className}`}>{EmblemSvg}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col items-center select-none ${className}`}
    >
      {/* Central Visual 3D Hexagon Emblem */}
      <div className="relative group cursor-pointer flex items-center justify-center">
        {EmblemSvg}

        {/* Subtle Ambient Orange Core Halo when animating */}
        {isAnimated && (
          <motion.div
            className="absolute inset-0 rounded-full bg-orange-500/10 blur-xl pointer-events-none -z-10"
            animate={{ scale: [0.9, 1.2, 0.9], opacity: [0.3, 0.7, 0.3] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
          />
        )}
      </div>

      {/* Primary Brand Typography */}
      <div className="mt-3 flex items-center gap-1.5 font-display font-extrabold tracking-tight">
        <span className={`${theme === "dark" ? "text-white" : "text-slate-900"} ${current.titleSize}`}>
          Circuito
        </span>
        <span className={`bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 bg-clip-text text-transparent ${current.titleSize}`}>
          AI
        </span>
      </div>

      {/* Tagline: DESIGN • GENERATE • INNOVATE */}
      <div className="flex items-center gap-2 mt-1 text-slate-400 font-tech font-bold tracking-[0.22em] uppercase text-[10px]">
        <span>DESIGN</span>
        <span className="w-1 h-1 rounded-full bg-orange-500 shrink-0" />
        <span>GENERATE</span>
        <span className="w-1 h-1 rounded-full bg-orange-500 shrink-0" />
        <span>INNOVATE</span>
      </div>

      {/* Subtitles & Engineering Details (For large & hero presentations) */}
      {(showTagline || showBadges) && (
        <div className="flex flex-col items-center text-center mt-3.5 space-y-2">
          {showTagline && (
            <p className="text-[11px] text-slate-400 font-tech max-w-sm mx-auto">
              Hardware Architecture, Indian Retail BOM (₹) & Production Firmware Engine
            </p>
          )}

          {showBadges && (
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
              <span className="text-[10px] font-tech font-bold bg-[#141929] text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full shadow-xs">
                Robu.in BOM (₹)
              </span>
              <span className="text-[10px] font-tech font-bold bg-[#141929] text-slate-200 border border-slate-700/50 px-2.5 py-0.5 rounded-full shadow-xs">
                3.3V Logic Safe
              </span>
              <span className="text-[10px] font-tech font-bold bg-[#141929] text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full shadow-xs">
                Viva Voce Ready
              </span>
            </div>
          )}

          {authorCredit && (
            <div className="pt-1">
              <span className="text-[10px] font-tech text-slate-400 flex items-center justify-center gap-1">
                <span>Created by</span>
                <strong className="text-slate-200 font-semibold">{authorCredit}</strong>
              </span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

// Export CodeCraftLogo as an alias for backwards compatibility across existing components
export const CodeCraftLogo = CircuitoLogo;
export default CircuitoLogo;
