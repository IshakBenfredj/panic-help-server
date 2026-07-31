import express from "express";
import { getStreamToken, syncAllUsersToStream } from "../controllers/streamController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/token", protect, getStreamToken);
router.post("/sync-users", protect, syncAllUsersToStream);

export default router;
