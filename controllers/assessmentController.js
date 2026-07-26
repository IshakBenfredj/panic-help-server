import AssessmentResult from "../models/AssessmentResult.js";
import Patient from "../models/Patient.js";
import User from "../models/User.js";

// @desc    Save assessment result (GAD-7, PHQ-9, Panic PHQ, etc.)
// @route   POST /api/assessments/:type
// @access  Private (Patient)
const saveAssessment = async (req, res) => {
  try {
    const { type } = req.params;
    const { data, totalScore, severity, notes } = req.body;

    const patient = await User.findById(req.user._id);

    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    // Validate assessment type
    const validTypes = ["gad7", "phq9", "panic-phq", "questionnaire"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: "Invalid assessment type" });
    }

    const assessment = await AssessmentResult.create({
      patient: patient._id,
      type,
      data,
      totalScore,
      severity,
      notes,
      completedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Assessment saved successfully",
      data: {
        id: assessment._id,
        type,
        totalScore,
        severity,
        completedAt: assessment.completedAt,
      },
    });
  } catch (error) {
    console.error("Save assessment error:", error);
    res.status(500).json({
      success: false,
      message: "Error saving assessment",
    });
  }
};

// @desc    Get all assessments for current patient (with pagination & filter)
// @route   GET /api/assessments
// @access  Private
const getAssessments = async (req, res) => {
  try {
    const { type } = req.query;

    const query = { patient: req.user._id };
    if (type) query.type = type;

    const assessments = await AssessmentResult.find(query).sort({
      completedAt: -1,
    });

    res.json({
      success: true,
      data: assessments,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching assessments" });
  }
};

// @desc    Get latest assessment by type
// @route   GET /api/assessments/latest/:type
const getLatestAssessment = async (req, res) => {
  try {
    const { type } = req.params;

    const latest = await AssessmentResult.findOne({
      patient: req.user._id,
      type,
    }).sort({ completedAt: -1 });

    res.json({
      success: true,
      data: latest,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching latest assessment" });
  }
};

export { saveAssessment, getAssessments, getLatestAssessment };
