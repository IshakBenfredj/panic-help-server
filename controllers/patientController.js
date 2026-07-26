import Patient from "../models/Patient.js";
import User from "../models/User.js";
import { t, getLang } from "../utils/i18n/index.js";

export const updatePatientProfile = async (req, res) => {
  const lang = getLang(req);
  try {
    const {
      fullName,
      phone,
      gender,
      birthDate,
      emergencyContactName,
      emergencyContactPhone,
      symptoms,
    } = req.body;

    const patient = await Patient.findById(req.user._id);
    if (!patient) {
      return res.status(404).json({ message: t("USER_NOT_FOUND", lang) });
    }

    // If phone is changing, make sure it's not taken by another user
    if (phone && phone !== patient.phone) {
      const existingPhone = await User.findOne({
        phone,
        _id: { $ne: patient._id },
      });
      if (existingPhone) {
        return res
          .status(400)
          .json({ message: t("USER_ALREADY_EXISTS", lang) });
      }
      patient.phone = phone;
    }

    if (fullName !== undefined) patient.fullName = fullName;
    if (gender !== undefined) patient.gender = gender;
    if (birthDate !== undefined) patient.birthDate = birthDate;
    if (emergencyContactName !== undefined)
      patient.emergencyContactName = emergencyContactName;
    if (emergencyContactPhone !== undefined)
      patient.emergencyContactPhone = emergencyContactPhone;
    if (symptoms !== undefined) patient.symptoms = symptoms;

    await patient.save();

    res.status(200).json({
      message: t("PROFILE_UPDATED", lang),
      user: patient,
    });
  } catch (error) {
    console.error("Patient Controller Error:", error);
    res.status(500).json({ message: t("SERVER_ERROR", lang) });
  }
};

export const getPatientProfile = async (req, res) => {
  const lang = getLang(req);
  try {
    const patient = await Patient.findById(req.user._id);
    if (!patient) {
      return res.status(404).json({ message: t("USER_NOT_FOUND", lang) });
    }

    res.status(200).json({
      user: {
        id: patient._id,
        fullName: patient.fullName,
        phone: patient.phone,
        role: patient.role,
        gender: patient.gender,
        birthDate: patient.birthDate,
        emergencyContactName: patient.emergencyContactName,
        emergencyContactPhone: patient.emergencyContactPhone,
        symptoms: patient.symptoms,
      },
    });
  } catch (error) {
    console.error("Patient Controller Error:", error);
    res.status(500).json({ message: t("SERVER_ERROR", lang) });
  }
};
