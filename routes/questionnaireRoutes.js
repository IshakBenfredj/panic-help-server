import express from "express";
import {
  submitQuestionnaire,
  getQuestionnaire,
} from "../controllers/questionnaireController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/", protect, submitQuestionnaire);
router.get("/", protect, getQuestionnaire);

export default router;
