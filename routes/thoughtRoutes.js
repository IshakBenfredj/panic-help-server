import express from "express";
import {
  createThought,
  getMyThoughts,
  getThoughtById,
  updateThought,
  deleteThought,
} from "../controllers/thoughtController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/create", protect, createThought);
router.get("/my-thoughts", protect, getMyThoughts);
router.get("/:id", protect, getThoughtById);
router.put("/:id", protect, updateThought);
router.delete("/:id", protect, deleteThought);

export default router;
