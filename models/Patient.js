import mongoose from "mongoose";
import User from "./User.js";

const patientSchema = new mongoose.Schema({
  birthDate: {
    type: Date,
    required: true,
  },
  emergencyContactName: {
    type: String,
    required: true,
    trim: true,
  },
  emergencyContactPhone: {
    type: String,
    required: true,
    trim: true,
  },
  symptoms: {
    type: [String],
    default: [],
  },
  questionnaireId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Questionnaire",
    default: null,
  },
});

const Patient = User.discriminator("patient", patientSchema);

export default Patient;
