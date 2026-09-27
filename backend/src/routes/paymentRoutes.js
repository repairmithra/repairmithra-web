import express from "express";

import {
  createPaymentOrder,
  verifyPayment,
} from "../controllers/paymentController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

router.post(
  "/create-order",
  authMiddleware,
  requireRole("customer"),
  createPaymentOrder
);

router.post(
  "/verify",
  authMiddleware,
  requireRole("customer"),
  verifyPayment
);

export default router;