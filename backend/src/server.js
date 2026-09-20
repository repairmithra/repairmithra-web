import "dotenv/config";

import app from "./app.js";
import connectDB from "./config/db.js";

const PORT = process.env.PORT || 5000;

console.log(
  "RESEND_API_KEY loaded:",
  Boolean(process.env.RESEND_API_KEY)
);

console.log(
  "RAZORPAY_KEY_ID loaded:",
  Boolean(process.env.RAZORPAY_KEY_ID)
);

console.log(
  "RAZORPAY_KEY_SECRET loaded:",
  Boolean(process.env.RAZORPAY_KEY_SECRET)
);

connectDB();

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});