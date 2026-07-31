import mongoose from "mongoose";

const videoSessionSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String, // e.g., "10:00"
      required: true,
      trim: true,
    },
    endTime: {
      type: String, // e.g., "11:00"
      default: null,
    },
    price: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "payment_pending", "accepted", "refused", "completed", "cancelled"],
      default: "pending",
    },
    streamCallId: {
      type: String,
      default: null,
    },
    streamChannelId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const VideoSession = mongoose.model("VideoSession", videoSessionSchema);

export default VideoSession;
