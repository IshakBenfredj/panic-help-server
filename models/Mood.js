import mongoose from "mongoose";

const MoodSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "patient",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    mood: {
      type: String,
      enum: ["veryHappy", "happy", "neutral", "anxious", "panic"],
      required: true,
    },
  },
  { timestamps: true },
);

const Mood = mongoose.model("Mood", MoodSchema);

export default Mood;
