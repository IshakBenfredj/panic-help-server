import mongoose from "mongoose";

const thoughtSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true },
);

// Index for fast patient queries
thoughtSchema.index({ patient: 1, createdAt: -1 });

const Thought = mongoose.model("Thought", thoughtSchema);

export default Thought;
