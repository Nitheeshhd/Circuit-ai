import React, { useState } from "react";
import { motion } from "motion/react";
import { Key, Eye, EyeOff, CheckCircle2, AlertTriangle, ExternalLink, ShieldCheck, Sparkles, X } from "lucide-react";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveKey: (key: string) => void;
  hasServerKey: boolean;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSaveKey,
  hasServerKey,
}) => {
  const [inputVal, setInputVal] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleTestKey = async () => {
    if (!inputVal && !hasServerKey) {
      setTestResult({ success: false, message: "Please enter an API key to test." });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/v1/validate-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(inputVal ? { "x-gemini-api-key": inputVal } : {}),
        },
        body: JSON.stringify({ apiKey: inputVal }),
      });

      const data = await res.json();
      if (res.ok && data.valid) {
        setTestResult({ success: true, message: "API key is valid and connected to AI engine." });
      } else {
        setTestResult({ success: false, message: data.message || "Failed to validate key." });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || "Network error while validating key." });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    onSaveKey(inputVal.trim());
    onClose();
  };

  const handleClear = () => {
    setInputVal("");
    onSaveKey("");
    setTestResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 6 }}
        transition={{ duration: 0.15 }}
        className="w-full max-w-lg bg-[#121819] rounded-3xl shadow-2xl border border-[#202728] overflow-hidden text-[#F1F3F4]"
      >
        {/* Modal Header */}
        <div className="bg-[#111719] px-6 py-4 flex items-center justify-between border-b border-[#202728]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#073D2D] border border-[#25D366]/30 flex items-center justify-center text-[#25D366]">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-[#F1F3F4]">API Key Settings</h3>
              <p className="text-xs text-[#9AA0A2]">BYOK & Cloud Key Management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#9AA0A2] hover:text-[#F1F3F4] p-2 rounded-full transition-colors hover:bg-[#202628] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs">
          {hasServerKey && (
            <div className="p-4 bg-[#073D2D]/60 border border-[#25D366]/30 rounded-2xl flex items-start gap-3 text-[#F1F3F4]">
              <ShieldCheck className="w-5 h-5 text-[#25D366] shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-[#25D366] text-xs">Cloud Key Connected</p>
                <p className="mt-0.5 text-[#9AA0A2] leading-relaxed text-xs">
                  A default API key is configured on the server environment. You can use this immediately or override it with your personal key below.
                </p>
              </div>
            </div>
          )}

          {/* Key Input Section */}
          <div className="space-y-2">
            <label className="block text-xs font-medium uppercase text-[#9AA0A2]">
              Your Personal API Key:
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-[#202628] border border-[#202728] rounded-2xl p-3 pr-10 text-xs text-[#F1F3F4] font-mono focus:border-[#25D366] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-3 text-[#9AA0A2] hover:text-[#F1F3F4]"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-[#9AA0A2] leading-normal">
              Enter your API key. No credit card required.
            </p>
          </div>

          {/* Test Connection Button & Result */}
          <div className="space-y-2">
            <button
              onClick={handleTestKey}
              disabled={testing}
              className="text-xs bg-[#202628] hover:bg-[#111719] text-[#25D366] border border-[#202728] px-3.5 py-1.5 rounded-full font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#25D366]" />
              <span>{testing ? "Testing Connection..." : "Test Key Connection"}</span>
            </button>

            {testResult && (
              <div
                className={`p-3 rounded-2xl border text-xs flex items-center gap-2 ${
                  testResult.success
                    ? "bg-[#073D2D] border-[#25D366]/40 text-[#25D366]"
                    : "bg-[#381617] border-[#f87171]/40 text-[#f87171]"
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-[#25D366] shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-[#f87171] shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-[#111719] px-6 py-3 border-t border-[#202728] flex items-center justify-between">
          <button
            onClick={handleClear}
            className="text-xs text-[#f87171] hover:text-[#fca5a5] font-medium cursor-pointer"
          >
            Clear Key
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-[#202628] hover:bg-[#111719] text-[#9AA0A2] hover:text-[#F1F3F4] rounded-full transition-colors text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-[#071011] rounded-full transition-colors text-xs font-medium shadow-xs cursor-pointer"
            >
              Save Key
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
