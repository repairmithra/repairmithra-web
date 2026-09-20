const API_URL = "http://localhost:5000";

export const payVisitFee = async (bookingId, onSuccess, onFailure) => {
  try {
    const token = localStorage.getItem("rm_token");

    if (!token) {
      throw new Error("Please login again");
    }

    // 1. Create Razorpay order from backend
    const response = await fetch(
      `${API_URL}/api/payments/create-order`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingId,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message || "Unable to create payment order"
      );
    }

    const payment = data.payment;

    // 2. Open Razorpay Checkout
    const options = {
      key: payment.razorpayKeyId,
      amount: payment.amount * 100,
      currency: payment.currency,
      name: "RepairMithra",
      description: "Service Visit Fee",
      order_id: payment.gatewayOrderId,

      handler: async function (razorpayResponse) {
        try {
          // 3. Verify payment on backend
          const verifyResponse = await fetch(
            `${API_URL}/api/payments/verify`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                bookingId,
                razorpay_order_id:
                  razorpayResponse.razorpay_order_id,
                razorpay_payment_id:
                  razorpayResponse.razorpay_payment_id,
                razorpay_signature:
                  razorpayResponse.razorpay_signature,
              }),
            }
          );

          const verifyData = await verifyResponse.json();

          if (!verifyResponse.ok || !verifyData.success) {
            throw new Error(
              verifyData.message || "Payment verification failed"
            );
          }

          onSuccess?.(verifyData);
        } catch (error) {
          console.error("Payment verification error:", error);
          onFailure?.(error);
        }
      },

      modal: {
        ondismiss: function () {
          onFailure?.(
            new Error("Payment window was closed")
          );
        },
      },

      theme: {
        color: "#2563eb",
      },
    };

    if (!window.Razorpay) {
      throw new Error(
        "Razorpay Checkout script is not loaded"
      );
    }

    const razorpay = new window.Razorpay(options);

    razorpay.on("payment.failed", function (response) {
      console.error(
        "Razorpay payment failed:",
        response.error
      );

      onFailure?.(
        new Error(
          response.error?.description ||
            "Payment failed"
        )
      );
    });

    razorpay.open();
  } catch (error) {
    console.error("Payment error:", error);
    onFailure?.(error);
  }
};