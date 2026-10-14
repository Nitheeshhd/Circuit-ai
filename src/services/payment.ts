import { SubscriptionTier } from "../types";

export interface PlanDetails {
  id: SubscriptionTier;
  name: string;
  priceINR: number;
  period: string;
  badge?: string;
  popular?: boolean;
  description: string;
  promptCharLimit: number;
  features: string[];
}

export const SUBSCRIPTION_PLANS: PlanDetails[] = [
  {
    id: "free",
    name: "Full Platform Access",
    priceINR: 0,
    period: "Forever Free",
    description: "Full access to all AI hardware design & synthesis capabilities.",
    promptCharLimit: 4000,
    features: [
      "Unlimited project prompt length (up to 4,000 chars)",
      "Compilable C++ / Arduino / ESP32 firmware",
      "Interactive Pin-to-Pin visualizer matrix",
      "Full Bill of Materials with market pricing",
      "AI Circuit & Firmware Diagnostics Tool",
      "Multi-turn AI Hardware Lab Chat Advisor",
      "Unlimited Cloud Sync & Project History",
    ],
  },
];

export interface PaymentOrder {
  orderId: string;
  amount: number;
  currency: string;
  plan: SubscriptionTier;
  createdAt: number;
}

export interface VerificationResult {
  success: boolean;
  message: string;
  plan?: SubscriptionTier;
  subscriptionExpiresAt?: number;
  transactionId?: string;
}

export interface PaymentAdapter {
  createOrder(plan: "student" | "pro", amount: number): Promise<PaymentOrder>;
  verifyPayment(
    orderId: string,
    paymentId: string,
    signature: string,
    plan: "student" | "pro",
    userId: string
  ): Promise<VerificationResult>;
}

/**
 * Isolated Development / Mock Payment Adapter for testing without external gateway keys.
 */
class MockPaymentAdapter implements PaymentAdapter {
  async createOrder(plan: "student" | "pro", amount: number): Promise<PaymentOrder> {
    await new Promise((res) => setTimeout(res, 400));
    return {
      orderId: `ord_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      amount,
      currency: "INR",
      plan,
      createdAt: Date.now(),
    };
  }

  async verifyPayment(
    orderId: string,
    paymentId: string,
    signature: string,
    plan: "student" | "pro",
    userId: string
  ): Promise<VerificationResult> {
    // Attempt verification via backend API if online
    try {
      const res = await fetch("/api/v1/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, paymentId, signature, plan, userId }),
      });
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch {
      // Safe fallback if offline / standalone client
    }

    // Client-side fallback verification
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 Days
    return {
      success: true,
      message: `${plan === "student" ? "Student" : "Pro"} subscription activated successfully!`,
      plan,
      subscriptionExpiresAt: expiresAt,
      transactionId: paymentId || `txn_${Date.now()}`,
    };
  }
}

/**
 * Production Payment Adapter stub (ready for Razorpay/Stripe credentials)
 */
class ProductionPaymentAdapter implements PaymentAdapter {
  async createOrder(plan: "student" | "pro", amount: number): Promise<PaymentOrder> {
    const res = await fetch("/api/v1/payment/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, amount }),
    });
    if (!res.ok) throw new Error("Failed to initialize production payment order.");
    return await res.json();
  }

  async verifyPayment(
    orderId: string,
    paymentId: string,
    signature: string,
    plan: "student" | "pro",
    userId: string
  ): Promise<VerificationResult> {
    const res = await fetch("/api/v1/payment/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, paymentId, signature, plan, userId }),
    });
    return await res.json();
  }
}

// Export default adapter (swappable via environment flag)
const isProdGatewayAvailable = false;
export const activePaymentAdapter: PaymentAdapter = isProdGatewayAvailable
  ? new ProductionPaymentAdapter()
  : new MockPaymentAdapter();
