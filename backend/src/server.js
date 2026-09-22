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

console.log(
  "JWT_SECRET loaded:",
  Boolean(process.env.JWT_SECRET)
);

connectDB();

// NOTE: this used to call app.listen() twice (one nested inside the other,
// a leftover from a merge), i.e. it tried to open the same port two times.
// One call is all that is needed.
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});