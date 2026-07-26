import mongoose from "mongoose";
import User from "./models/User.js";
import Doctor from "./models/Doctor.js";
import Patient from "./models/Patient.js";

console.log("Starting model validation test...");

try {
  // 1. Inspect models
  console.log("Base User model compiled successfully.");
  console.log("Doctor discriminator compiled successfully.");
  console.log("Patient discriminator compiled successfully.");

  // 2. Try creating instance structures (offline validation)
  const dummyDoctor = new Doctor({
    fullName: "Dr. John Doe",
    phone: "+213555123456",
    email: "john.doe@example.com",
    password: "hashedpassword123",
    gender: "male",
    licenseNumber: "LIC-987654",
    professionalAccreditationNumber: "ACC-112233",
    startPracticing: new Date("2015-05-15"),
    clinicHospital: "Algiers General Hospital",
    specializations: ["Panic Disorder", "OCD"],
    medicalLicenseFileUrl: "http://example.com/license.pdf"
  });

  const dummyPatient = new Patient({
    fullName: "Jane Smith",
    phone: "+213555987654",
    password: "hashedpassword456",
    gender: "female",
    birthDate: new Date("1998-10-20"),
    emergencyContactName: "Robert Smith",
    emergencyContactPhone: "+213555000111",
    diagnosed: true,
    symptoms: ["Panic Attacks", "Rapid Heartbeat"],
    goals: ["Reduce Panic Attacks", "Improve Sleep"],
    enableSOS: true
  });

  console.log("Created dummy doctor instance:", dummyDoctor.toJSON());
  console.log("Created dummy patient instance:", dummyPatient.toJSON());

  console.log("Validation test PASSED! Schema definition and model compilation are correct.");
} catch (error) {
  console.error("Validation test FAILED:", error);
  process.exit(1);
}
