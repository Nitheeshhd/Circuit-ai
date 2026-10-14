import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  CreditCard,
  QrCode,
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Zap,
} from "lucide-react";
import { SubscriptionTier } from "../types";
import { SUBSCRIPTION_PLANS, activePaymentAdapter, VerificationResult } from "../services/payment";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPlan: "student" | "pro";
  userId?: string;
  onPaymentSuccess: (result: VerificationResult) => void;
}

type PaymentMethod = "upi" | "card" | "netbanking";

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  targetPlan,
  userId = "guest_user",
  onPaymentSuccess,
}) => {
  const [method, setMethod] = useState<PaymentMethod>("upi");
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [selectedBank, setSelectedBank] = useState("HDFC Bank");

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<VerificationResult | null>(null);

  if (!isOpen) return null;

  const planDetails = SUBSCRIPTION_PLANS.find((p) => p.id === targetPlan) || SUBSCRIPTION_PLANS[1];

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsProcessing(true);

    try {
      // 1. Create payment order via adapter
      const order = await activePaymentAdapter.createOrder(targetPlan, planDetails.priceINR);

      // 2. Perform verification (Server / Mock adapter)
      const verification = await activePaymentAdapter.verifyPayment(
        order.orderId,
        `pay_${Math.random().toString(36).substring(2, 10)}`,
        `sig_${Math.random().toString(36).substring(2, 10)}`,
        targetPlan,
        userId
      );

      if (verification.success) {
        setSuccessResult(verification);
        setTimeout(() => {
          onPaymentSuccess(verification);
        }, 1200);
      } else {
        setErrorMsg(verification.message || "Payment verification failed. Please try again.");
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      setErrorMsg(err?.message || "Payment processing failed. Please check details & retry.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-lg bg-[#0b0f19] border border-[#1f293d] rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden my-6"
        >
          {/* Subtle Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#161e31] hover:bg-[#202b44] text-slate-400 hover:text-white flex items-center justify-center transition border border-[#232f4a] cursor-pointer z-10 disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Success Overlay View */}
          {successResult ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-500/25 animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold font-display text-white">Payment Verified!</h3>
              <p className="text-sm text-slate-300 max-w-xs mx-auto">
                {successResult.message}
              </p>
              <div className="pt-2 text-xs font-mono text-emerald-400 flex items-center justify-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Activating subscription & unlocking premium features...</span>
              </div>
            </div>
          ) : (
            <>
              {/* Order Header Summary */}
              <div className="mb-6 pb-5 border-b border-[#1b253b] space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Circuito AI Subscription</span>
                  <span className="text-emerald-400 font-bold uppercase">{targetPlan} PLAN</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <h3 className="text-xl font-bold text-white font-display">Order Summary</h3>
                  <div className="text-2xl font-black font-mono text-emerald-400">
                    ₹{planDetails.priceINR} <span className="text-xs text-slate-400 font-sans font-normal">/ mo</span>
                  </div>
                </div>
              </div>

              {/* Error Notice */}
              {errorMsg && (
                <div className="mb-4 p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-xs text-rose-200 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleProcessPayment} className="space-y-5">
                {/* Method selector tabs */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-400">Select Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setMethod("upi")}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs transition cursor-pointer ${
                        method === "upi"
                          ? "bg-emerald-500/15 border-emerald-500 text-emerald-300 font-semibold"
                          : "bg-[#101726] border-[#1e293f] text-slate-400 hover:text-white"
                      }`}
                    >
                      <QrCode className="w-4 h-4" />
                      <span>UPI / GPay</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMethod("card")}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs transition cursor-pointer ${
                        method === "card"
                          ? "bg-emerald-500/15 border-emerald-500 text-emerald-300 font-semibold"
                          : "bg-[#101726] border-[#1e293f] text-slate-400 hover:text-white"
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Card</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMethod("netbanking")}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs transition cursor-pointer ${
                        method === "netbanking"
                          ? "bg-emerald-500/15 border-emerald-500 text-emerald-300 font-semibold"
                          : "bg-[#101726] border-[#1e293f] text-slate-400 hover:text-white"
                      }`}
                    >
                      <Building2 className="w-4 h-4" />
                      <span>Net Banking</span>
                    </button>
                  </div>
                </div>

                {/* Method-specific Inputs */}
                {method === "upi" && (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-400">VPA / UPI ID or Mobile Number</label>
                    <input
                      type="text"
                      required
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. username@okaxis or 9876543210@ybl"
                      className="w-full px-3.5 py-2.5 bg-[#0e1524] border border-[#1e2942] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition font-mono"
                    />
                    <p className="text-[11px] text-slate-500">Supports GPay, PhonePe, Paytm, BHIM & all UPI apps.</p>
                  </div>
                )}

                {method === "card" && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Card Number</label>
                      <input
                        type="text"
                        required
                        maxLength={19}
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="4532 •••• •••• 8921"
                        className="w-full px-3.5 py-2.5 bg-[#0e1524] border border-[#1e2942] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Expiry (MM/YY)</label>
                        <input
                          type="text"
                          required
                          maxLength={5}
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="12/28"
                          className="w-full px-3.5 py-2.5 bg-[#0e1524] border border-[#1e2942] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">CVV</label>
                        <input
                          type="password"
                          required
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          placeholder="•••"
                          className="w-full px-3.5 py-2.5 bg-[#0e1524] border border-[#1e2942] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {method === "netbanking" && (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-400">Select Bank</label>
                    <select
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#0e1524] border border-[#1e2942] rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 transition"
                    >
                      <option value="HDFC Bank">HDFC Bank</option>
                      <option value="ICICI Bank">ICICI Bank</option>
                      <option value="State Bank of India">State Bank of India (SBI)</option>
                      <option value="Axis Bank">Axis Bank</option>
                      <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                    </select>
                  </div>
                )}

                {/* Primary Payment Submit */}
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3 px-4 bg-[#00c853] hover:bg-[#00b248] text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-4"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Verifying Transaction...</span>
                    </>
                  ) : (
                    <>
                      <span>Pay ₹{planDetails.priceINR} & Activate Subscription</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-5 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>256-Bit SSL Encrypted Payment Protocol</span>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
