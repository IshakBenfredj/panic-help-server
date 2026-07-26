// models/Questionnaire.js
import mongoose from "mongoose";

const questionnaireSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    diagnosedBefore: {
      type: String,
      enum: ["yes", "no"],
      required: true,
    },
    panicFrequency: {
      type: String,
      enum: [
        "several_per_week",
        "about_once_week",
        "several_per_month",
        "rarely",
        "not_sure",
      ],
      required: true,
    },
    anxietyImpact: {
      type: String,
      enum: ["very_low", "low", "moderate", "high", "very_high"],
      required: true,
    },
    currentlyFollowedBy: {
      type: String,
      enum: ["psychologist", "psychiatrist", "therapist", "multiple", "none"],
      required: true,
    },
    onTreatment: {
      type: String,
      enum: ["yes", "no"],
      required: true,
    },
    mainGoals: {
      type: [String],
      enum: [
        "manage_panic_attacks",
        "reduce_daily_anxiety",
        "understand_better",
        "overcome_fears",
        "prevent_relapse",
        "complement_therapy",
        "improve_mental_health",
        "other",
      ],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "At least one goal is required",
      },
    },
    dailyTimeCommitment: {
      type: String,
      enum: ["5min", "10min", "15min", "20min", "30min_plus"],
      required: true,
    },
  },
  { timestamps: true },
);

const Questionnaire = mongoose.model("Questionnaire", questionnaireSchema);

export default Questionnaire;
