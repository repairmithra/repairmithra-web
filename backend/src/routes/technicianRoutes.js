import express from "express";

import {
  findNearbyTechnicians,
} from "../controllers/technicianController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
  "/nearby",
  authMiddleware,
  findNearbyTechnicians
);

export default router;