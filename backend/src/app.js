import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { allowedOrigins } from "./config/cors.js";
import authRoutes from "./routes/authRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import technicianRoutes from "./routes/technicianRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import logger from "./utils/logger.js";

const app = express();

const isAllowedOrigin = (origin) => {
  if (!origin) return true;

  return (
    allowedOrigins.includes(origin) ||
    /^https?:\/\/localhost(?::\d+)?$/.test(origin) ||
    /^https?:\/\/127\.0\.0\.1(?::\d+)?$/.test(origin)
  );
};

app.disable("x-powered-by");

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed by CORS"));
    },
    credentials: false,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", "https://checkout.razorpay.com"],
        scriptSrc: ["'self'", "https://checkout.razorpay.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "https:"],
        frameSrc: ["'self'", "https://checkout.razorpay.com"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
  })
);
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "RepairMithra Backend API is Running 🚀",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/technicians", technicianRoutes);
app.use("/api/payments", paymentRoutes);

app.use((error, req, res, next) => {
  if (error && error.status === 400 && error.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Invalid request payload",
    });
  }

  logger.error("request_unexpected_error", {
    method: req.method,
    path: req.originalUrl,
    error: error?.message,
  });

  if (res.headersSent) {
    return next(error);
  }

  return res.status(500).json({
    success: false,
    message: "Something went wrong",
  });
});

export default app;