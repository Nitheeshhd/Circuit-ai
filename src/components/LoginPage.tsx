import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Mail,
  Lock,
  User as UserIcon,
  Cpu,
} from "lucide-react";
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signInWithFacebook,
  resetPassword,
  AppUser as User,
} from "../services/supabase";

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
  onContinueAsGuest: () => void;
}

type AuthMode = "login" | "signup" | "forgot";

interface CountryOption {
  code: string;
  name: string;
  flag: string;
}

const COUNTRIES: CountryOption[] = [
  { code: "IND", name: "India", flag: "🇮🇳" },
  { code: "USA", name: "United States", flag: "🇺🇸" },
  { code: "GBR", name: "United Kingdom", flag: "🇬🇧" },
  { code: "DEU", name: "Germany", flag: "🇩🇪" },
  { code: "JPN", name: "Japan", flag: "🇯🇵" },
];

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onContinueAsGuest,
}) => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);

  // Country selector
  const [selectedCountry, setSelectedCountry] = useState<CountryOption>(COUNTRIES[0]);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);

  // Status & Error
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const getCleanErrorMessage = (err: any): string => {
    if (!err) return "Authentication failed. Please check your credentials.";

    const raw = (err.message || err.error_description || String(err)).toLowerCase();

    if (raw.includes("invalid login credentials") || raw.includes("invalid_credentials") || raw.includes("wrong password")) {
      return "Incorrect email or password. Please verify your details and try again.";
    }
    if (raw.includes("user already registered") || raw.includes("user_already_exists") || raw.includes("already registered")) {
      return "An account with this email already exists. Please sign in instead.";
    }
    if (raw.includes("email not confirmed") || raw.includes("unverified")) {
      return "Your email address has not been confirmed yet. Please check your inbox for the confirmation link.";
    }
    if (raw.includes("password should be at least") || raw.includes("weak_password")) {
      return "Password is too weak. Please use at least 6 characters with a combination of letters and numbers.";
    }
    if (raw.includes("rate limit") || raw.includes("too many requests") || raw.includes("over_email_send_rate_limit")) {
      return "Too many attempts. Please wait a minute before trying again.";
    }
    if (raw.includes("network") || raw.includes("fetch failed") || raw.includes("failed to fetch")) {
      return "Network connection issue. Please check your internet connection.";
    }
    if (raw.includes("oauth") || raw.includes("popup")) {
      return "Social sign-in was cancelled or encountered an error. Please try signing in with email.";
    }

    return err.message || "Authentication failed. Please check your email and password.";
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    if (mode === "forgot") {
      setIsLoading(true);
      try {
        await resetPassword(email);
        setSuccessMessage("Password reset email sent! Check your inbox.");
      } catch (err: any) {
        setErrorMessage(getCleanErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    if (mode === "signup") {
      if (password.length < 6) {
        setErrorMessage("Password must be at least 6 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage("Passwords do not match.");
        return;
      }

      setIsLoading(true);
      try {
        const user = await signUpWithEmail(email, password, displayName || "Circuit Engineer", keepLoggedIn);
        setSuccessMessage("Account created successfully! If email confirmation is enabled on your Supabase project, check your inbox to confirm your email.");
        setTimeout(() => onLoginSuccess(user), 1200);
      } catch (err: any) {
        setErrorMessage(getCleanErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Default: Login mode
    setIsLoading(true);
    try {
      const user = await signInWithEmail(email, password, keepLoggedIn);
      onLoginSuccess(user);
    } catch (err: any) {
      setErrorMessage(getCleanErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);
    try {
      const user = await signInWithGoogle(keepLoggedIn);
      onLoginSuccess(user);
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") {
        setErrorMessage(getCleanErrorMessage(err));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);
    try {
      const user = await signInWithFacebook(keepLoggedIn);
      onLoginSuccess(user);
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") {
        setErrorMessage(getCleanErrorMessage(err));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-3 sm:p-6 md:p-10 bg-[#eef3f8] relative overflow-hidden select-none">
      {/* Subtle modern background geometry */}
      <div className="absolute top-0 right-0 w-[55vw] h-[55vw] rounded-full bg-gradient-to-br from-white/60 to-emerald-50/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[45vw] h-[45vw] rounded-full bg-gradient-to-tr from-sky-50/40 to-white/70 blur-3xl pointer-events-none" />

      {/* Main Login Card container matching design */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="w-full max-w-[1060px] min-h-[640px] bg-white rounded-[28px] sm:rounded-[36px] shadow-[0_25px_70px_-15px_rgba(20,35,60,0.12)] border border-slate-100/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10"
      >
        {/* ================= LEFT PANEL: BRANDING & VECTOR ILLUSTRATION ================= */}
        <div className="hidden lg:flex lg:col-span-6 bg-gradient-to-br from-[#f8fafc] via-[#f4f8fd] to-[#edf4fc] p-6 sm:p-10 flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-100 relative overflow-hidden">
          {/* Top Brand Logo - Circuito AI replacing JETVIN */}
          <div className="flex items-center gap-2.5 z-10">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#00c853] to-[#10b981] flex items-center justify-center shadow-md shadow-emerald-500/25">
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {/* Modern vehicle / circuit chip hybrid icon */}
                <rect x="3" y="5" width="18" height="14" rx="3" />
                <circle cx="8" cy="19" r="1.5" fill="currentColor" />
                <circle cx="16" cy="19" r="1.5" fill="currentColor" />
                <path d="M7 11h2l1-2h4l1 2h2" />
                <circle cx="12" cy="7" r="1" fill="currentColor" />
              </svg>
            </div>
            <div className="flex items-baseline gap-1 font-display tracking-tight">
              <span className="text-[22px] font-black text-[#0f172a] uppercase tracking-wider">
                Circuito
              </span>
              <span className="text-[22px] font-black text-[#00c853] uppercase tracking-wider">
                AI
              </span>
            </div>
          </div>

          {/* Central High-Fidelity Vector Illustration mirroring the attached image */}
          <div className="my-auto py-6 flex items-center justify-center relative w-full">
            <svg
              viewBox="0 0 540 440"
              className="w-full max-w-[460px] h-auto drop-shadow-sm select-none"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Subtle ambient decorative leaves in soft blue */}
              <path
                d="M80 320C60 290 60 250 85 240C90 270 95 300 80 320Z"
                fill="#dbeafe"
                opacity="0.65"
              />
              <path
                d="M92 340C78 315 75 285 96 270C104 290 102 320 92 340Z"
                fill="#bfdbfe"
                opacity="0.45"
              />

              {/* Dashed trajectory line connecting badges */}
              <path
                d="M100 150 C120 70, 310 70, 410 150 C440 180, 440 240, 420 280"
                stroke="#6ee7b7"
                strokeWidth="1.8"
                strokeDasharray="4 4"
                opacity="0.85"
              />

              {/* FLOATING BADGE 1: Password Dots Container (Top Left) */}
              <g transform="translate(110, 68)">
                <rect
                  x="0"
                  y="0"
                  width="128"
                  height="34"
                  rx="6"
                  fill="#ffffff"
                  stroke="#5eead4"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
                <circle cx="22" cy="17" r="4" fill="#67e8f9" />
                <circle cx="41" cy="17" r="4" fill="#67e8f9" />
                <circle cx="60" cy="17" r="4" fill="#67e8f9" />
                <circle cx="79" cy="17" r="4" fill="#67e8f9" />
                <circle cx="98" cy="17" r="4" fill="#67e8f9" />
                <circle cx="114" cy="17" r="3" fill="#a5f3fc" />
              </g>

              {/* FLOATING BADGE 2: Green Gear (Top Center) */}
              <g transform="translate(255, 120)">
                <circle cx="18" cy="18" r="18" fill="#00c853" />
                {/* Gear teeth */}
                <path
                  d="M18 2 L18 6 M18 30 L18 34 M2 18 L6 18 M30 18 L34 18 M7 7 L10 10 M26 26 L29 29 M7 29 L10 26 M26 10 L29 7"
                  stroke="#00c853"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <circle cx="18" cy="18" r="7" fill="#ffffff" />
              </g>

              {/* FLOATING BADGE 3: Green Key Badge (Top Right) */}
              <g transform="translate(378, 118)">
                <circle
                  cx="20"
                  cy="20"
                  r="20"
                  fill="#ffffff"
                  stroke="#00c853"
                  strokeWidth="2.5"
                />
                <circle cx="20" cy="20" r="15" fill="#00c853" />
                {/* Key icon in white */}
                <path
                  d="M23 15 A4 4 0 1 0 17 21 L15 23 L15 25 L17 25 L17 23 L19 23 L19 21 L23 21 A4 4 0 0 0 23 15 Z M23 18 A1.5 1.5 0 1 1 23 15 A1.5 1.5 0 0 1 23 18 Z"
                  fill="#ffffff"
                />
              </g>

              {/* CENTRAL DASHBOARD / FORM CARD CONTAINER */}
              <g transform="translate(210, 150)">
                {/* Main Card Shape */}
                <rect
                  x="0"
                  y="0"
                  width="180"
                  height="180"
                  rx="14"
                  fill="#e2e8f0"
                  opacity="0.9"
                />
                <rect x="2" y="2" width="176" height="176" rx="12" fill="#e0f2fe" />

                {/* Card Top Tab */}
                <rect
                  x="36"
                  y="-8"
                  width="18"
                  height="12"
                  rx="3"
                  fill="#ffffff"
                  stroke="#94a3b8"
                  strokeWidth="1.2"
                />

                {/* Form fields placeholder bars */}
                <rect x="24" y="32" width="132" height="24" rx="4" fill="#ffffff" />
                <rect x="24" y="66" width="132" height="24" rx="4" fill="#ffffff" />
                <rect x="24" y="100" width="132" height="24" rx="4" fill="#ffffff" />

                {/* Green Action Bar/Button on card */}
                <rect x="52" y="134" width="76" height="20" rx="4" fill="#00c853" />
              </g>

              {/* SECURITY SHIELD & LOCK BADGE ON CARD */}
              <g transform="translate(370, 240)">
                <circle
                  cx="24"
                  cy="24"
                  r="24"
                  fill="#ffffff"
                  stroke="#00c853"
                  strokeWidth="2.5"
                />
                <circle cx="24" cy="24" r="18" fill="#10b981" />
                {/* Padlock Icon */}
                <rect x="18" y="22" width="12" height="10" rx="2" fill="#ffffff" />
                <path
                  d="M20 22 V18 C20 15.8 21.8 14 24 14 C26.2 14 28 15.8 28 18 V22"
                  stroke="#ffffff"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
                <circle cx="24" cy="27" r="1.5" fill="#10b981" />
              </g>

              {/* TECH CHARACTER (ENGINEER) */}
              <g transform="translate(100, 120)">
                {/* Character Head */}
                <circle cx="70" cy="50" r="18" fill="#1e293b" />
                <circle cx="70" cy="52" r="14" fill="#ffffff" />
                {/* Hair & Face Outline */}
                <path
                  d="M58 50 C58 38 68 32 76 34 C82 36 84 42 84 46 C80 48 76 46 72 48 C68 50 66 54 66 58 Z"
                  fill="#1e293b"
                />
                {/* Ear */}
                <circle cx="68" cy="52" r="3.5" fill="#f8fafc" stroke="#1e293b" strokeWidth="1" />

                {/* Character Torso (Dark Navy Shirt) */}
                <path
                  d="M48 90 C48 78 58 70 70 70 C82 70 94 76 96 88 L104 160 L40 160 Z"
                  fill="#0f172a"
                />

                {/* Right Arm resting on the card */}
                <path
                  d="M88 84 L118 120 L118 160 L104 160 L102 126 L80 94 Z"
                  fill="#0f172a"
                />
                {/* Hand on card */}
                <path
                  d="M112 154 L114 174 L126 174 L128 154 Z"
                  fill="#ffffff"
                  stroke="#0f172a"
                  strokeWidth="1.5"
                />
                <path d="M118 162 L118 172 M122 162 L122 172" stroke="#0f172a" strokeWidth="1.2" />

                {/* Left Arm hanging naturally */}
                <path
                  d="M48 88 L34 140 L44 144 L56 94 Z"
                  fill="#0f172a"
                />

                {/* Legs (White Pants with crisp dark lines) */}
                <path
                  d="M48 160 L48 270 L68 270 L72 190 L76 270 L96 270 L96 160 Z"
                  fill="#ffffff"
                  stroke="#334155"
                  strokeWidth="1.8"
                />
                <line x1="72" y1="160" x2="72" y2="200" stroke="#334155" strokeWidth="1.5" />

                {/* Dark Shoes */}
                <path
                  d="M38 270 L68 270 L68 278 L34 278 Z"
                  fill="#0f172a"
                  rx="3"
                />
                <path
                  d="M76 270 L106 270 L110 278 L76 278 Z"
                  fill="#0f172a"
                  rx="3"
                />
              </g>

              {/* MINI VEHICLE / CIRCUITO ROBOTIC CAR (Bottom Left) */}
              <g transform="translate(186, 362)">
                {/* Wheels */}
                <circle cx="12" cy="22" r="7" fill="#0f172a" />
                <circle cx="12" cy="22" r="3.5" fill="#94a3b8" />
                <circle cx="50" cy="22" r="7" fill="#0f172a" />
                <circle cx="50" cy="22" r="3.5" fill="#94a3b8" />

                {/* Car Body */}
                <path
                  d="M4 18 C4 13 8 10 14 10 L22 6 C25 4 30 4 38 4 L48 10 C54 10 60 13 60 18 L60 20 L4 20 Z"
                  fill="#ffffff"
                  stroke="#64748b"
                  strokeWidth="1.4"
                />
                {/* Windows & Headlight */}
                <path d="M22 8 L36 8 L44 11 L22 11 Z" fill="#93c5fd" />
                <circle cx="56" cy="14" r="2" fill="#fbbf24" />
                <circle cx="6" cy="14" r="2" fill="#ef4444" />
              </g>

              {/* POTTED PLANT (Bottom Right) */}
              <g transform="translate(366, 315)">
                {/* Leaves */}
                <path
                  d="M26 35 C10 20 8 0 28 -5 C32 15 30 25 26 35 Z"
                  fill="#0f172a"
                />
                <path
                  d="M28 35 C42 20 44 0 24 -5 C20 15 22 25 28 35 Z"
                  fill="#1e293b"
                />
                <path
                  d="M27 35 C18 10 32 -12 28 -18 C38 -5 32 15 27 35 Z"
                  fill="#334155"
                />

                {/* Planter Pot */}
                <rect x="10" y="32" width="34" height="8" rx="2" fill="#0f172a" />
                <path
                  d="M12 40 L16 70 L38 70 L42 40 Z"
                  fill="#0f172a"
                />
              </g>

              {/* GROUND BASELINE */}
              <line
                x1="40"
                y1="398"
                x2="480"
                y2="398"
                stroke="#64748b"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Left Panel Footer Tagline */}
          <div className="pt-2 text-center lg:text-left z-10">
            <p className="text-xs font-medium text-slate-500 flex items-center justify-center lg:justify-start gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-500" />
              <span>AI-Powered Hardware Architect & Firmware Synthesis</span>
            </p>
          </div>
        </div>

        {/* ================= RIGHT PANEL: LOGIN & AUTH CONTROLS ================= */}
        <div className="lg:col-span-6 p-6 sm:p-10 md:p-12 flex flex-col justify-between bg-white relative">
          {/* Top Row: Mobile Logo + Country / Region Selector */}
          <div className="flex items-center justify-between lg:justify-end relative mb-2 lg:mb-0">
            {/* Mobile Logo (Visible only on mobile) */}
            <div className="flex items-center gap-2 lg:hidden">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#00c853] to-[#10b981] flex items-center justify-center shadow-md shadow-emerald-500/20">
                <Cpu className="w-4 h-4 text-white" />
              </div>
              <div className="flex items-baseline gap-1 font-display tracking-tight">
                <span className="text-lg font-black text-[#0f172a] uppercase tracking-wider">Circuito</span>
                <span className="text-lg font-black text-[#00c853] uppercase tracking-wider">AI</span>
              </div>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-md border border-slate-200 transition cursor-pointer"
              >
                <span>{selectedCountry.code}</span>
                <span className="text-sm">{selectedCountry.flag}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              <AnimatePresence>
                {isCountryDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute right-0 mt-1.5 w-36 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50 text-xs font-medium text-slate-700"
                  >
                    {COUNTRIES.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => {
                          setSelectedCountry(c);
                          setIsCountryDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-emerald-50/60 hover:text-emerald-700 transition cursor-pointer ${
                          selectedCountry.code === c.code ? "bg-emerald-50 text-emerald-700 font-bold" : ""
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{c.flag}</span>
                          <span>{c.code}</span>
                        </span>
                        <span className="text-[10px] text-slate-400">{c.name}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Form Content Area */}
          <div className="max-w-[390px] w-full mx-auto my-auto py-2">
            {/* Header Titles */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight">
                {mode === "login" && "Login"}
                {mode === "signup" && "Create Account"}
                {mode === "forgot" && "Reset Password"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {mode === "login" && "Welcome back! Please login to your account."}
                {mode === "signup" && "Join Circuito AI and architect circuits with intelligence."}
                {mode === "forgot" && "Enter your email to receive a password reset link."}
              </p>
            </div>

            {/* Error & Success Alerts */}
            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-rose-800">Authentication Error</p>
                    <p className="text-rose-600 mt-0.5">{errorMessage}</p>
                  </div>
                </motion.div>
              )}

              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2.5"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                  <p className="flex-1 font-medium">{successMessage}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Email/Password Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              {mode === "signup" && (
                <div>
                  <label className="block text-[11.5px] font-semibold text-slate-500 mb-1.5">
                    Your Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Alex Robert"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition placeholder:text-slate-300"
                    />
                  </div>
                </div>
              )}

              {/* Email Input */}
              <div>
                <label className="block text-[11.5px] font-semibold text-slate-500 mb-1.5">
                  Your email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="lrobbertalex99@gmail.com"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition placeholder:text-slate-300 font-sans"
                  />
                </div>
              </div>

              {/* Password Input (Login & Signup) */}
              {mode !== "forgot" && (
                <div>
                  <label className="block text-[11.5px] font-semibold text-slate-500 mb-1.5">
                    Your Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3.5 py-2.5 pr-10 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition placeholder:text-slate-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Confirm Password (Signup only) */}
              {mode === "signup" && (
                <div>
                  <label className="block text-[11.5px] font-semibold text-slate-500 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition placeholder:text-slate-300"
                    />
                  </div>
                </div>
              )}

              {/* Checkbox: Keep me logged in */}
              {mode !== "forgot" && (
                <div className="flex items-center gap-2 pt-0.5">
                  <input
                    type="checkbox"
                    id="keepLoggedIn"
                    checked={keepLoggedIn}
                    onChange={(e) => setKeepLoggedIn(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer accent-[#00c853]"
                  />
                  <label
                    htmlFor="keepLoggedIn"
                    className="text-xs text-slate-600 select-none cursor-pointer"
                  >
                    Keep me logged in
                  </label>
                </div>
              )}

              {/* Primary Green Action Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-[#00c853] hover:bg-[#00b248] active:bg-[#009e40] text-white font-bold text-sm rounded-lg shadow-md shadow-emerald-500/20 hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Processing...</span>
                  </>
                ) : mode === "login" ? (
                  "Login"
                ) : mode === "signup" ? (
                  "Create Account"
                ) : (
                  "Send Reset Link"
                )}
              </button>
            </form>

            {/* Bottom Links (Don't have an account? Sign up / Forgot Password?) */}
            <div className="mt-5 text-center space-y-1.5 text-xs">
              {mode === "login" && (
                <>
                  <p className="text-slate-600">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("signup");
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                      className="text-[#00c853] hover:underline font-semibold cursor-pointer"
                    >
                      Sign up
                    </button>
                  </p>
                  <p>
                    <button
                      type="button"
                      onClick={() => {
                        setMode("forgot");
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                      className="text-[#00c853] hover:underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </p>
                </>
              )}

              {mode === "signup" && (
                <p className="text-slate-600">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="text-[#00c853] hover:underline font-semibold cursor-pointer"
                  >
                    Log in
                  </button>
                </p>
              )}

              {mode === "forgot" && (
                <p className="text-slate-600">
                  Remember your password?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="text-[#00c853] hover:underline font-semibold cursor-pointer"
                  >
                    Back to Login
                  </button>
                </p>
              )}

              {/* Discreet Guest / Offline workbench option */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onContinueAsGuest}
                  className="text-[11px] text-slate-400 hover:text-slate-600 transition inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Continue to Workbench as Guest</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Rights Notice - exactly as specified: "@ 2026 All rights reserved." */}
          <div className="pt-6 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400 font-sans tracking-wide">
              @ 2026 All rights reserved.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
