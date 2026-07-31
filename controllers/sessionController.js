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
      .populate("patient", "fullName")
      .sort({ createdAt: -1 });

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
      .sort({ createdAt: -1 });

    res.status(200).json({ sessions });
  } catch (error) {
    console.error("Session Controller Error (getPatientSessions):", error);
    res.status(500).json({ message: t("SERVER_ERROR", lang) });
  }
};

// @desc    Get a single session by ID
// @route   GET /api/v1/session/:sessionId
// @access  Private
export const getSession = async (req, res) => {
  const lang = getLang(req);
  try {
    const { sessionId } = req.params;
    const session = await VideoSession.findById(sessionId)
      .populate("doctor", "fullName phone specializations")
      .populate("patient", "fullName phone");

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.status(200).json({ session });
  } catch (error) {
    console.error("Session Controller Error (getSession):", error);
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

    // Always use the deterministic direct channel ID between this patient and doctor
    const channelId = `direct_${patientId}_${doctorId}`;
    session.streamChannelId = channelId;
    session.streamCallId = `call_${session._id}`;
    await session.save();

    // Ensure the Stream chat channel exists on Stream backend
    try {
      const serverClient = StreamChat.getInstance(
        process.env.STREAM_API_KEY,
        process.env.STREAM_API_SECRET,
      );
      const channel = serverClient.channel("messaging", channelId, {
        created_by_id: patientId.toString(),
        members: [patientId.toString(), doctorId.toString()],
      });
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
    const { price, endTime } = req.body;
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

    session.price = price !== undefined ? Number(price) : null;
    session.endTime = endTime || null;

    if (session.price === 0) {
      session.status = "accepted";
    } else {
      session.status = "payment_pending";
    }

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

// @desc    Doctor updates the price of a payment_pending session
// @route   PUT /api/v1/session/:sessionId/price
// @access  Private (Doctor)
export const updateSessionPrice = async (req, res) => {
  const lang = getLang(req);
  try {
    const { sessionId } = req.params;
    const { price } = req.body;
    const doctorId = req.user._id;

    const session = await VideoSession.findOne({
      _id: sessionId,
      doctor: doctorId,
    });
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.status !== "payment_pending") {
      return res.status(400).json({ message: "Session is not payment pending" });
    }

    session.price = Number(price);
    
    if (session.price === 0) {
      session.status = "accepted";
    }

    await session.save();

    res.status(200).json({
      message: "Session price updated",
      session,
    });
  } catch (error) {
    console.error("Session Controller Error (updateSessionPrice):", error);
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
      return res.status(400).json({
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

// @desc    Patient cancels a pending session before doctor confirmation
// @route   PUT /api/v1/session/:sessionId/patient-cancel
// @access  Private (Patient)
export const cancelPendingSessionPatient = async (req, res) => {
  const lang = getLang(req);
  try {
    const { sessionId } = req.params;
    const patientId = req.user._id;

    const session = await VideoSession.findOne({
      _id: sessionId,
      patient: patientId,
    });
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Only pending sessions can be cancelled by patient" });
    }

    session.status = "cancelled";
    await session.save();

    res.status(200).json({
      message: "Session request cancelled successfully",
      session,
    });
  } catch (error) {
    console.error(
      "Session Controller Error (cancelPendingSessionPatient):",
      error,
    );
    res.status(500).json({ message: t("SERVER_ERROR", lang) });
  }
};

// @desc    Get upcoming and pending sessions for logged in doctor (today or later)
// @route   GET /api/v1/session/mine/upcoming-and-pending
// @access  Private (Doctor)
export const getDoctorUpcomingAndPendingSessions = async (req, res) => {
  const lang = getLang(req);
  try {
    const doctorId = req.user._id;

    // Start of today (midnight UTC)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Today's date string for exact-day match (YYYY-MM-DD)
    const todayStr = today.toISOString().split("T")[0];

    // Run all queries in parallel
    const [upcomingAndPending, completedCount, todayCount, pendingCount] =
      await Promise.all([
        // 1. Upcoming (accepted) + pending/payment_pending sessions from today onwards
        VideoSession.find({
          doctor: doctorId,
          date: { $gte: today },
          status: { $in: ["pending", "payment_pending", "accepted"] },
        })
          .populate("patient", "fullName")
          .sort({ date: 1, time: 1 }),

        // 2. All-time completed sessions count
        VideoSession.countDocuments({
          doctor: doctorId,
          status: "completed",
        }),

        // 3. Today's accepted sessions count
        VideoSession.countDocuments({
          doctor: doctorId,
          date: new Date(todayStr),
          status: "accepted",
        }),

        // 4. All pending sessions count (not just today+)
        VideoSession.countDocuments({
          doctor: doctorId,
          status: "pending",
        }),
      ]);

    const upcoming = upcomingAndPending.filter((s) => s.status === "accepted");
    const pending = upcomingAndPending.filter((s) => s.status === "pending" || s.status === "payment_pending");

    res.status(200).json({
      upcoming,
      pending,
      stats: {
        today: todayCount,
        pending: pendingCount,
        completed: completedCount,
      },
    });
  } catch (error) {
    console.error("Session Controller (getDoctorUpcomingAndPendingSessions) Error:", error);
    res.status(500).json({ message: t("SERVER_ERROR", lang) });
  }
};

// @desc    Get upcoming (accepted) and pending sessions for logged in patient (today or later)
// @route   GET /api/v1/session/my/upcoming-and-pending
// @access  Private (Patient)
export const getPatientUpcomingAndPendingSessions = async (req, res) => {
  const lang = getLang(req);
  try {
    const patientId = req.user._id;

    // Start of today (midnight UTC)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const sessions = await VideoSession.find({
      patient: patientId,
      date: { $gte: today },
      status: { $in: ["pending", "payment_pending", "accepted"] },
    })
      .populate("doctor", "fullName specializations")
      .sort({ date: 1, time: 1 });

    const upcoming = sessions.filter((s) => s.status === "accepted");
    const pending = sessions.filter((s) => s.status === "pending" || s.status === "payment_pending");

    res.status(200).json({ upcoming, pending, sessions });
  } catch (error) {
    console.error("Session Controller (getPatientUpcomingAndPendingSessions) Error:", error);
    res.status(500).json({ message: t("SERVER_ERROR", lang) });
  }
};

