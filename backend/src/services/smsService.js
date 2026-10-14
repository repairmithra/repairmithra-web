import "dotenv/config";

// ======================================================
// SMS OTP via 2Factor.in
//
// Uses the API key from SMS_API_KEY in .env.
// Endpoint format:
//   GET https://2factor.in/API/V1/<API_KEY>/SMS/<PHONE>/<OTP>[/<TEMPLATE>]
// Success reply: { "Status": "Success", "Details": "<session id>" }
//
// Optional .env settings:
//   SMS_TEMPLATE_NAME  - approved DLT template name in your 2Factor panel
// ======================================================

const BASE_URL = "https://2factor.in/API/V1";

export const sendOtpSms = async (phone, otp) => {
  const apiKey = process.env.SMS_API_KEY;

  if (!apiKey) {
    throw new Error("SMS_API_KEY is not set in the backend .env file");
  }

  const parts = [BASE_URL, apiKey, "SMS", encodeURIComponent(phone), encodeURIComponent(otp)];

  if (process.env.SMS_TEMPLATE_NAME) {
    parts.push(encodeURIComponent(process.env.SMS_TEMPLATE_NAME));
  }

  const response = await fetch(parts.join("/"), { method: "GET" });

  let data = null;

  try {
    data = await response.json();
  } catch {
    /* non-JSON reply */
  }

  if (!response.ok || data?.Status !== "Success") {
    console.error("SMS provider error:", response.status, data);
    throw new Error(data?.Details || "Failed to send SMS");
  }

  return data;
};
