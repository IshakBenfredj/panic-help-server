import { StreamChat } from "stream-chat";
import { t, getLang } from "../utils/i18n/index.js";
import User from "../models/User.js";

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

    // Generate token
    const token = serverClient.createToken(userId);

    // Upsert the current user into Stream
    await serverClient.upsertUser({
      id: userId,
      name: req.user?.fullName || "User",
      role: "user",
    });

    // If the caller provides otherId (the other chat participant), upsert them too
    // so the channel creation won't fail with "user does not exist"
    const { otherId } = req.query;
    if (otherId) {
      const otherUser = await User.findById(otherId).select("fullName").lean();
      if (otherUser) {
        await serverClient.upsertUser({
          id: otherId.toString(),
          name: otherUser.fullName || "User",
          role: "user",
        });
      }
    }

    res.status(200).json({ token });
  } catch (error) {
    console.error("Stream Controller Error (getStreamToken):", error);
    res.status(500).json({ message: t("SERVER_ERROR", lang) });
  }
};

// @desc    Sync all users from DB to Stream (call once after switching Stream app)
// @route   POST /api/v1/stream/sync-users
// @access  Private (admin use)
export const syncAllUsersToStream = async (req, res) => {
  const lang = getLang(req);
  try {
    const users = await User.find({}).select("_id fullName").lean();
    const streamUsers = users.map((u) => ({
      id: u._id.toString(),
      name: u.fullName || "User",
      role: "user",
    }));

    // Stream allows bulk upsert in batches of 100
    const BATCH = 100;
    for (let i = 0; i < streamUsers.length; i += BATCH) {
      await serverClient.upsertUsers(streamUsers.slice(i, i + BATCH));
    }

    res.status(200).json({ synced: streamUsers.length });
  } catch (error) {
    console.error("Stream sync error:", error);
    res.status(500).json({ message: t("SERVER_ERROR", lang) });
  }
};
