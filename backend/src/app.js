import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import technicianRoutes from "./routes/technicianRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


// Health Check Route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "RepairMithra Backend API is Running 🚀",
  });
});

// Auth Routes
app.use("/api/auth", authRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/technicians", technicianRoutes);
app.use("/api/payments", paymentRoutes);

export default app;