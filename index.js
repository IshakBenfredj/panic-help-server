import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes.js";
import questionnaireRoutes from "./routes/questionnaireRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import panicRoutes from "./routes/panicRoutes.js";
import moodRoutes from "./routes/moodRoutes.js";
import sessionRoutes from "./routes/sessionRoutes.js";
import streamRoutes from "./routes/streamRoutes.js";
import thoughtRoutes from "./routes/thoughtRoutes.js";

import assessmentRoutes from "./routes/assessmentRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

// import job from "./cron.js";

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ extended: true, limit: "500mb" }));
// job.start();

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/questionnaire", questionnaireRoutes);
app.use("/api/v1/patient", patientRoutes);
app.use("/api/v1/doctor", doctorRoutes);
app.use("/api/v1/panic", panicRoutes);
app.use("/api/v1/mood", moodRoutes);
app.use("/api/v1/session", sessionRoutes);
app.use("/api/v1/stream", streamRoutes);
app.use("/api/v1/thought", thoughtRoutes);
app.use("/api/v1/assessments", assessmentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch((err) => console.log("MongoDB Error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🔥`);
});
