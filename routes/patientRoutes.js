// routes/patientRoutes.js
import express from "express";
import {
  updatePatientProfile,
  getPatientProfile,
} from "../controllers/patientController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/profile", protect, getPatientProfile);
router.put("/profile", protect, updatePatientProfile);

export default router;
