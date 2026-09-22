export const PLANS = ["starter", "pro", "elite"] as const;
export type Plan = (typeof PLANS)[number];

export const isPlan = (value: unknown): value is Plan =>
  value === "starter" || value === "pro" || value === "elite";
