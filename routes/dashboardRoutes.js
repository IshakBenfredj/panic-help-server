import express from "express";
import {
  getDashboardStats,
  getAllPatients,
  getPatientDetails,
  getPatientMoods,
  getPatientAssessments,
  getPatientQuestionnaire,
  getAllPanicSessions,
  getAllDoctors,
  getDoctorDetails,
  getAllAssessments,
  getAllMoods,
} from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/stats", getDashboardStats);
router.get("/panic-sessions", getAllPanicSessions);
router.get("/doctors", getAllDoctors);
router.get("/doctors/:id", getDoctorDetails);
router.get("/assessments", getAllAssessments);
router.get("/moods", getAllMoods);
router.get("/patients", getAllPatients);
router.get("/patients/:id", getPatientDetails);
router.get("/patients/:id/moods", getPatientMoods);
router.get("/patients/:id/assessments", getPatientAssessments);
router.get("/patients/:id/questionnaire", getPatientQuestionnaire);

export default router;




