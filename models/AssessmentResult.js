import mongoose from "mongoose";

const assessmentResultSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "patient",
      required: true,
    },
    type: {
      type: String,
      enum: ["gad7", "phq9", "panic-phq", "panic-beliefs", "questionnaire"],
      required: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    totalScore: {
      type: Number,
      default: null,
    },

    severity: {
      type: String,
      enum: [
        "minimal",
        "mild",
        "moderate",
        "moderately_severe",
        "severe",
        "likely_panic",
        "unlikely_panic",
      ],
      default: null,
    },

    completedAt: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

assessmentResultSchema.index({ user: 1, type: 1, completedAt: -1 });

const AssessmentResult = mongoose.model(
  "AssessmentResult",
  assessmentResultSchema,
);

export default AssessmentResult;
