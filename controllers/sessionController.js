import VideoSession from "../models/VideoSession.js";
import Doctor from "../models/Doctor.js";
import User from "../models/User.js";
import { t, getLang } from "../utils/i18n/index.js";
import { StreamChat } from "stream-chat";

// @desc    Get all sessions for logged in doctor
// @route   GET /api/v1/session/mine
// @access  Private (Doctor)
export const getDoctorSessions = async (req, res) => {
  const lang = getLang(req);
  try {
    const doctorId = req.user._id;
    const sessions = await VideoSession.find({ doctor: doctorId })
      .populate("patient", "fullName phone")
      .sort({ date: 1, time: 1 });

    res.status(200).json({ sessions });
  } catch (error) {
    console.error("Session Controller Error (getDoctorSessions):", error);
    res.status(500).json({ message: t("SERVER_ERROR", lang) });
  }
};

// @desc    Get all sessions for logged in patient
// @route   GET /api/v1/session/my
// @access  Private (Patient)
export const getPatientSessions = async (req, res) => {
  const lang = getLang(req);
  try {
    const patientId = req.user._id;
    const sessions = await VideoSession.find({ patient: patientId })
      .populate("doctor", "fullName phone specializations")
      .sort({ date: 1, time: 1 });

    res.status(200).json({ sessions });
  } catch (error) {
    console.error("Session Controller Error (getPatientSessions):", error);
    res.status(500).json({ message: t("SERVER_ERROR", lang) });
  }
};

// @desc    Get booked sessions for a specific doctor on a specific date
// @route   GET /api/v1/session/doctor/:doctorId/booked?date=YYYY-MM-DD
// @access  Private (Patient)
export const getBookedDoctorSessions = async (req, res) => {
  const lang = getLang(req);
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    // Check if doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor || doctor.role !== "doctor") {
      return res.status(404).json({ message: t("USER_NOT_FOUND", lang) });
    }

    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    const searchDate = new Date(date);
    // Find sessions that are reserved or completed for this doctor on this date
    const sessions = await VideoSession.find({
      doctor: doctorId,
      status: { $in: ["reserved", "completed"] },
      date: searchDate,
    }).select("time status");

    const bookedTimes = sessions.map((s) => s.time);

    res.status(200).json({
      availableTimes: doctor.availableTimes,
      bookedTimes,
    });
  } catch (error) {
    console.error("Session Controller Error (getBookedDoctorSessions):", error);
    res.status(500).json({ message: t("SERVER_ERROR", lang) });
  }
};

// @desc    Patient reserves a session
// @route   POST /api/v1/session/reserve/:doctorId
// @access  Private (Patient)
export const reserveSession = async (req, res) => {
  const lang = getLang(req);
  try {
    const { doctorId } = req.params;
    const { date, time } = req.body;
    const patientId = req.user._id;

    if (!date || !time) {
      return res.status(400).json({ message: "Date and time are required" });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    if (!doctor.availableTimes.includes(time)) {
      return res
        .status(400)
        .json({ message: "This time is not available for this doctor" });
    }

    const searchDate = new Date(date);

    // Check if it's already booked
    const existingSession = await VideoSession.findOne({
      doctor: doctorId,
      date: searchDate,
      time: time,
      status: { $in: ["reserved", "completed"] },
    });

    if (existingSession) {
      return res.status(400).json({ message: "Session is already booked" });
    }

    const session = await VideoSession.create({
      doctor: doctorId,
      patient: patientId,
      date: searchDate,
      time: time,
      status: "pending",
    });

    session.streamCallId = `call_${session._id}`;
    session.streamChannelId = `chat_${session._id}`;
    await session.save();

    // Create the chat channel on the Stream backend to give both users access
    try {
      const serverClient = StreamChat.getInstance(
        process.env.STREAM_API_KEY,
        process.env.STREAM_API_SECRET,
      );
      const channel = serverClient.channel(
        "messaging",
        session.streamChannelId,
        {
          created_by_id: patientId.toString(),
          members: [patientId.toString(), doctorId.toString()],
        },
      );
      await channel.create();
    } catch (streamErr) {
      console.error("Stream channel creation failed:", streamErr);
    }

    res.status(200).json({
      message: "Session reserved successfully",
      session,
    });
  } catch (error) {
    console.error("Session Controller Error (reserveSession):", error);
    res.status(500).json({ message: t("SERVER_ERROR", lang) });
  }
};

// @desc    Doctor accepts a session
// @route   PUT /api/v1/session/:sessionId/accept
// @access  Private (Doctor)
export const acceptSession = async (req, res) => {
  const lang = getLang(req);
  try {
    const { sessionId } = req.params;
    const doctorId = req.user._id;

    const session = await VideoSession.findOne({
      _id: sessionId,
      doctor: doctorId,
    });
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.status !== "pending") {
      return res.status(400).json({ message: "Session is not pending" });
    }

    session.status = "accepted";
    await session.save();

    res.status(200).json({
      message: "Session accepted",
      session,
    });
  } catch (error) {
    console.error("Session Controller Error (acceptSession):", error);
    res.status(500).json({ message: t("SERVER_ERROR", lang) });
  }
};

