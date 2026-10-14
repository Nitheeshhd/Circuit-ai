import { SubscriptionTier, FeatureKey } from "../types";

export const FREE_PROMPT_MAX_CHARS = Infinity;
export const UNLIMITED_PROMPT_MAX_CHARS = Infinity;
export const MAX_MONTHLY_PROJECTS = 9;

const ALL_FEATURES: FeatureKey[] = [
  "basicGeneration",
  "unlimitedPrompt",
  "firmware",
  "pinout",
  "viva",
  "diagnostics",
  "priorityStreaming",
  "cloudSync",
];

export const FEATURE_ENTITLEMENTS: Record<SubscriptionTier, FeatureKey[]> = {
  free: ALL_FEATURES,
  student: ALL_FEATURES,
  pro: ALL_FEATURES,
};

/**
 * Resolves effective tier - Everything is 100% Free for 9 monthly projects
 */
export function getEffectiveTier(
  _tier?: SubscriptionTier | null,
  _expiresAt?: number | null
): SubscriptionTier {
  return "pro";
}

/**
 * Central entitlement check for UI components & backend logic - All features unlocked
 */
export function hasFeatureAccess(
  _tier?: SubscriptionTier | null,
  _feature?: FeatureKey,
  _expiresAt?: number | null
): boolean {
  return true;
}

/**
 * Resolves maximum prompt length - Unlimited for all users (No length limitation)
 */
export function getPromptLimit(
  _tier?: SubscriptionTier | null,
  _expiresAt?: number | null
): number {
  return Infinity;
}

/**
 * Helper to generate storage key for current calendar month's usage
 */
export function getMonthlyQuotaKey(userId?: string): string {
  const d = new Date();
  const yearMonth = `${d.getFullYear()}_${String(d.getMonth() + 1).padStart(2, "0")}`;
  const uid = userId || "guest";
  return `circuito_monthly_projects_${uid}_${yearMonth}`;
}

/**
 * Gets number of projects generated this month for a single account / user
 */
export function getMonthlyUsage(userId?: string): number {
  try {
    const key = getMonthlyQuotaKey(userId);
    const val = localStorage.getItem(key);
    if (val) {
      const parsed = parseInt(val, 10);
      if (!isNaN(parsed) && parsed >= 0) return parsed;
    }
  } catch { }
  return 0;
}

/**
 * Increments monthly project generation counter when a project is successfully generated
 */
export function incrementMonthlyUsage(userId?: string): number {
  try {
    const current = getMonthlyUsage(userId);
    const next = current + 1;
    const key = getMonthlyQuotaKey(userId);
    localStorage.setItem(key, String(next));
    return next;
  } catch {
    return 1;
  }
}

/**
 * Checks if user still has remaining generation quota for current month
 */
export function hasRemainingMonthlyQuota(userId?: string): boolean {
  return getMonthlyUsage(userId) < MAX_MONTHLY_PROJECTS;
}

/**
 * Returns detailed monthly quota summary info
 */
export function getMonthlyQuotaInfo(userId?: string) {
  const used = getMonthlyUsage(userId);
  const remaining = Math.max(0, MAX_MONTHLY_PROJECTS - used);

  // Calculate first day of next month
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const resetDateStr = nextMonth.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return {
    used,
    max: MAX_MONTHLY_PROJECTS,
    remaining,
    resetDate: resetDateStr,
    isQuotaExceeded: used >= MAX_MONTHLY_PROJECTS,
  };
}

