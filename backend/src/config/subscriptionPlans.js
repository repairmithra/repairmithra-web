// ======================================================
// Partner subscription plans (single source of truth).
// Prices are decided HERE on the server; the client never sends an amount.
//
// serviceLimit: number of services the partner may pick, or null = every service.
// ======================================================

export const SUBSCRIPTION_DURATION_DAYS = 30;

export const SUBSCRIPTION_PLANS = [
  { key: "single", name: "Single Service", serviceLimit: 1, price: 100 },
  { key: "two", name: "2 Services", serviceLimit: 2, price: 150 },
  { key: "three", name: "3 Services", serviceLimit: 3, price: 200 },
  { key: "four", name: "4 Services", serviceLimit: 4, price: 225 },
  { key: "five", name: "5 Services", serviceLimit: 5, price: 250 },
  { key: "all", name: "All Services", serviceLimit: null, price: 500 },
];

export const PLAN_KEYS = SUBSCRIPTION_PLANS.map((p) => p.key);

export const getPlan = (key) =>
  typeof key === "string" ? SUBSCRIPTION_PLANS.find((p) => p.key === key) : undefined;