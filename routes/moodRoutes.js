// routes/moodRoutes.js
import express from "express";
import {
  recordMood,
  getMoodHistory,
  getPatientTodayMood,
} from "../controllers/moodController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/", protect, recordMood);
router.get("/", protect, getMoodHistory);
router.get("/today", protect, getPatientTodayMood);

export default router;
