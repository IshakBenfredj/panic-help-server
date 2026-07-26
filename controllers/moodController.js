import Mood from "../models/Mood.js";

export const recordMood = async (req, res) => {
  try {
    const { mood } = req.body;
    const patient = req.user._id;
    const date = new Date().toISOString().split("T")[0];

    const existingMood = await Mood.findOne({ patient, date });
    if (existingMood) {
      existingMood.mood = mood;
      await existingMood.save();
      return res.status(200).json({ message: "Mood updated successfully" });
    }

    const newMood = new Mood({ date, mood, patient });
    await newMood.save();
    res.status(201).json({ mood: newMood });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getMoodHistory = async (req, res) => {
  try {
    const patient = req.body.patient;

    const moodHistory = await Mood.find({ patient }).sort({ createdAt: -1 });
    res.status(200).json({ moodHistory });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getPatientTodayMood = async (req, res) => {
  try {
    const patient = req.user._id;
    const date = new Date().toISOString().split("T")[0];

    const mood = await Mood.findOne({ patient, date });
    if (!mood) {
      return res.status(200).json({ mood: null });
    }
    res.status(200).json({ mood: mood.mood });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
