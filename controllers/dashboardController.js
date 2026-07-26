import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";
import PanicSession from "../models/PanicSession.js";
import Mood from "../models/Mood.js";
import AssessmentResult from "../models/AssessmentResult.js";
import Questionnaire from "../models/Questionnaire.js";

// GET /api/dashboard/stats
export const getDashboardStats = async (req, res) => {
  try {
    const totalPatients = await Patient.countDocuments();
    const activePanicSessions = await PanicSession.countDocuments({
      isAbandoned: false,
    });
    const totalDoctors = await Doctor.countDocuments();

    const recoveryAgg = await PanicSession.aggregate([
      {
        $match: {
          isAbandoned: false,
          durationSeconds: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: null,
          avgRecoveryTime: { $avg: "$durationSeconds" },
        },
      },
    ]);

    const avgRecoveryTimeSeconds =
      recoveryAgg.length > 0 ? Math.round(recoveryAgg[0].avgRecoveryTime) : 0;

    const avgRecoveryTime = Math.round(avgRecoveryTimeSeconds / 60);
    const recentPanicSessions = await PanicSession.find()
      .populate("patient")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    console.log(recentPanicSessions);

    res.status(200).json({
      success: true,
      data: {
        totalPatients,
        activePanicSessions,
        totalDoctors,
        avgRecoveryTime,
        recentPanicSessions,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "خطأ في استجلاب بيانات لوحة التحكم",
      error: error.message,
    });
  }
};

// GET /api/dashboard/patients
export const getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: patients,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "خطأ في استجلاب قائمة المرضى",
      error: error.message,
    });
  }
};

// GET /api/dashboard/patients/:id
export const getPatientDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await Patient.findById(id).select("-password").lean();

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "المريض غير موجود",
      });
    }

    const panicSessions = await PanicSession.find({ patient: id })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: {
        patient,
        panicSessions,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "خطأ في استجلاب تفاصيل المريض",
      error: error.message,
    });
  }
};

// GET /api/dashboard/patients/:id/moods
export const getPatientMoods = async (req, res) => {
  try {
    const { id } = req.params;
    const moods = await Mood.find({ patient: id }).sort({ date: -1 }).lean();
    res.status(200).json({ success: true, data: moods });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "خطأ في استجلاب سجل المزاج",
      error: error.message,
    });
  }
};

// GET /api/dashboard/patients/:id/assessments
export const getPatientAssessments = async (req, res) => {
  try {
    const { id } = req.params;
    const assessments = await AssessmentResult.find({ patient: id })
      .sort({ completedAt: -1 })
      .lean();
    res.status(200).json({ success: true, data: assessments });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "خطأ في استجلاب نتائج التقييمات",
      error: error.message,
    });
  }
};

// GET /api/dashboard/patients/:id/questionnaire
export const getPatientQuestionnaire = async (req, res) => {
  try {
    const { id } = req.params;
    const questionnaire = await Questionnaire.findOne({ patient: id })
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json({ success: true, data: questionnaire });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "خطأ في استجلاب الاستبيان",
      error: error.message,
    });
  }
};

// GET /api/dashboard/panic-sessions
export const getAllPanicSessions = async (req, res) => {
  try {
    const sessions = await PanicSession.find()
      .populate("patient", "fullName phone email emergencyContactPhone")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "خطأ في استجلاب جلسات الفزع",
      error: error.message,
    });
  }
};

// GET /api/dashboard/doctors
export const getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: doctors,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "خطأ في استجلاب قائمة الأطباء",
      error: error.message,
    });
  }
};

// GET /api/dashboard/doctors/:id
export const getDoctorDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const doctor = await Doctor.findById(id).select("-password").lean();

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "الطبيب غير موجود",
      });
    }

    res.status(200).json({
      success: true,
      data: doctor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "خطأ في استجلاب تفاصيل الطبيب",
      error: error.message,
    });
  }
};

// GET /api/dashboard/assessments
export const getAllAssessments = async (req, res) => {
  try {
    const assessments = await AssessmentResult.find()
      .populate("patient", "fullName phone email")
      .sort({ completedAt: -1, createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: assessments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "خطأ في استجلاب قائمة التقييمات",
      error: error.message,
    });
  }
};

// GET /api/dashboard/moods
export const getAllMoods = async (req, res) => {
  try {
    const moods = await Mood.find()
      .populate("patient", "fullName phone email")
      .sort({ date: -1, createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: moods,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "خطأ في استجلاب سجل المزاج",
      error: error.message,
    });
  }
};


