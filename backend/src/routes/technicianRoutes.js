import express from "express";

import {
  findNearbyTechnicians,
} from "../controllers/technicianController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

router.get(
  "/nearby",
  authMiddleware,
  requireRole("customer"),
  findNearbyTechnicians
);

export default router;