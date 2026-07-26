import Doctor from "../models/Doctor.js";
import User from "../models/User.js";
import Patient from "../models/Patient.js";
import Questionnaire from "../models/Questionnaire.js";
import Mood from "../models/Mood.js";
import { t, getLang } from "../utils/i18n/index.js";

// @desc    Get all doctors (public listing for patients)
// @route   GET /api/v1/doctor
// @access  Private (Patient)
export const getAllDoctors = async (req, res) => {
  const lang = getLang(req);
  try {
    const doctors = await Doctor.find({ role: "doctor" }).select(
      "fullName gender specializations clinicHospital startPracticing availableTimes"
    );

    const result = doctors.map((d) => ({
      id: d._id,
      fullName: d.fullName,
      gender: d.gender,
      specializations: d.specializations,
      clinicHospital: d.clinicHospital,
      startPracticing: d.startPracticing,
      availableTimes: d.availableTimes,
      yearsExperience: d.startPracticing
        ? new Date().getFullYear() - new Date(d.startPracticing).getFullYear()
        : null,
    }));

    res.status(200).json({ doctors: result });
  } catch (error) {
    console.error("Doctor Controller Error (getAllDoctors):", error);
    res.status(500).json({ message: t("SERVER_ERROR", lang) });
  }
};

export const updateDoctorProfile = async (req, res) => {
  const lang = getLang(req);
  try {
    const {
      fullName,
      phone,
      licenseNumber,
      professionalAccreditationNumber,
      startPracticing,
      clinicHospital,
      specializations,
      availableTimes,
    } = req.body;

    const doctor = await Doctor.findById(req.user._id);
    if (!doctor) {
      return res.status(404).json({ message: t("USER_NOT_FOUND", lang) });
    }

    // If phone is changing, check uniqueness
    if (phone && phone !== doctor.phone) {
      const existingPhone = await User.findOne({
        phone,
        _id: { $ne: doctor._id },
      });
      if (existingPhone) {
        return res
          .status(400)
          .json({ message: t("USER_ALREADY_EXISTS", lang) });
      }
      doctor.phone = phone;
    }

    // Update fields if provided
    if (fullName !== undefined) doctor.fullName = fullName;
    if (licenseNumber !== undefined) doctor.licenseNumber = licenseNumber;
    if (professionalAccreditationNumber !== undefined)
      doctor.professionalAccreditationNumber = professionalAccreditationNumber;
    if (startPracticing !== undefined) doctor.startPracticing = startPracticing;
    if (clinicHospital !== undefined) doctor.clinicHospital = clinicHospital;
    if (specializations !== undefined) doctor.specializations = specializations;
    if (availableTimes !== undefined) doctor.availableTimes = availableTimes;

    await doctor.save();

    res.status(200).json({
      message: t("PROFILE_UPDATED", lang),
      user: doctor,
    });
  } catch (error) {
    console.error("Doctor Controller Error:", error);
    res.status(500).json({ message: t("SERVER_ERROR", lang) });
  }
};

export const getDoctorProfile = async (req, res) => {
  const lang = getLang(req);
  try {
    const doctor = await Doctor.findById(req.user._id);
    if (!doctor) {
      return res.status(404).json({ message: t("USER_NOT_FOUND", lang) });
    }

    res.status(200).json({
      user: {
        id: doctor._id,
        fullName: doctor.fullName,
        phone: doctor.phone,
        role: doctor.role,
        licenseNumber: doctor.licenseNumber,
        professionalAccreditationNumber: doctor.professionalAccreditationNumber,
        startPracticing: doctor.startPracticing,
        clinicHospital: doctor.clinicHospital,
        specializations: doctor.specializations,
        availableTimes: doctor.availableTimes,
        medicalLicenseFileUrl: doctor.medicalLicenseFileUrl,
      },
    });
  } catch (error) {
    console.error("Doctor Controller Error:", error);
    res.status(500).json({ message: t("SERVER_ERROR", lang) });
  }
};

export const getPatientInfoForDoctor = async (req, res) => {
  const lang = getLang(req);
  try {
    const { patientId } = req.params;

    const patient = await Patient.findById(patientId).select("-phone -password -__v");
    if (!patient) {
      return res.status(404).json({ message: t("USER_NOT_FOUND", lang) });
    }

    const questionnaire = await Questionnaire.findOne({ patient: patientId });
    
    // Get moods from the last 14 days
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const moods = await Mood.find({
      patient: patientId,
      date: { $gte: twoWeeksAgo }
    }).sort({ date: -1 });

    res.status(200).json({
      patient,
      questionnaire,
      moods,
    });
  } catch (error) {
    console.error("Doctor Controller Error (getPatientInfoForDoctor):", error);
    res.status(500).json({ message: t("SERVER_ERROR", lang) });
  }
};
