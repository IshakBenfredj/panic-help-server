// routes/patientRoutes.js
import express from "express";
import {
  updatePatientProfile,
  getPatientProfile,
  checkPatientAnswerQuestionnaire,
} from "../controllers/patientController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/profile", protect, getPatientProfile);
router.put("/profile", protect, updatePatientProfile);
router.get("/check-questionnaire", protect, checkPatientAnswerQuestionnaire);

export default router;
