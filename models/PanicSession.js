import mongoose from "mongoose";

const panicSessionSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "patient",
      required: true,
    },
    startedAt: {
      type: Date,
      required: true,
    },
    endedAt: {
      type: Date,
      required: true,
    },
    durationSeconds: {
      type: Number,
      required: true,
    },
    wasInSafeLocation: {
      type: Boolean,
      default: null,
    },
    severityBefore: {
      type: Number,
      min: 1,
      max: 10,
      default: null,
    },
    severityAfter: {
      type: Number,
      min: 1,
      max: 10,
      default: null,
    },
    exercisesCompleted: {
      type: [String],
      enum: ["breathing", "grounding", "muscleRelaxation"],
      default: [],
    },
    contactedSpecialist: {
      type: Boolean,
      default: false,
    },
    requestedVideoSession: {
      type: Boolean,
      default: false,
    },
    calledEmergencyContact: {
      type: Boolean,
      default: false,
    },
    requestedEmergencyServices: {
      type: Boolean,
      default: false,
    },
    emergencyServiceCalled: {
      type: String,
      default: null,
    },
    isAbandoned: {
      type: Boolean,
      default: false,
    },
    abandonedAtStep: {
      type: String,
      enum: [
        "safety",
        "severityBefore",
        "breathing",
        "grounding",
        "muscleRelaxation",
        "reassurance",
        "severityAfter",
        "finalActions",
        null,
      ],
      default: null,
    },
  },
  { timestamps: true, collection: "panic_sessions" },
);

const PanicSession = mongoose.model("PanicSession", panicSessionSchema);

export default PanicSession;
