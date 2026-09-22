import { apiFetch } from "./api";
import { getStoredUser } from "./auth";

// ---------------------------------------------------------------------------
// Razorpay checkout for the visit fee.
//
//   const result = await payVisitFee(bookingId);
//
// Flow:
//   1. POST /api/payments/create-order   → backend creates a Razorpay order
//                                          (amount is decided by the SERVER)
//   2. Razorpay's checkout window opens  → customer picks UPI / card / etc.
//   3. POST /api/payments/verify         → backend checks Razorpay's signature
//                                          and marks the booking as paid
//
// The Razorpay script is loaded in index.html (window.Razorpay).
//
// Rejects with a PaymentError whose `code` is:
//   "cancelled"    – customer closed the window without paying
//   "failed"       – the payment was declined / failed
//   "verification" – money may have been taken, but we could not confirm it
//   "setup"        – could not start the payment at all
// ---------------------------------------------------------------------------

export class PaymentError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "PaymentError";
    this.code = code;
  }
}

export async function payVisitFee(bookingId) {
  // 1. Ask the backend for a Razorpay order
  let payment;

  try {
    ({ payment } = await apiFetch("/api/payments/create-order", {
      method: "POST",
      auth: true,
      body: { bookingId },
    }));
  } catch (error) {
    // Keep 401s as they are, so the page can send the user to log in again
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

  // 2. Open Razorpay checkout
  return new Promise((resolve, reject) => {
    let finished = false;
    let lastFailure = "";

    const options = {
      key: payment.razorpayKeyId,
      amount: Math.round(payment.amount * 100), // paise
      currency: payment.currency,
      order_id: payment.gatewayOrderId,
      name: "RepairMithra",
      description: "Service visit fee",

      prefill: {
        name: user?.fullName || "",
        email: user?.email || "",
        contact: user?.phone || "",
      },

      theme: { color: "#2563eb" },

      // Called by Razorpay after a successful payment
      handler: async (razorpayResponse) => {
        finished = true;

        // 3. Verify the payment on the backend
        try {
          const verified = await apiFetch("/api/payments/verify", {
            method: "POST",
            auth: true,
            body: {
              bookingId,
              razorpay_order_id: razorpayResponse.razorpay_order_id,
              razorpay_payment_id: razorpayResponse.razorpay_payment_id,
              razorpay_signature: razorpayResponse.razorpay_signature,
            },
          });

          resolve(verified);
        } catch (error) {
          reject(
            new PaymentError(
              error.message || "Payment verification failed.",
              "verification"
            )
          );
        }
      },

      modal: {
        // Customer closed the checkout window
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
    };

    const checkout = new window.Razorpay(options);

    // Razorpay lets the customer retry inside its window after a failure, so
    // we only remember the reason and report it if they give up and close it.
    checkout.on("payment.failed", (response) => {
      lastFailure =
        response?.error?.description || "The payment could not be completed.";
    });

    checkout.open();
  });
}