// routes/panicRoutes.js
import express from "express";
import {
  createPanicSession,
  getPanicSessions,
  getPatientSessions,
  getPatientLatestSession,
} from "../controllers/panicController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Patient's own sessions
router.post("/", protect, createPanicSession);
router.get("/", protect, getPanicSessions);

// Therapist / admin — query sessions for a specific patient
router.get("/patient/:patientId", protect, getPatientSessions);
router.get("/patient/:patientId/latest", protect, getPatientLatestSession);

export default router;
