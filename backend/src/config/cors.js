const envOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const allowedOrigins = [
  ...new Set([
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://repairmithra.netlify.app",
    "https://www.repairmithra.netlify.app",
    ...envOrigins,
  ]),
];
