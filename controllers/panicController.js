// controllers/panicController.js
import PanicSession from "../models/PanicSession.js";
import { t, getLang } from "../utils/i18n/index.js";

export const createPanicSession = async (req, res) => {
  const lang = getLang(req);
  try {
    const {
      startedAt,
      endedAt,
      durationSeconds,
      wasInSafeLocation,
      severityBefore,
      severityAfter,
      exercisesCompleted,
      contactedSpecialist,
      requestedVideoSession,
      calledEmergencyContact,
      requestedEmergencyServices,
      emergencyServiceCalled,
      isAbandoned,
      abandonedAtStep,
    } = req.body;

    if (!startedAt || !endedAt) {
      return res.status(400).json({ message: t("MISSING_FIELDS", lang) });
    }

    const session = await PanicSession.create({
      patient: req.user._id,
      startedAt,
      endedAt,
      durationSeconds,
      wasInSafeLocation,
      severityBefore: severityBefore ?? null,
      severityAfter: severityAfter ?? null,
      exercisesCompleted: exercisesCompleted || [],
      contactedSpecialist: !!contactedSpecialist,
      requestedVideoSession: !!requestedVideoSession,
      calledEmergencyContact: !!calledEmergencyContact,
      requestedEmergencyServices: !!requestedEmergencyServices,
      emergencyServiceCalled: emergencyServiceCalled || null,
      isAbandoned: !!isAbandoned,
      abandonedAtStep: isAbandoned ? (abandonedAtStep ?? null) : null,
    });

    res.status(201).json({
      message: t("PANIC_SESSION_SAVED", lang),
      session,
    });
  } catch (error) {
    console.error("Panic Controller Error:", error);
    res.status(500).json({ message: t("SERVER_ERROR", lang) });
  }
};


export const getPanicSessions = async (req, res) => {
  const lang = getLang(req);
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      PanicSession.find({ patient: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      PanicSession.countDocuments({ patient: req.user._id }),
    ]);

    res.status(200).json({
      message: t("PANIC_SESSIONS_FETCHED", lang),
      sessions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Panic Controller Error:", error);
    res.status(500).json({ message: t("SERVER_ERROR", lang) });
  }
};

export const getPatientSessions = async (req, res) => {
  const lang = getLang(req);
  try {
    const { patientId } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      PanicSession.find({ patient: patientId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      PanicSession.countDocuments({ patient: patientId }),
    ]);

    res.status(200).json({
      message: t("PANIC_SESSIONS_FETCHED", lang),
      sessions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Panic Controller Error:", error);
    res.status(500).json({ message: t("SERVER_ERROR", lang) });
  }
};

export const getPatientLatestSession = async (req, res) => {
  const lang = getLang(req);
  try {
    const { patientId } = req.params;

    const session = await PanicSession.findOne({ patient: patientId }).sort({
      createdAt: -1,
    });

    if (!session) {
      return res
        .status(404)
        .json({ message: t("PANIC_SESSION_NOT_FOUND", lang) });
    }

    res.status(200).json({ session });
  } catch (error) {
    console.error("Panic Controller Error:", error);
    res.status(500).json({ message: t("SERVER_ERROR", lang) });
  }
};
