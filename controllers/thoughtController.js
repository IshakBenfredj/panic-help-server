import Thought from "../models/Thought.js";
import { t, getLang } from "../utils/i18n/index.js";

// Create new thought
export const createThought = async (req, res) => {
  const lang = getLang(req);
  try {
    const { title, content } = req.body;
    const patientId = req.user._id;

    if (!content?.trim()) {
      return res.status(400).json({
        message: t("CONTENT_REQUIRED", lang) || "Content is required",
      });
    }

    const thought = await Thought.create({
      patient: patientId,
      title: title?.trim() || undefined,
      content: content.trim(),
    });

    res.status(201).json({
      message: t("THOUGHT_CREATED", lang) || "Thought saved successfully",
      thought,
    });
  } catch (error) {
    console.error("Create Thought Error:", error);
    res.status(500).json({
      message: t("SERVER_ERROR", lang) || "Server error",
    });
  }
};

// Get all thoughts for current patient
export const getMyThoughts = async (req, res) => {
  const lang = getLang(req);
  try {
    const patientId = req.user._id;

    const thoughts = await Thought.find({ patient: patientId })
      .sort({ createdAt: -1 })
      .select("title content createdAt updatedAt");

    res.status(200).json({
      thoughts,
      count: thoughts.length,
    });
  } catch (error) {
    console.error("Get Thoughts Error:", error);
    res.status(500).json({
      message: t("SERVER_ERROR", lang),
    });
  }
};

// Get single thought
export const getThoughtById = async (req, res) => {
  const lang = getLang(req);
  try {
    const thought = await Thought.findOne({
      _id: req.params.id,
      patient: req.user._id,
    });

    if (!thought) {
      return res.status(404).json({
        message: t("THOUGHT_NOT_FOUND", lang) || "Thought not found",
      });
    }

    res.status(200).json({ thought });
  } catch (error) {
    res.status(500).json({ message: t("SERVER_ERROR", lang) });
  }
};

// Update thought
export const updateThought = async (req, res) => {
  const lang = getLang(req);
  try {
    const { title, content } = req.body;

    const thought = await Thought.findOneAndUpdate(
      { _id: req.params.id, patient: req.user._id },
      {
        title: title?.trim() || undefined,
        content: content?.trim(),
      },
      { new: true, runValidators: true },
    );

    if (!thought) {
      return res.status(404).json({
        message: t("THOUGHT_NOT_FOUND", lang),
      });
    }

    res.status(200).json({
      message: t("THOUGHT_UPDATED", lang) || "Thought updated successfully",
      thought,
    });
  } catch (error) {
    res.status(500).json({ message: t("SERVER_ERROR", lang) });
  }
};

// Delete thought
export const deleteThought = async (req, res) => {
  const lang = getLang(req);
  try {
    const thought = await Thought.findOneAndDelete({
      _id: req.params.id,
      patient: req.user._id,
    });

    if (!thought) {
      return res.status(404).json({
        message: t("THOUGHT_NOT_FOUND", lang),
      });
    }

    res.status(200).json({
      message: t("THOUGHT_DELETED", lang) || "Thought deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: t("SERVER_ERROR", lang) });
  }
};
