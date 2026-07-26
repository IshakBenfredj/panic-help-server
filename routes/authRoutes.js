import express from "express";
import { registerPatient, registerDoctor, login, getMe } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/register/patient", registerPatient);
router.post("/register/doctor", registerDoctor);
router.post("/login", login);
router.get("/me", protect, getMe);

export default router;

