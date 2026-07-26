import express from "express";
import { protect } from "../middleware/auth.js"; // assuming you have this
import {
  saveAssessment,
  getAssessments,
  getLatestAssessment,
} from "../controllers/assessmentController.js";

const router = express.Router();

router.get("/", protect, getAssessments);

router.post("/:type", protect, saveAssessment);

router.get("/latest/:type", protect, getLatestAssessment);

export default router;
