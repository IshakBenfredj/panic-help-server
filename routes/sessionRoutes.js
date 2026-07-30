import express from "express";
import {
  getDoctorSessions,
  getBookedDoctorSessions,
  reserveSession,
  acceptSession,
  refuseSession,
  completeSession,
  cancelSession,
  getPatientSessions,
  cancelPendingSessionPatient,
  getDoctorUpcomingAndPendingSessions,
  getPatientUpcomingAndPendingSessions,
} from "../controllers/sessionController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Doctor routes
router.get("/mine", protect, authorize("doctor"), getDoctorSessions);
router.get(
  "/mine/upcoming-and-pending",
  protect,
  authorize("doctor"),
  getDoctorUpcomingAndPendingSessions,
);
router.put("/:sessionId/accept", protect, authorize("doctor"), acceptSession);
router.put("/:sessionId/refuse", protect, authorize("doctor"), refuseSession);
router.put(
  "/:sessionId/complete",
  protect,
  authorize("doctor"),
  completeSession,
);
router.put("/:sessionId/cancel", protect, authorize("doctor"), cancelSession);

// Patient routes
router.get("/my", protect, authorize("patient"), getPatientSessions);
router.get(
  "/my/upcoming-and-pending",
  protect,
  authorize("patient"),
  getPatientUpcomingAndPendingSessions,
);
router.get(
  "/doctor/:doctorId/booked",
  protect,
  authorize("patient"),
  getBookedDoctorSessions,
);
router.post(
  "/reserve/:doctorId",
  protect,
  authorize("patient"),
  reserveSession,
);
router.put(
  "/:sessionId/patient-cancel",
  protect,
  authorize("patient"),
  cancelPendingSessionPatient,
);

export default router;
