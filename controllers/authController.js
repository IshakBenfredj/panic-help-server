import User from "../models/User.js";
import Doctor from "../models/Doctor.js";
import Patient from "../models/Patient.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { t, getLang } from "../utils/i18n/index.js";

dotenv.config();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "fallback_secret", {
    expiresIn: process.env.JWT_EXPIRES || "7d",
  });
};

export const registerPatient = async (req, res) => {
  const lang = getLang(req);
  try {
    const {
      fullName,
      phone,
      password,
      gender,
      birthDate,
      emergencyContactName,
      emergencyContactPhone,
      symptoms,
      goals,
    } = req.body;

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: t("USER_ALREADY_EXISTS", lang) });
    }

    const patient = new Patient({
      fullName,
      phone,
      password,
      gender,
      birthDate,
      emergencyContactName,
      emergencyContactPhone,
      symptoms,
      goals,
      role: "patient",
    });

    await patient.save();

    const token = generateToken(patient._id);

    res.status(201).json({
      message: t("REGISTER_SUCCESS", lang),
      token,
      user: {
        id: patient._id,
        fullName: patient.fullName,
        phone: patient.phone,
        role: patient.role,
        gender: patient.gender,
      },
    });
  } catch (error) {
    console.error("Auth Controller Error:", error);
    res.status(500).json({ message: t("SERVER_ERROR", lang) });
  }
};

export const registerDoctor = async (req, res) => {
  const lang = getLang(req);
  try {
    const {
      fullName,
      phone,
      email,
      password,
      gender,
      licenseNumber,
      professionalAccreditationNumber,
      startPracticing,
      clinicHospital,
      specializations,
      medicalLicenseFileUrl,
    } = req.body;

    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({ message: t("USER_ALREADY_EXISTS", lang) });
    }

    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res
          .status(400)
          .json({ message: t("EMAIL_ALREADY_EXISTS", lang) });
      }
    }

    const doctor = new Doctor({
      fullName,
      phone,
      email,
      password,
      gender,
      licenseNumber,
      professionalAccreditationNumber,
      startPracticing,
      clinicHospital,
      specializations,
      medicalLicenseFileUrl,
      role: "doctor",
    });

    await doctor.save();

    const token = generateToken(doctor._id);

    res.status(201).json({
      message: t("REGISTER_SUCCESS", lang),
      token,
      user: doctor,
    });
  } catch (error) {
    console.error("Auth Controller Error:", error);
    res.status(500).json({ message: t("SERVER_ERROR", lang) });
  }
};

export const login = async (req, res) => {
  const lang = getLang(req);
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: t("MISSING_FIELDS", lang) });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: t("USER_NOT_FOUND", lang) });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: t("INVALID_CREDENTIALS", lang) });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      message: t("LOGIN_SUCCESS", lang),
      token,
      user,
    });
  } catch (error) {
    console.error("Auth Controller Error:", error);
    res.status(500).json({ message: t("SERVER_ERROR", lang) });
  }
};

export const getMe = (req, res) => {
  const user = req.user;
  res.status(200).json({
    user,
  });
};
