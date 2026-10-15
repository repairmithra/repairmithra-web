import { getPlan } from "../config/subscriptionPlans.js";

const idString = (v) => String(v?._id ?? v);

export const isSubscriptionActive = (technician) => {
  const sub = technician?.subscription;
  return Boolean(
    sub?.plan && sub?.expiresAt && new Date(sub.expiresAt).getTime() > Date.now()
  );
};

// Can this partner ACCEPT a booking for `serviceId`?
// (Receiving the notification is never restricted - only accepting is.)
// Returns { allowed: true } or { allowed: false, code, message }.
export const checkAcceptAccess = (technician, serviceId) => {
  if (!isSubscriptionActive(technician)) {
    return {
      allowed: false,
      code: "SUBSCRIPTION_REQUIRED",
      message:
        "Your subscription is not active. Subscribe to a plan to accept service requests.",
    };
  }

  const sub = technician.subscription;

  if (sub.plan === "all") return { allowed: true };

  const covered = (sub.services || []).some((s) => idString(s) === idString(serviceId));

  if (!covered) {
    return {
      allowed: false,
      code: "SERVICE_NOT_IN_PLAN",
      message:
        "This service is not included in your plan. Upgrade your subscription to accept it.",
    };
  }

  return { allowed: true };
};

// Client-friendly view of a partner's subscription.
// Expects `subscription.services` to be populated (name + slug) when available.
export const serializeSubscription = (technician) => {
  const sub = technician?.subscription;

  if (!sub?.plan) {
    return { status: "none", active: false };
  }

  const plan = getPlan(sub.plan);
  const active = isSubscriptionActive(technician);
  const msLeft = sub.expiresAt ? new Date(sub.expiresAt).getTime() - Date.now() : 0;

  return {
    status: active ? "active" : "expired",
    active,
    plan: sub.plan,
    planName: plan?.name || sub.plan,
    serviceLimit: plan ? plan.serviceLimit : null,
    amount: sub.amount,
    startedAt: sub.startedAt,
    expiresAt: sub.expiresAt,
    daysLeft: active ? Math.max(1, Math.ceil(msLeft / 86_400_000)) : 0,
    services: (sub.services || []).map((s) =>
      typeof s === "object" && s?.name
        ? { _id: s._id, name: s.name, slug: s.slug }
        : { _id: s }
    ),
  };
};