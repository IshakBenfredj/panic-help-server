// routes/doctorRoutes.js
import express from "express";
import {
  updateDoctorProfile,
  getDoctorProfile,
  getAllDoctors,
  getPatientInfoForDoctor,
} from "../controllers/doctorController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Public listing for patients
router.get("/", protect, authorize("patient"), getAllDoctors);

router.get("/profile", protect, getDoctorProfile);
router.put("/profile", protect, updateDoctorProfile);

// Get specific patient info for doctor
router.get("/patient/:patientId", protect, authorize("doctor"), getPatientInfoForDoctor);

export default router;
