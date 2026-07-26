import mongoose from "mongoose";
import User from "./User.js";

const doctorSchema = new mongoose.Schema({
  licenseNumber: {
    type: String,
    required: true,
    trim: true,
  },
  professionalAccreditationNumber: {
    type: String,
    required: true,
    trim: true,
  },
  startPracticing: {
    type: Date,
    required: true,
  },
  clinicHospital: {
    type: String,
    required: true,
    trim: true,
  },
  specializations: {
    type: [String],
    default: [],
  },
  medicalLicenseFileUrl: {
    type: String,
    trim: true,
  },
  availableTimes: {
    type: [String],
    default: [],
  },
});

const Doctor = User.discriminator("doctor", doctorSchema);

export default Doctor;
