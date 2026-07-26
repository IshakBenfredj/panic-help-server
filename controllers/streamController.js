import { StreamChat } from "stream-chat";
import { t, getLang } from "../utils/i18n/index.js";

// Initialize Stream Chat Server Client
const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

const serverClient = StreamChat.getInstance(apiKey, apiSecret);

// @desc    Get Stream Chat user token
// @route   GET /api/v1/stream/token
// @access  Private (Patient/Doctor)
export const getStreamToken = async (req, res) => {
  const lang = getLang(req);
  try {
    const userId = req.user._id.toString();

    // Generate token valid for a set time, or without expiration
    const token = serverClient.createToken(userId);

    // Optional: Sync user profile to Stream backend here if needed,
    // though the client can also handle some user details on connect.
    await serverClient.upsertUser({
      id: userId,
      name: req.user?.fullName || "User",
      role: req.user.role === "doctor" ? "user" : "user",
    });

    res.status(200).json({ token });
  } catch (error) {
    console.error("Stream Controller Error (getStreamToken):", error);
    res.status(500).json({ message: t("SERVER_ERROR", lang) });
  }
};
