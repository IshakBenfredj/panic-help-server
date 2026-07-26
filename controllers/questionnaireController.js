// controllers/questionnaireController.js
import Questionnaire from "../models/Questionnaire.js";
import Patient from "../models/Patient.js";
import { t, getLang } from "../utils/i18n/index.js";

export const submitQuestionnaire = async (req, res) => {
  const lang = getLang(req);
  try {
    const {
      diagnosedBefore,
      panicFrequency,
      anxietyImpact,
      currentlyFollowedBy,
      onTreatment,
      mainGoals,
      dailyTimeCommitment,
    } = req.body;

    if (
      !diagnosedBefore ||
      !panicFrequency ||
      !anxietyImpact ||
      !currentlyFollowedBy ||
      !onTreatment ||
      !Array.isArray(mainGoals) ||
      mainGoals.length === 0 ||
      !dailyTimeCommitment
    ) {
      return res.status(400).json({ message: t("MISSING_FIELDS", lang) });
    }

    const patient = await Patient.findById(req.user._id);
    if (!patient) {
      return res.status(404).json({ message: t("USER_NOT_FOUND", lang) });
    }

    const payload = {
      patient: patient._id,
      diagnosedBefore,
      panicFrequency,
      anxietyImpact,
      currentlyFollowedBy,
      onTreatment,
      mainGoals,
      dailyTimeCommitment,
    };

    let questionnaire;
    if (patient.questionnaireId) {
      questionnaire = await Questionnaire.findByIdAndUpdate(
        patient.questionnaireId,
        payload,
        { new: true, runValidators: true },
      );
    } else {
      questionnaire = await Questionnaire.create(payload);
      patient.questionnaireId = questionnaire._id;
      await patient.save();
    }

    res.status(200).json({
      message: t("QUESTIONNAIRE_SAVED", lang),
      questionnaire,
    });
  } catch (error) {
    console.error("Questionnaire Controller Error:", error);
    res.status(500).json({ message: t("SERVER_ERROR", lang) });
  }
};

export const getQuestionnaire = async (req, res) => {
  const lang = getLang(req);
  try {
    const patient = await Patient.findById(req.user._id).populate(
      "questionnaireId",
    );
    if (!patient) {
      return res.status(404).json({ message: t("USER_NOT_FOUND", lang) });
    }

    res.status(200).json({ questionnaire: patient.questionnaireId || null });
  } catch (error) {
    console.error("Questionnaire Controller Error:", error);
    res.status(500).json({ message: t("SERVER_ERROR", lang) });
  }
};
