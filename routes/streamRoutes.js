import express from "express";
import { getStreamToken } from "../controllers/streamController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/token", protect, getStreamToken);

export default router;
