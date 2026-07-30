import mongoose from "mongoose";
import { StreamChat } from "stream-chat";

async function run() {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/panic-help");
    const serverClient = StreamChat.getInstance(
      "xcxy9pkthzbq",
      "7v38fhd4ak3t7bjprndxq959jwbtnv7feywd423h3cyydy75kznvmmykzesu5s2y",
    );

    // Define dummy schema to drop sessions
    const sessionSchema = new mongoose.Schema({}, { strict: false });
    const VideoSession = mongoose.model("VideoSession", sessionSchema);

    const sessions = await VideoSession.find({});
    console.log("Found " + sessions.length + " sessions. Deleting...");

    for (const s of sessions) {
      if (s.streamChannelId) {
        try {
          const channel = serverClient.channel("messaging", s.streamChannelId);
          await channel.delete();
          console.log("Deleted stream channel: " + s.streamChannelId);
        } catch (e) {
          console.log(
            "Stream channel delete error (might not exist):",
            e.message,
          );
        }
      }
    }

    await VideoSession.deleteMany({});
    console.log("All sessions deleted successfully from DB.");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

run();
