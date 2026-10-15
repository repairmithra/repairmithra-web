import { getStoredUser } from "../../utils/auth";
import { PaymentError } from "../../utils/payment";
import { createSubscriptionOrder, verifySubscriptionPayment } from "./partnerApi";

// ---------------------------------------------------------------------------
// Razorpay checkout for a partner subscription.
//
//   const { data } = await paySubscription("three", [idA, idB, idC]);
//
// Same flow as the customer visit-fee payment:
//   1. POST /api/partner/subscription/order   → server prices the plan
//   2. Razorpay checkout opens
//   3. POST /api/partner/subscription/verify  → server checks the signature
//      and activates the plan
//
// Rejects with a PaymentError (code: cancelled | failed | verification | setup).
// ---------------------------------------------------------------------------
export async function paySubscription(plan, serviceIds) {
  let payment;

  try {
    ({ payment } = await createSubscriptionOrder(plan, serviceIds));
  } catch (error) {
    if (error.status === 401) throw error;
    throw new PaymentError(error.message, "setup");
  }

  if (typeof window === "undefined" || !window.Razorpay) {
    throw new PaymentError(
      "The payment service could not be loaded. Please refresh the page and try again.",
      "setup"
    );
  }

  const user = getStoredUser();

  return new Promise((resolve, reject) => {
    let finished = false;
    let lastFailure = "";

    const checkout = new window.Razorpay({
      key: payment.razorpayKeyId,
      amount: Math.round(payment.amount * 100),
      currency: payment.currency,
      order_id: payment.gatewayOrderId,
      name: "RepairMithra",
      description: `Partner subscription - ${payment.planName} (monthly)`,
      prefill: {
        name: user?.fullName || "",
        email: user?.email || "",
        contact: user?.phone || "",
      },
      theme: { color: "#059669" },

      handler: async (response) => {
        finished = true;
        try {
          resolve(
            await verifySubscriptionPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
          );
        } catch (error) {
          reject(
            new PaymentError(error.message || "Payment verification failed.", "verification")
          );
        }
      },

      modal: {
        ondismiss: () => {
          if (finished) return;
          finished = true;
          reject(
            lastFailure
              ? new PaymentError(lastFailure, "failed")
              : new PaymentError("Payment window was closed.", "cancelled")
          );
        },
      },
    });

    checkout.on("payment.failed", (r) => {
      lastFailure = r?.error?.description || "The payment could not be completed.";
    });

    checkout.open();
  });
}