// @desc    Doctor refuses a session
// @route   PUT /api/v1/session/:sessionId/refuse
// @access  Private (Doctor)
export const refuseSession = async (req, res) => {
  const lang = getLang(req);
  try {
    const { sessionId } = req.params;
    const doctorId = req.user._id;

    const session = await VideoSession.findOne({
      _id: sessionId,
      doctor: doctorId,
    });
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.status !== "pending") {
      return res.status(400).json({ message: "Session is not pending" });
    }

    session.status = "refused";
    await session.save();

    res.status(200).json({
      message: "Session refused",
      session,
    });
  } catch (error) {
    console.error("Session Controller Error (refuseSession):", error);
    res.status(500).json({ message: t("SERVER_ERROR", lang) });
  }
};

// @desc    Doctor marks a session as completed
// @route   PUT /api/v1/session/:sessionId/complete
// @access  Private (Doctor)
export const completeSession = async (req, res) => {
  const lang = getLang(req);
  try {
    const { sessionId } = req.params;
    const doctorId = req.user._id;

    const session = await VideoSession.findOne({
      _id: sessionId,
      doctor: doctorId,
    });
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.status !== "accepted") {
      return res
        .status(400)
        .json({ message: "Only accepted sessions can be marked as completed" });
    }

    session.status = "completed";
    await session.save();

    res.status(200).json({
      message: "Session marked as completed",
      session,
    });
  } catch (error) {
    console.error("Session Controller Error (completeSession):", error);
    res.status(500).json({ message: t("SERVER_ERROR", lang) });
  }
};

// @desc    Doctor cancels an accepted session
// @route   PUT /api/v1/session/:sessionId/cancel
// @access  Private (Doctor)
export const cancelSession = async (req, res) => {
  const lang = getLang(req);
  try {
    const { sessionId } = req.params;
    const doctorId = req.user._id;

    const session = await VideoSession.findOne({
      _id: sessionId,
      doctor: doctorId,
    });
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.status !== "accepted") {
      return res
        .status(400)
        .json({ message: "Only accepted sessions can be cancelled" });
    }

    // Mirror the frontend rule: can't cancel once the scheduled slot has passed.
    const [hours, minutes] = (session.time || "")
      .split(":")
      .map((n) => parseInt(n, 10));
    const sessionDateTime = new Date(session.date);
    if (!Number.isNaN(hours)) {
      sessionDateTime.setHours(hours, minutes || 0, 0, 0);
    }

    if (sessionDateTime.getTime() < Date.now()) {
      return res
        .status(400)
        .json({
          message: "Cannot cancel a session whose time has already passed",
        });
    }

    session.status = "cancelled";
    await session.save();

    res.status(200).json({
      message: "Session cancelled",
      session,
    });
  } catch (error) {
    console.error("Session Controller Error (cancelSession):", error);
    res.status(500).json({ message: t("SERVER_ERROR", lang) });
  }
};
